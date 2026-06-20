# BBT Reporter - Cloud Gateway

## Cara Upload ke InfinityFree / Hosting PHP

### Langkah-langkah:

1. **Upload semua file** di folder ini ke hosting PHP kamu via File Manager
2. **Edit `config.php`** — ubah `API_KEY` dengan string random yang aman
3. **Pastikan folder `data/` writable** (CHMOD 755 atau 777)
4. **Test gateway** — buka browser: `https://domain-mu.com/bbt-gateway/api/search.php?q=test`

### Struktur File:
```
bbt-cloud-gateway/
├── config.php          ← Konfigurasi (WAJIB edit API_KEY)
├── .htaccess           ← Security rules
├── api/
│   ├── upload.php      ← Upload project JSON
│   ├── download.php    ← Download by Test ID (&format=html)
│   ├── search.php      ← Cari project
│   └── delete.php      ← Hapus project
└── data/
    ├── .htaccess       ← Blokir akses langsung
    └── index.json      ← Auto-generated index
```

### API Endpoints:

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/search.php?q=KEYWORD` | Cari project |
| GET | `/api/download.php?id=BBT-XXXX` | Download JSON |
| GET | `/api/download.php?id=BBT-XXXX&format=html` | Lihat HTML Report |
| POST | `/api/upload.php` | Upload JSON |
| DELETE | `/api/delete.php?id=BBT-XXXX` | Hapus project |

### Keamanan:
- `upload.php` dan `delete.php` WAJIB API Key (header: `X-API-Key`)
- `download.php` dan `search.php` publik (untuk sharing)
- Folder `data/` dilindungi `.htaccess`

### Di Frontend (BBT Reporter):
Masukkan URL gateway di Settings → Cloud Server URL:
`https://domain-mu.com/bbt-gateway`
