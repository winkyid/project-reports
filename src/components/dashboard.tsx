'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, FolderOpen, Trash2, MoreVertical, FileDown, Globe, 
  Eye, ClipboardList, Calendar, User, Server, ExternalLink, Cloud, CloudOff, Loader2 
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { ENVIRONMENT_LABELS } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

export function Dashboard() {
  const { currentProfile, createProject, deleteProject, navigate, exportProject, generateHTMLReport, uploadToCloud, cloudServerUrl } = useAppStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Create project form state
  const [formName, setFormName] = useState('');
  const [formTesterName, setFormTesterName] = useState('');
  const [formAppName, setFormAppName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEnv, setFormEnv] = useState<'development' | 'staging' | 'production' | 'other'>('development');
  
  if (!currentProfile) return null;
  
  const projects = currentProfile.projects || [];
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTesterName.trim() || !formAppName.trim()) {
      toast.error('Project name, tester name, dan application name wajib diisi!');
      return;
    }
    const project = createProject({
      name: formName.trim(),
      testerName: formTesterName.trim(),
      description: formDesc.trim(),
      applicationName: formAppName.trim(),
      environment: formEnv,
    });
    toast.success(`Project "${project.name}" berhasil dibuat! Test ID: ${project.testId}`);
    resetForm();
    setShowCreateDialog(false);
  };
  
  const resetForm = () => {
    setFormName('');
    setFormTesterName('');
    setFormAppName('');
    setFormDesc('');
    setFormEnv('development');
  };
  
  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
    setShowDeleteDialog(null);
    toast.success('Project berhasil dihapus');
  };
  
  const handleExportJSON = (projectId: string) => {
    const json = exportProject(projectId);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbt-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File JSON berhasil diexport!');
  };
  
  const handleExportHTML = (projectId: string) => {
    const html = generateHTMLReport(projectId);
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbt-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan HTML berhasil di-generate!');
  };
  
  const handleCloudUpload = async (projectId: string) => {
    if (!cloudServerUrl) {
      toast.error('Cloud Server belum dikonfigurasi. Buka Settings > Cloud untuk setup.');
      return;
    }
    setUploadingId(projectId);
    const result = await uploadToCloud(projectId);
    setUploadingId(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };
  
  const getProjectStats = (project: Project) => {
    const totalCases = project.categories.reduce((acc, cat) => acc + cat.testCases.length, 0);
    const passCount = project.categories.reduce((acc, cat) => acc + cat.testCases.filter(tc => tc.status === 'pass').length, 0);
    const failCount = project.categories.reduce((acc, cat) => acc + cat.testCases.filter(tc => tc.status === 'fail').length, 0);
    return { totalCases, passCount, failCount, categories: project.categories.length };
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} project {projects.length === 1 ? 'terdaftar' : 'terdaftar'}
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Setup project testing baru. Test ID akan digenerate otomatis untuk keperluan search dan sharing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-name">Nama Project *</Label>
                  <Input
                    id="proj-name"
                    placeholder="contoh: Testing Aplikasi MyInfo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tester-name">Nama Tester *</Label>
                    <Input
                      id="tester-name"
                      placeholder="Nama pelaku tes"
                      value={formTesterName}
                      onChange={(e) => setFormTesterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-name">Nama Aplikasi *</Label>
                    <Input
                      id="app-name"
                      placeholder="App yang di-test"
                      value={formAppName}
                      onChange={(e) => setFormAppName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env">Environment</Label>
                  <Select value={formEnv} onValueChange={(v) => setFormEnv(v as typeof formEnv)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-desc">Deskripsi</Label>
                  <Textarea
                    id="proj-desc"
                    placeholder="Deskripsi singkat project testing..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <ClipboardList className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Test ID akan di-generate otomatis (format: BBT-XXXXXXXX). Gunakan ID ini untuk global search saat report sudah di-upload ke cloud.</span>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>Batal</Button>
                <Button type="submit">Buat Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Empty State */}
      {projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-muted-foreground">Belum ada project</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Mulai dengan membuat project testing pertamamu</p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const stats = getProjectStats(project);
          return (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-mono text-[10px]">{project.testId}</Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {ENVIRONMENT_LABELS[project.environment]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ type: 'project', projectId: project.id })}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Detail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExportJSON(project.id)}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportHTML(project.id)}>
                        <Globe className="mr-2 h-4 w-4" />
                        Generate HTML Report
                      </DropdownMenuItem>
                      {cloudServerUrl && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleCloudUpload(project.id)}
                            disabled={uploadingId === project.id}
                          >
                            {uploadingId === project.id 
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                              : <Cloud className="mr-2 h-4 w-4" />
                            }
                            Upload ke Cloud
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            window.open(`${cloudServerUrl}/api/download.php?id=${project.testId}&format=html`, '_blank');
                          }}>
                            <Cloud className="mr-2 h-4 w-4" />
                            Lihat di Cloud
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowDeleteDialog(project.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || project.applicationName}
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold">{stats.categories}</div>
                    <div className="text-[10px] text-muted-foreground">Categories</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold text-emerald-600">{stats.passCount}</div>
                    <div className="text-[10px] text-muted-foreground">Pass</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold text-red-600">{stats.failCount}</div>
                    <div className="text-[10px] text-muted-foreground">Fail</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {project.testerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate({ type: 'project', projectId: project.id })}
                >
                  Open Project
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data termasuk categories dan test cases akan dihapus permanen. Tindakan ini tidak bisa di-undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
