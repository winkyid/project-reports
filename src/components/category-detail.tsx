'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Category, TestCase, TestStatus, Priority, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Trash2, Pencil, MoreVertical, ChevronUp, ChevronDown,
  Save, X, AlertCircle, Table2, GripVertical 
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface CategoryDetailProps {
  projectId: string;
  categoryId: string;
}

export function CategoryDetail({ projectId, categoryId }: CategoryDetailProps) {
  const store = useAppStore();
  const project = store.currentProfile?.projects.find(p => p.id === projectId);
  const category = project?.categories.find(c => c.id === categoryId);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  
  // Edit form state
  const [editForm, setEditForm] = useState<Partial<TestCase>>({});
  
  if (!project || !category) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Category tidak ditemukan</p>
      </div>
    );
  }
  
  const startEditing = (testCase: TestCase) => {
    setEditingId(testCase.id);
    setEditForm({ ...testCase });
  };
  
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };
  
  const saveEditing = () => {
    if (!editingId) return;
    store.updateTestCase(projectId, categoryId, editingId, {
      ...editForm,
      updatedAt: new Date().toISOString(),
    } as Partial<TestCase>);
    setEditingId(null);
    setEditForm({});
    toast.success('Test case berhasil diupdate');
  };
  
  const handleAddSingle = () => {
    store.addTestCase(projectId, categoryId);
    setShowAddDialog(false);
    toast.success('Test case baru ditambahkan');
  };
  
  const handleBulkAdd = () => {
    for (let i = 0; i < bulkCount; i++) {
      store.addTestCase(projectId, categoryId);
    }
    setShowBulkAddDialog(false);
    toast.success(`${bulkCount} test cases berhasil ditambahkan`);
  };
  
  const handleDelete = () => {
    if (!showDeleteDialog) return;
    store.deleteTestCase(projectId, categoryId, showDeleteDialog);
    setShowDeleteDialog(null);
    toast.success('Test case berhasil dihapus');
  };
  
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const ids = category.testCases.map(tc => tc.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    store.reorderTestCases(projectId, categoryId, ids);
  };
  
  const handleMoveDown = (index: number) => {
    if (index >= category.testCases.length - 1) return;
    const ids = category.testCases.map(tc => tc.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    store.reorderTestCases(projectId, categoryId, ids);
  };
  
  const handleQuickStatusChange = (testCaseId: string, status: TestStatus) => {
    store.updateTestCase(projectId, categoryId, testCaseId, { 
      status, 
      updatedAt: new Date().toISOString() 
    });
  };
  
  const getStats = () => {
    const total = category.testCases.length;
    const pass = category.testCases.filter(tc => tc.status === 'pass').length;
    const fail = category.testCases.filter(tc => tc.status === 'fail').length;
    const blocked = category.testCases.filter(tc => tc.status === 'blocked').length;
    const notTested = category.testCases.filter(tc => tc.status === 'not-tested').length;
    const skip = category.testCases.filter(tc => tc.status === 'skip').length;
    const passRate = total > 0 ? ((pass / total) * 100).toFixed(1) : '0';
    return { total, pass, fail, blocked, notTested, skip, passRate };
  };
  
  const stats = getStats();
  
  const renderCell = (label: string, value: string | undefined, fieldName: keyof TestCase) => {
    if (editingId) {
      if (fieldName === 'testSteps') {
        return (
          <Textarea
            value={(editForm[fieldName] as string) || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, [fieldName]: e.target.value }))}
            rows={3}
            className="min-w-[200px] text-sm"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );
      }
      if (fieldName === 'precondition' || fieldName === 'expectedBehavior' || fieldName === 'actualBehavior' || fieldName === 'notes') {
        return (
          <Textarea
            value={(editForm[fieldName] as string) || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, [fieldName]: e.target.value }))}
            rows={2}
            className="min-w-[150px] text-sm"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );
      }
      return (
        <Input
          value={(editForm[fieldName] as string) || ''}
          onChange={(e) => setEditForm(prev => ({ ...prev, [fieldName]: e.target.value }))}
          className="min-w-[120px] text-sm"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      );
    }
    return (
      <span className="text-sm whitespace-pre-wrap">{value || <span className="text-muted-foreground/40">-</span>}</span>
    );
  };
  
  const renderStatusBadge = (testCase: TestCase) => {
    const config = STATUS_CONFIG[testCase.status];
    
    if (editingId === testCase.id) {
      return (
        <Select
          value={editForm.status || testCase.status}
          onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as TestStatus }))}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pass"><span className="text-emerald-600">Pass</span></SelectItem>
            <SelectItem value="fail"><span className="text-red-600">Fail</span></SelectItem>
            <SelectItem value="blocked"><span className="text-amber-600">Blocked</span></SelectItem>
            <SelectItem value="not-tested"><span className="text-gray-500">Not Tested</span></SelectItem>
            <SelectItem value="skip"><span className="text-blue-600">Skip</span></SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-pointer hover:opacity-80 transition-opacity text-xs ${config.bgColor} ${config.color}`}
          >
            {config.label}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(Object.keys(STATUS_CONFIG) as TestStatus[]).map((status) => {
            const sc = STATUS_CONFIG[status];
            return (
              <DropdownMenuItem 
                key={status}
                onClick={() => handleQuickStatusChange(testCase.id, status)}
                className={sc.color}
              >
                {sc.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  const renderPriorityBadge = (testCase: TestCase) => {
    const config = PRIORITY_CONFIG[testCase.priority];
    
    if (editingId === testCase.id) {
      return (
        <Select
          value={editForm.priority || testCase.priority}
          onValueChange={(v) => setEditForm(prev => ({ ...prev, priority: v as Priority }))}
        >
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high"><span className="text-red-600">High</span></SelectItem>
            <SelectItem value="medium"><span className="text-amber-600">Medium</span></SelectItem>
            <SelectItem value="low"><span className="text-blue-600">Low</span></SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Category Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Table2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">{category.name}</h2>
            {category.uiUrl && (
              <p className="text-sm text-muted-foreground font-mono">{category.uiUrl}</p>
            )}
          </div>
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>
      
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3">
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </Card>
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">{stats.pass}</span>
          <span className="text-xs text-muted-foreground">Pass</span>
        </Card>
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-red-600">{stats.fail}</span>
          <span className="text-xs text-muted-foreground">Fail</span>
        </Card>
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-amber-600">{stats.blocked}</span>
          <span className="text-xs text-muted-foreground">Blocked</span>
        </Card>
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">{stats.skip}</span>
          <span className="text-xs text-muted-foreground">Skip</span>
        </Card>
        <Card className="p-3 flex items-center gap-2">
          <span className="text-2xl font-bold">{stats.passRate}%</span>
          <span className="text-xs text-muted-foreground">Pass Rate</span>
        </Card>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {editingId ? (
          <>
            <Button size="sm" onClick={saveEditing} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Simpan
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Batal
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => { store.addTestCase(projectId, categoryId); toast.success('Test case baru ditambahkan'); }} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Test Case
            </Button>
            <Dialog open={showBulkAddDialog} onOpenChange={setShowBulkAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Bulk Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[350px]">
                <DialogHeader>
                  <DialogTitle>Bulk Add Test Cases</DialogTitle>
                  <DialogDescription>Masukkan jumlah test case yang mau ditambahkan sekaligus.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="bulk-count">Jumlah</Label>
                  <Input
                    id="bulk-count"
                    type="number"
                    min={1}
                    max={50}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkAddDialog(false)}>Batal</Button>
                  <Button onClick={handleBulkAdd}>Tambah {bulkCount} Cases</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        
        <div className="flex-1" />
        
        <span className="text-xs text-muted-foreground">
          {editingId ? 'Mode: Editing...' : `${category.testCases.length} test cases`}
        </span>
      </div>
      
      {/* Test Cases Table */}
      {category.testCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Table2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <h4 className="font-medium text-muted-foreground">Belum ada test case</h4>
            <p className="text-sm text-muted-foreground/70 mt-1">Klik "Add Test Case" untuk mulai</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">No</TableHead>
                  <TableHead className="min-w-[100px]">Module</TableHead>
                  <TableHead className="min-w-[140px]">Test Scenario</TableHead>
                  <TableHead className="min-w-[120px]">Precondition</TableHead>
                  <TableHead className="min-w-[180px]">Test Steps</TableHead>
                  <TableHead className="min-w-[120px]">Expected</TableHead>
                  <TableHead className="min-w-[120px]">Actual</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Priority</TableHead>
                  <TableHead className="w-[100px]">Bug ID</TableHead>
                  <TableHead className="min-w-[100px]">Notes</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.testCases.map((testCase, index) => (
                  <TableRow key={testCase.id} className={editingId === testCase.id ? 'bg-muted/30' : ''}>
                    <TableCell className="text-center font-mono text-sm">{testCase.no}</TableCell>
                    <TableCell>{renderCell('Module', testCase.moduleName, 'moduleName')}</TableCell>
                    <TableCell>{renderCell('Test Scenario', testCase.testScenario, 'testScenario')}</TableCell>
                    <TableCell>{renderCell('Precondition', testCase.precondition, 'precondition')}</TableCell>
                    <TableCell>{renderCell('Test Steps', testCase.testSteps, 'testSteps')}</TableCell>
                    <TableCell>{renderCell('Expected Behavior', testCase.expectedBehavior, 'expectedBehavior')}</TableCell>
                    <TableCell>{renderCell('Actual Behavior', testCase.actualBehavior, 'actualBehavior')}</TableCell>
                    <TableCell>{renderStatusBadge(testCase)}</TableCell>
                    <TableCell>{renderPriorityBadge(testCase)}</TableCell>
                    <TableCell>
                      {editingId === testCase.id ? (
                        <Input
                          value={(editForm.bugId as string) || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bugId: e.target.value }))}
                          className="min-w-[80px] text-sm"
                          placeholder="Bug ID"
                        />
                      ) : (
                        <span className="text-sm font-mono">{testCase.bugId || <span className="text-muted-foreground/40">-</span>}</span>
                      )}
                    </TableCell>
                    <TableCell>{renderCell('Notes', testCase.notes, 'notes')}</TableCell>
                    <TableCell>
                      {editingId ? (
                        <span className="text-xs text-muted-foreground">...</span>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(testCase)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveUp(index)} disabled={index === 0}>
                                <ChevronUp className="mr-2 h-3.5 w-3.5" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveDown(index)} disabled={index === category.testCases.length - 1}>
                                <ChevronDown className="mr-2 h-3.5 w-3.5" />
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowDeleteDialog(testCase.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Test Case?</AlertDialogTitle>
            <AlertDialogDescription>
              Test case ini akan dihapus permanen. Nomor test case lainnya akan otomatis di-reorder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
