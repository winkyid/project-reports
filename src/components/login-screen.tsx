'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  ClipboardList, UserPlus, FileUp, Shield, ChevronRight, 
  AlertCircle, CheckCircle2, Upload 
} from 'lucide-react';
import { toast } from 'sonner';

export function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'new' | 'import'>('new');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createNewUser = useAppStore(s => s.createNewUser);
  const importUserFromFile = useAppStore(s => s.importUserFromFile);
  
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama harus diisi ya cuy!');
      return;
    }
    createNewUser(name.trim(), email.trim() || undefined, organization.trim() || undefined);
    toast.success(`Selamat datang, ${name.trim()}! 🎉`);
  };
  
  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('File harus berformat JSON (.json)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importUserFromFile(content);
      if (success) {
        toast.success('Profile berhasil diimpor! 🎉');
      } else {
        toast.error('File JSON tidak valid atau format salah');
      }
    };
    reader.readAsText(file);
  }, [importUserFromFile]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-lg">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BBT Reporter</h1>
          <p className="text-muted-foreground mt-1">Black Box Testing Report Manager</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex rounded-lg border bg-card p-1 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'new' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            New User
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'import' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileUp className="w-4 h-4" />
            Import File
          </button>
        </div>
        
        <Card>
          {activeTab === 'new' ? (
            <form onSubmit={handleCreateUser}>
              <CardHeader>
                <CardTitle className="text-lg">Buat Akun Baru</CardTitle>
                <CardDescription>
                  Data kamu disimpan lokal di browser. Privasi terjamin!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opsional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org">Organisasi (opsional)</Label>
                  <Input
                    id="org"
                    placeholder="Nama organisasi"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Semua data disimpan lokal di browser kamu sebagai file JSON. Tidak ada server, tidak ada database. Kamu bisa export kapan saja.</span>
                </div>
                
                <Button type="submit" className="w-full" size="lg">
                  Mulai Testing
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </form>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Import Data Profile</CardTitle>
                <CardDescription>
                  Punya file JSON dari sesi sebelumnya? Import di sini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver 
                      ? 'border-primary bg-primary/5 scale-[1.01]' 
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-muted-foreground/50'}`} />
                  <p className="font-medium">
                    {dragOver ? 'Drop file di sini...' : 'Drag & drop file JSON'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    atau klik untuk pilih file
                  </p>
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Pastikan file JSON berasal dari export BBT Reporter sebelumnya. Data lain tidak akan bisa dibaca.</span>
                </div>
              </CardContent>
            </>
          )}
        </Card>
        
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          BBT Reporter v1.0 — Privacy-first testing report manager
        </p>
      </div>
    </div>
  );
}
