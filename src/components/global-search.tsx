'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, ExternalLink, Download, Globe, X, 
  AlertCircle, Cloud, Loader2, CloudOff 
} from 'lucide-react';
import { toast } from 'sonner';

export function GlobalSearch() {
  const store = useAppStore();
  const profile = store.currentProfile;
  const [query, setQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<{ html: string; name: string } | null>(null);
  
  // Cloud search state
  const [cloudResults, setCloudResults] = useState<any[]>([]);
  const [cloudSearching, setCloudSearching] = useState(false);
  const [cloudSearched, setCloudSearched] = useState(false);
  const [cloudMessage, setCloudMessage] = useState('');
  
  // Local search
  const localResults = query.trim()
    ? profile.projects.filter(p => 
        p.testId.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.applicationName.toLowerCase().includes(query.toLowerCase()) ||
        p.testerName.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  
  // Cloud search with debounce
  useEffect(() => {
    let cancelled = false;
    
    const doSearch = async () => {
      if (!query.trim() || !store.cloudServerUrl) {
        setCloudResults([]);
        setCloudSearched(false);
        return;
      }
      
      setCloudSearching(true);
      setCloudSearched(true);
      const result = await store.searchCloud(query);
      if (!cancelled) {
        setCloudSearching(false);
        if (result.success && result.results) {
          setCloudResults(result.results);
          setCloudMessage(result.message);
        } else {
          setCloudResults([]);
          setCloudMessage(result.message);
        }
      }
    };
    
    const timer = setTimeout(doSearch, 500);
    
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, store.cloudServerUrl, store]);
  
  const handleUploadAndSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.json';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      if (file.name.endsWith('.html')) {
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
  
  const hasCloud = !!store.cloudServerUrl;
  
  if (!profile) return null;
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto w-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Global Search</h2>
        <p className="text-muted-foreground text-sm">
          Cari project berdasarkan Test ID, nama project, atau nama aplikasi.
          {hasCloud && ' Pencarian juga dilakukan di cloud server.'}
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
      
      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Klik &quot;Upload&quot; untuk upload file HTML/JSON, atau ketik langsung Test ID.
          {hasCloud 
            ? ' Hasil dari cloud server juga akan muncul otomatis.' 
            : ' Untuk search cloud, konfigurasi server di Settings > Cloud.'}
        </span>
      </div>
      
      {/* Results */}
      {query.trim() && (
        <div className="space-y-6">
          {/* Local Results */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Lokal — {localResults.length} ditemukan
            </h3>
            {localResults.length === 0 ? (
              <p className="text-sm text-muted-foreground/70 pl-2">Tidak ditemukan di data lokal.</p>
            ) : (
              <div className="space-y-2">
                {localResults.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="font-mono text-[10px]">{project.testId}</Badge>
                            <span className="text-xs text-muted-foreground">{project.applicationName}</span>
                            <span className="text-xs text-muted-foreground">by {project.testerName}</span>
                            <Badge variant="secondary" className="text-[10px]">Lokal</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" variant="outline"
                            onClick={() => store.navigate({ type: 'project', projectId: project.id })}
                            className="gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </Button>
                          <Button 
                            size="sm" variant="outline"
                            onClick={() => handlePreviewReport(project.name)}
                            className="gap-1.5"
                          >
                            <Globe className="w-3 h-3" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Cloud Results */}
          {hasCloud && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Cloud — {cloudSearching ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Mencari...
                    </span>
                  ) : cloudSearched ? (
                    `${cloudResults.length} ditemukan`
                  ) : (
                    'Menunggu...'
                  )}
                </h3>
                
                {!cloudSearching && cloudMessage && cloudResults.length === 0 && (
                  <p className="text-sm text-muted-foreground/70 pl-2">{cloudMessage}</p>
                )}
                
                {cloudResults.length > 0 && (
                  <div className="space-y-2">
                    {cloudResults.map((item, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.projectName || 'Unnamed Project'}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="font-mono text-[10px]">{item.testId}</Badge>
                                <span className="text-xs text-muted-foreground">{item.applicationName || '-'}</span>
                                {item.tester && <span className="text-xs text-muted-foreground">by {item.tester}</span>}
                                <Badge variant="secondary" className="text-[10px]">Cloud</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" variant="outline"
                                onClick={() => window.open(`/api/cloud-proxy?action=download&id=${item.testId}`, '_blank')}
                                className="gap-1.5"
                              >
                                <Globe className="w-3 h-3" />
                                View Report
                              </Button>
                              <Button 
                                size="sm" variant="outline"
                                onClick={async () => {
                                  const result = await store.downloadFromCloud(item.testId);
                                  if (result.success && result.data) {
                                    const jsonStr = JSON.stringify(result.data, null, 2);
                                    const blob = new Blob([jsonStr], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${item.testId}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('JSON berhasil didownload dari cloud!');
                                  } else {
                                    toast.error(result.message);
                                  }
                                }}
                                className="gap-1.5"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          
          {!hasCloud && (
            <>
              <Separator />
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CloudOff className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Cloud search tidak aktif</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Konfigurasi cloud server di Settings &gt; Cloud</p>
                </CardContent>
              </Card>
            </>
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
