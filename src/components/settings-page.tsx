'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, Upload, FileJson, Globe, User, Mail, Building,
  Shield, FileDown, FileUp, Search 
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const store = useAppStore();
  const profile = store.currentProfile;
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const projectInputRef = useState<HTMLInputElement | null>(null);
  
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [org, setOrg] = useState(profile?.organization || '');
  
  if (!profile) return null;
  
  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong!');
      return;
    }
    store.updateProfile({ name: name.trim(), email: email.trim() || undefined, organization: org.trim() || undefined });
    toast.success('Profile berhasil diupdate');
  };
  
  const handleExportAll = () => {
    const json = store.exportProfile();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbt-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Profile berhasil di-export!');
  };
  
  const handleExportProject = (projectId: string, anonymize: boolean) => {
    const json = store.exportProject(projectId, anonymize);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbt-project-${anonymize ? 'anon-' : ''}${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Project berhasil di-export ${anonymize ? '(anonymized)' : ''}`);
  };
  
  const handleExportHTML = (projectId: string, anonymize: boolean) => {
    const html = store.generateHTMLReport(projectId, anonymize);
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbt-report-${anonymize ? 'anon-' : ''}${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`HTML Report berhasil di-generate ${anonymize ? '(anonymized)' : ''}`);
  };
  
  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const success = store.importProject(content);
      if (success) {
        toast.success('Project berhasil diimpor!');
      } else {
        toast.error('File tidak valid atau project sudah ada');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto w-full">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="export">Export & Import</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Profile</CardTitle>
              <CardDescription>Informasi profil kamu. Data disimpan lokal di browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">Nama Lengkap</Label>
                <Input
                  id="s-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-org">Organisasi</Label>
                <Input
                  id="s-org"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile}>Simpan Perubahan</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <FileJson className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Semua data disimpan di <strong>localStorage browser kamu</strong> sebagai file JSON. Tidak ada server atau database yang menyimpan data kamu.</p>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Saat export project, kamu bisa pilih <strong>&quot;Anonymize&quot;</strong> untuk menyembunyikan nama tester dan identitas pribadi sebelum dibagikan.</p>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Untuk upload ke cloud, gunakan fitur <strong>Generate HTML Report</strong>. File HTML bisa di-host di GitHub Pages, Netlify, atau static hosting lainnya secara gratis.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={store.logout} className="gap-2">
                <Shield className="w-4 h-4" />
                Logout & Hapus Data Lokal
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Pastikan kamu sudah export data sebelum logout. Data yang sudah dihapus tidak bisa dikembalikan.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export & Import Tab */}
        <TabsContent value="export" className="space-y-4">
          {/* Export All Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                Export Semua Data
              </CardTitle>
              <CardDescription>Download seluruh profile dan semua project sebagai satu file JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportAll} className="gap-2">
                <Download className="w-4 h-4" />
                Export Full Profile (JSON)
              </Button>
            </CardContent>
          </Card>
          
          {/* Import Project */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Import Project
              </CardTitle>
              <CardDescription>Import project dari file JSON yang sudah di-export sebelumnya.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={projectInputRef as unknown as React.RefObject<HTMLInputElement>}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportProject}
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = ev.target?.result as string;
                      const success = store.importProject(content);
                      if (success) {
                        toast.success('Project berhasil diimpor!');
                      } else {
                        toast.error('File tidak valid atau project sudah ada');
                      }
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Pilih File JSON
              </Button>
            </CardContent>
          </Card>
          
          {/* Per-Project Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Per Project</CardTitle>
              <CardDescription>Export individual project dalam berbagai format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.projects.map((project) => (
                <div key={project.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{project.testId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleExportProject(project.id, false)} className="text-xs gap-1">
                      <FileJson className="w-3 h-3" /> JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportProject(project.id, true)} className="text-xs gap-1">
                      <Shield className="w-3 h-3" /> JSON (Anon)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportHTML(project.id, false)} className="text-xs gap-1">
                      <Globe className="w-3 h-3" /> HTML
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportHTML(project.id, true)} className="text-xs gap-1">
                      <Shield className="w-3 h-3" /> HTML (Anon)
                    </Button>
                  </div>
                </div>
              ))}
              
              {profile.projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada project untuk di-export.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Tentang BBT Reporter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Apa itu BBT Reporter?</h4>
                <p className="text-muted-foreground">
                  BBT (Black Box Testing) Reporter adalah aplikasi web untuk mencatat dan mengelola hasil laporan black box testing. 
                  Dirancang dengan pendekatan privacy-first di mana semua data disimpan lokal di browser masing-masing user.
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Cara Kerja Cloud Upload</h4>
                <p className="text-muted-foreground">
                  Karena tidak menggunakan database, fitur &quot;upload to cloud&quot; bekerja dengan cara:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Generate HTML Report dari project kamu</li>
                  <li>Upload file HTML tersebut ke GitHub Pages, Netlify, Vercel, atau static host lainnya</li>
                  <li>Test ID (format: BBT-XXXXXXXX) tertanam di meta tag HTML untuk keperluan pencarian</li>
                  <li>Siapapun yang punya Test ID bisa menemukan dan melihat report kamu</li>
                </ol>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Keamanan Data</h4>
                <p className="text-muted-foreground">
                  Saat export, kamu bisa memilih mode &quot;Anonymize&quot; untuk menyembunyikan identitas 
                  (nama tester akan ditampilkan sebagai &quot;***&quot;). File JSON yang di-export berisi seluruh data, 
                  jadi simpan dengan aman.
                </p>
              </div>
              <Separator />
              <div className="text-center text-muted-foreground text-xs pt-2">
                BBT Reporter v1.0.0 — Built with Next.js, shadcn/ui, and Zustand
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
