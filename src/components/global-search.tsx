'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Search, ExternalLink, Download, Globe, X, 
  ClipboardList, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

export function GlobalSearch() {
  const store = useAppStore();
  const profile = store.currentProfile;
  const [query, setQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<{ html: string; name: string } | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null);
  
  if (!profile) return null;
  
  // Search in local projects
  const localResults = query.trim()
    ? profile.projects.filter(p => 
        p.testId.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.applicationName.toLowerCase().includes(query.toLowerCase()) ||
        p.testerName.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  
  const handleUploadAndSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.json';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      if (file.name.endsWith('.html')) {
        // Read HTML and extract test-id from meta tag
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          const match = content.match(/<meta\s+name="test-id"\s+content="([^"]+)"/i);
          if (match) {
            setQuery(match[1]);
            toast.info(`Test ID ditemukan: ${match[1]}`);
          } else {
            toast.error('Tidak ada Test ID di dalam file HTML ini');
          }
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.json')) {
        // Read JSON and extract testId
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const content = ev.target?.result as string;
            const data = JSON.parse(content);
            const testId = data.project?.testId || data.testId;
            if (testId) {
              setQuery(testId);
              toast.info(`Test ID ditemukan: ${testId}`);
            } else {
              toast.error('Tidak ada Test ID di dalam file JSON ini');
            }
          } catch {
            toast.error('File JSON tidak valid');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const handlePreviewReport = (projectName: string) => {
    const project = profile.projects.find(p => p.name === projectName);
    if (!project) return;
    const html = store.generateHTMLReport(project.id, false);
    if (!html) return;
    setSelectedReport({ html, name: projectName });
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto w-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Global Search</h2>
        <p className="text-muted-foreground text-sm">
          Cari project berdasarkan Test ID, nama project, atau nama aplikasi.
        </p>
      </div>
      
      {/* Search Box */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari Test ID (contoh: BBT-XXXXXXXX), nama project..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleUploadAndSearch} className="gap-2 shrink-0">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>
      
      {/* Upload hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Klik &quot;Upload&quot; untuk upload file HTML report atau JSON project. 
          Test ID akan otomatis diekstrak untuk pencarian lokal.
          Untuk search online, host HTML report kamu di GitHub Pages / Netlify.
        </span>
      </div>
      
      {/* Results */}
      {query.trim() && (
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">
            Hasil pencarian untuk &quot;{query}&quot; — {localResults.length} ditemukan (lokal)
          </h3>
          
          {localResults.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <h4 className="font-medium text-muted-foreground">Tidak ada hasil</h4>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Project dengan query &quot;{query}&quot; tidak ditemukan di data lokal kamu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {localResults.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-[10px]">{project.testId}</Badge>
                          <span className="text-xs text-muted-foreground">{project.applicationName}</span>
                          <span className="text-xs text-muted-foreground">by {project.testerName}</span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => store.navigate({ type: 'project', projectId: project.id })}
                          className="gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePreviewReport(project.name)}
                          className="gap-1.5"
                        >
                          <Globe className="w-3 h-3" />
                          Preview HTML
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!query.trim() && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <h4 className="font-medium text-muted-foreground">Mulai pencarian</h4>
            <p className="text-sm text-muted-foreground/70 mt-1">Ketik Test ID, nama project, atau upload file report</p>
          </CardContent>
        </Card>
      )}
      
      {/* HTML Preview Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview: {selectedReport?.name}</DialogTitle>
            <DialogDescription>Preview laporan HTML yang akan digenerate</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {selectedReport && (
              <iframe
                srcDoc={selectedReport.html}
                className="w-full h-[600px] border rounded-lg"
                title="Report Preview"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Tutup</Button>
            {selectedReport && (() => {
              const project = profile.projects.find(p => p.name === selectedReport.name);
              if (!project) return null;
              return (
                <Button 
                  onClick={() => {
                    const html = store.generateHTMLReport(project.id, false);
                    if (!html) return;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `bbt-report-${project.testId}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Report berhasil di-download!');
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </Button>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  );
}
