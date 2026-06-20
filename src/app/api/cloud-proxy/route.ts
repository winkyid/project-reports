import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv } from "crypto";

/**
 * Cloud Proxy — routes all cloud API calls through our own Next.js server
 * to avoid CORS and InfinityFree JS anti-bot challenge.
 *
 * Handles the __test cookie challenge by solving AES-128-CBC server-side.
 * For POST requests: first solve challenge via GET, then POST with cookie.
 *
 * Usage:
 *   GET  /api/cloud-proxy?action=search&q=test
 *   GET  /api/cloud-proxy?action=download&id=BBT-XXXXXXXX
 *   POST /api/cloud-proxy?action=upload          body: { testId, data }
 *   POST /api/cloud-proxy?action=delete&id=BBT-XXXXXXXX
 */

const CLOUD_URL = process.env.CLOUD_URL || "https://siakadumpr-tes.page.gd/bbt-cloud-gateway";
const CLOUD_KEY = process.env.CLOUD_KEY || "bbt-reporter-2024-change-this-key";

// Cache solved cookie
let cachedTestCookie: { value: string; expires: number } | null = null;

function solveChallenge(html: string): string | null {
  const match = html.match(
    /toNumbers\("([0-9a-f]+)"\).*?toNumbers\("([0-9a-f]+)"\).*?toNumbers\("([0-9a-f]+)"\)/s
  );
  if (!match) return null;

  const key = Buffer.from(match[1], "hex");
  const iv = Buffer.from(match[2], "hex");
  const cipherBuf = Buffer.from(match[3], "hex");

  try {
    const decipher = createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
    return decrypted.toString("hex");
  } catch {
    return null;
  }
}

function extractRedirectUrl(html: string): string | null {
  const match = html.match(/location\.href="([^"]+)"/);
  return match ? match[1] : null;
}

function isChallengePage(text: string, contentType: string): boolean {
  return contentType.includes("text/html") && text.includes("slowAES");
}

/**
 * Ensure we have a valid __test cookie. Solves challenge if needed.
 */
async function ensureCookie(): Promise<string | null> {
  // Use cached if valid
  if (cachedTestCookie && cachedTestCookie.expires > Date.now()) {
    return cachedTestCookie.value;
  }

  // Solve challenge with a GET request
  const challengeUrl = `${CLOUD_URL}/api/search.php?q=_health`;
  try {
    const resp = await fetch(challengeUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    const html = await resp.text();
    const contentType = resp.headers.get("content-type") || "";

    if (!isChallengePage(html, contentType)) {
      // No challenge needed, cache empty
      cachedTestCookie = { value: "", expires: Date.now() + 6 * 3600_000 };
      return "";
    }

    const cookieValue = solveChallenge(html);
    if (!cookieValue) return null;

    cachedTestCookie = {
      value: cookieValue,
      expires: Date.now() + 6 * 3600_000,
    };

    return cookieValue;
  } catch {
    return null;
  }
}

/**
 * Make the actual request with cookie, handling post-challenge redirect.
 */
async function doFetch(
  targetUrl: string,
  opts: RequestInit
): Promise<{ status: number; contentType: string; text: string }> {
  const resp = await fetch(targetUrl, {
    ...opts,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });

  const respText = await resp.text();
  const respContentType = resp.headers.get("content-type") || "";

  // If challenge page returned (cookie expired or invalid), return as-is
  if (isChallengePage(respText, respContentType)) {
    cachedTestCookie = null;
    return { status: 502, contentType: "application/json", text: JSON.stringify({ success: false, error: "Challenge page returned. Cookie may have expired." }) };
  }

  return { status: resp.status, contentType: respContentType, text: respText };
}

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  let targetPath = "";
  let method = req.method;
  let headers: Record<string, string> = {};
  let body: string | undefined;

  switch (action) {
    case "search": {
      const q = url.searchParams.get("q") || "";
      targetPath = `${CLOUD_URL}/api/search.php?q=${encodeURIComponent(q)}`;
      break;
    }
    case "download": {
      const id = url.searchParams.get("id") || "";
      targetPath = `${CLOUD_URL}/api/download.php?id=${encodeURIComponent(id)}`;
      break;
    }
    case "upload": {
      targetPath = `${CLOUD_URL}/api/upload.php`;
      headers["Content-Type"] = "application/json";
      headers["X-API-Key"] = CLOUD_KEY;
      body = await req.text();
      break;
    }
    case "delete": {
      const id = url.searchParams.get("id") || "";
      targetPath = `${CLOUD_URL}/api/delete.php?id=${encodeURIComponent(id)}`;
      headers["X-API-Key"] = CLOUD_KEY;
      break;
    }
    default:
      return NextResponse.json(
        { success: false, error: "Invalid action. Use: search, download, upload, delete" },
        { status: 400 }
      );
  }

  try {
    // Step 1: Solve challenge & get cookie
    const cookie = await ensureCookie();
    if (cookie === null) {
      return NextResponse.json(
        { success: false, error: "Failed to solve cloud server challenge." },
        { status: 502 }
      );
    }

    // Step 2: Attach cookie to headers
    if (cookie) {
      headers["Cookie"] = `__test=${cookie}`;
    }

    // Step 3: Make the actual request
    const fetchOpts: RequestInit = { method, headers };
    if (body) fetchOpts.body = body;

    const { status, contentType, text } = await doFetch(targetPath, fetchOpts);

    // Handle empty body 500 errors from PHP
    if (status >= 500 && !text.trim()) {
      return NextResponse.json(
        { success: false, error: `Cloud server error (${status}). PHP upload.php mungkin perlu di-update. Cek folder bbt-cloud-gateway di download/.` },
        { status: 502 }
      );
    }

    // HTML pass-through (for download.php?format=html)
    if (contentType.includes("text/html")) {
      return new NextResponse(text, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // JSON response
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(json, { status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Proxy connection failed";
    cachedTestCookie = null;
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}
