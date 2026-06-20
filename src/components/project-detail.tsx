'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Project, Category, STATUS_CONFIG, ENVIRONMENT_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, FolderOpen, Trash2, MoreVertical, Pencil, 
  ExternalLink, Table2, CheckCircle2, XCircle, AlertTriangle,
  HelpCircle, Ban, ChevronRight, User, Server, Calendar, FileText 
} from 'lucide-react';
import { toast } from 'sonner';

export function ProjectDetail({ projectId }: { projectId: string }) {
  const store = useAppStore();
  const project = store.currentProfile?.projects.find(p => p.id === projectId);
  
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState<Category | null>(null);
  const [showDeleteCategory, setShowDeleteCategory] = useState<string | null>(null);
  
  // Form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catUrl, setCatUrl] = useState('');
  
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Project tidak ditemukan</p>
      </div>
    );
  }
  
  const getCategoryStats = (category: Category) => {
    const total = category.testCases.length;
    const pass = category.testCases.filter(tc => tc.status === 'pass').length;
    const fail = category.testCases.filter(tc => tc.status === 'fail').length;
    const blocked = category.testCases.filter(tc => tc.status === 'blocked').length;
    const notTested = category.testCases.filter(tc => tc.status === 'not-tested').length;
    return { total, pass, fail, blocked, notTested };
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'fail': return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      case 'blocked': return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'not-tested': return <HelpCircle className="w-3.5 h-3.5 text-gray-400" />;
      default: return <Ban className="w-3.5 h-3.5 text-blue-500" />;
    }
  };
  
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Nama category harus diisi!');
      return;
    }
    store.createCategory(projectId, {
      name: catName.trim(),
      description: catDesc.trim(),
      uiUrl: catUrl.trim() || undefined,
    });
    toast.success(`Category "${catName.trim()}" berhasil ditambahkan`);
    resetCatForm();
    setShowCreateCategory(false);
  };
  
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCategory || !catName.trim()) return;
    store.updateCategory(projectId, showEditCategory.id, {
      name: catName.trim(),
      description: catDesc.trim(),
      uiUrl: catUrl.trim() || undefined,
    });
    toast.success('Category berhasil diupdate');
    resetCatForm();
    setShowEditCategory(null);
  };
  
  const handleDeleteCategory = () => {
    if (!showDeleteCategory) return;
    store.deleteCategory(projectId, showDeleteCategory);
    setShowDeleteCategory(null);
    toast.success('Category berhasil dihapus');
  };
  
  const resetCatForm = () => {
    setCatName('');
    setCatDesc('');
    setCatUrl('');
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const overallStats = project.categories.reduce(
    (acc, cat) => {
      const stats = getCategoryStats(cat);
      return {
        total: acc.total + stats.total,
        pass: acc.pass + stats.pass,
        fail: acc.fail + stats.fail,
        blocked: acc.blocked + stats.blocked,
      };
    },
    { total: 0, pass: 0, fail: 0, blocked: 0 }
  );
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Project Info Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">{project.testId}</Badge>
              <Badge variant="secondary">{ENVIRONMENT_LABELS[project.environment]}</Badge>
              <Badge variant="secondary">{project.applicationName}</Badge>
            </div>
          </div>
        </div>
        
        {project.description && (
          <p className="text-muted-foreground text-sm">{project.description}</p>
        )}
        
        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {project.testerName}
          </span>
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            {ENVIRONMENT_LABELS[project.environment]}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(project.createdAt)}
          </span>
        </div>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-3">
            <div className="text-2xl font-bold">{project.categories.length}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold">{overallStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Cases</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-emerald-600">{overallStats.pass}</div>
            <div className="text-xs text-muted-foreground">Pass</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-red-600">{overallStats.fail}</div>
            <div className="text-xs text-muted-foreground">Fail</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-amber-600">{overallStats.blocked}</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Categories</h3>
          <Dialog open={showCreateCategory} onOpenChange={(open) => { setShowCreateCategory(open); if (!open) resetCatForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateCategory}>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>
                    Category merepresentasikan satu UI/sub-menu spesifik yang di-test. Setiap category punya satu tabel test case.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Nama Category *</Label>
                    <Input
                      id="cat-name"
                      placeholder="contoh: My Info - Profile"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-desc">Deskripsi</Label>
                    <Textarea
                      id="cat-desc"
                      placeholder="Deskripsi UI yang akan di-test..."
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-url">UI URL / Path (opsional)</Label>
                    <Input
                      id="cat-url"
                      placeholder="contoh: /my-info/profile"
                      value={catUrl}
                      onChange={(e) => setCatUrl(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setShowCreateCategory(false); resetCatForm(); }}>Batal</Button>
                  <Button type="submit">Tambah</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Empty State */}
        {project.categories.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <h4 className="font-medium text-muted-foreground">Belum ada category</h4>
              <p className="text-sm text-muted-foreground/70 mt-1">Tambahkan category untuk mulai membuat tabel test case</p>
            </CardContent>
          </Card>
        )}
        
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.categories.map((category) => {
            const stats = getCategoryStats(category);
            const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(0) : '0';
            
            return (
              <Card key={category.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{category.name}</span>
                      </CardTitle>
                      {category.uiUrl && (
                        <p className="text-xs text-muted-foreground font-mono">{category.uiUrl}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => store.navigate({ type: 'category', projectId, categoryId: category.id })}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Test Cases
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { 
                          setShowEditCategory(category); 
                          setCatName(category.name); 
                          setCatDesc(category.description); 
                          setCatUrl(category.uiUrl || ''); 
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowDeleteCategory(category.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mini Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600">{getStatusIcon('pass')} {stats.pass}</span>
                    <span className="flex items-center gap-1 text-red-600">{getStatusIcon('fail')} {stats.fail}</span>
                    <span className="flex items-center gap-1 text-amber-600">{getStatusIcon('blocked')} {stats.blocked}</span>
                    <span className="flex items-center gap-1 text-gray-400">{getStatusIcon('not-tested')} {stats.notTested}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stats.total} test cases</span>
                    <span>{passRate}% pass rate</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    size="sm"
                    onClick={() => store.navigate({ type: 'category', projectId, categoryId: category.id })}
                  >
                    Open Test Cases
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Edit Category Dialog */}
      <Dialog open={!!showEditCategory} onOpenChange={(open) => { if (!open) { setShowEditCategory(null); resetCatForm(); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateCategory}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update detail category.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cat-name">Nama Category *</Label>
                <Input
                  id="edit-cat-name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-desc">Deskripsi</Label>
                <Textarea
                  id="edit-cat-desc"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-url">UI URL / Path (opsional)</Label>
                <Input
                  id="edit-cat-url"
                  value={catUrl}
                  onChange={(e) => setCatUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowEditCategory(null); resetCatForm(); }}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation */}
      <AlertDialog open={!!showDeleteCategory} onOpenChange={(open) => !open && setShowDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua test cases di dalam category ini akan ikut terhapus. Tindakan ini tidak bisa di-undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
