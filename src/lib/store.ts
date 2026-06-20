import { create } from 'zustand';
import { 
  UserProfile, Project, Category, TestCase, AppView, 
  TestStatus, Priority, ExportData 
} from './types';

// Generate unique IDs
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function generateTestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BBT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function now(): string {
  return new Date().toISOString();
}

// LocalStorage helpers
const STORAGE_KEY = 'bbt-app-data';

function saveToStorage(profile: UserProfile | null) {
  if (typeof window !== 'undefined') {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

function loadFromStorage(): UserProfile | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Create blank test case
function createBlankTestCase(no: number): TestCase {
  return {
    id: generateId(),
    no,
    moduleName: '',
    testScenario: '',
    precondition: '',
    testSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    status: 'not-tested',
    priority: 'medium',
    bugId: '',
    notes: '',
    evidence: '',
    createdAt: now(),
    updatedAt: now(),
  };
}

// Store interface
interface AppStore {
  // Auth & Profile
  currentProfile: UserProfile | null;
  isAuthenticated: boolean;
  currentView: AppView;
  
  // Actions - Auth
  createNewUser: (name: string, email?: string, organization?: string) => void;
  importUserFromFile: (jsonString: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'email' | 'organization'>>) => void;
  
  // Actions - Navigation
  navigate: (view: AppView) => void;
  goBack: () => void;
  
  // Actions - Projects
  createProject: (data: { name: string; testerName: string; description: string; applicationName: string; environment: Project['environment'] }) => Project;
  updateProject: (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'applicationName' | 'environment' | 'testerName'>>) => void;
  deleteProject: (projectId: string) => void;
  
  // Actions - Categories
  createCategory: (projectId: string, data: { name: string; description: string; uiUrl?: string }) => Category;
  updateCategory: (projectId: string, categoryId: string, updates: Partial<Pick<Category, 'name' | 'description' | 'uiUrl'>>) => void;
  deleteCategory: (projectId: string, categoryId: string) => void;
  
  // Actions - Test Cases
  addTestCase: (projectId: string, categoryId: string) => void;
  updateTestCase: (projectId: string, categoryId: string, testCaseId: string, updates: Partial<Omit<TestCase, 'id' | 'no' | 'createdAt'>>) => void;
  deleteTestCase: (projectId: string, categoryId: string, testCaseId: string) => void;
  reorderTestCases: (projectId: string, categoryId: string, testCaseIds: string[]) => void;
  
  // Actions - Export
  exportProfile: () => string;
  exportProject: (projectId: string, anonymize?: boolean) => string;
  importProject: (jsonString: string) => boolean;
  generateHTMLReport: (projectId: string, anonymize?: boolean) => string;
  
  // Actions - Storage
  hydrate: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentProfile: null,
  isAuthenticated: false,
  currentView: { type: 'auth' },
  
  // ===== AUTH =====
  createNewUser: (name, email, organization) => {
    const profile: UserProfile = {
      id: generateId(),
      name,
      email,
      organization,
      createdAt: now(),
      updatedAt: now(),
      projects: [],
    };
    set({ currentProfile: profile, isAuthenticated: true, currentView: { type: 'dashboard' } });
    saveToStorage(profile);
  },
  
  importUserFromFile: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      // Validate it has the required structure
      if (!data.id || !data.name || !Array.isArray(data.projects)) {
        return false;
      }
      const profile = data as UserProfile;
      profile.updatedAt = now();
      set({ currentProfile: profile, isAuthenticated: true, currentView: { type: 'dashboard' } });
      saveToStorage(profile);
      return true;
    } catch {
      return false;
    }
  },
  
  logout: () => {
    set({ currentProfile: null, isAuthenticated: false, currentView: { type: 'auth' } });
    saveToStorage(null);
  },
  
  updateProfile: (updates) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    const updated = { ...currentProfile, ...updates, updatedAt: now() };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  // ===== NAVIGATION =====
  navigate: (view) => set({ currentView: view }),
  
  goBack: () => {
    const { currentView } = get();
    switch (currentView.type) {
      case 'category':
        set({ currentView: { type: 'project', projectId: currentView.projectId } });
        break;
      case 'project':
      case 'settings':
      case 'global-search':
        set({ currentView: { type: 'dashboard' } });
        break;
      default:
        break;
    }
  },
  
  // ===== PROJECTS =====
  createProject: (data) => {
    const { currentProfile } = get();
    if (!currentProfile) throw new Error('Not authenticated');
    
    const project: Project = {
      id: generateId(),
      name: data.name,
      testerName: data.testerName,
      testId: generateTestId(),
      description: data.description,
      applicationName: data.applicationName,
      environment: data.environment,
      createdAt: now(),
      updatedAt: now(),
      categories: [],
    };
    
    const updated = {
      ...currentProfile,
      projects: [...currentProfile.projects, project],
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
    return project;
  },
  
  updateProject: (projectId, updates) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: now() } : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  deleteProject: (projectId) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.filter(p => p.id !== projectId),
      updatedAt: now(),
    };
    set({ currentProfile: updated, currentView: { type: 'dashboard' } });
    saveToStorage(updated);
  },
  
  // ===== CATEGORIES =====
  createCategory: (projectId, data) => {
    const { currentProfile } = get();
    if (!currentProfile) return {} as Category;
    
    const category: Category = {
      id: generateId(),
      name: data.name,
      description: data.description,
      uiUrl: data.uiUrl,
      createdAt: now(),
      updatedAt: now(),
      testCases: [],
    };
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId 
          ? { ...p, categories: [...p.categories, category], updatedAt: now() }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
    return category;
  },
  
  updateCategory: (projectId, categoryId, updates) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.map(c =>
                c.id === categoryId ? { ...c, ...updates, updatedAt: now() } : c
              ),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  deleteCategory: (projectId, categoryId) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.filter(c => c.id !== categoryId),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  // ===== TEST CASES =====
  addTestCase: (projectId, categoryId) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.map(c => {
                if (c.id !== categoryId) return c;
                const newNo = c.testCases.length + 1;
                const newCase = createBlankTestCase(newNo);
                return { ...c, testCases: [...c.testCases, newCase], updatedAt: now() };
              }),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  updateTestCase: (projectId, categoryId, testCaseId, updates) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.map(c =>
                c.id === categoryId
                  ? {
                      ...c,
                      testCases: c.testCases.map(tc =>
                        tc.id === testCaseId ? { ...tc, ...updates, updatedAt: now() } : tc
                      ),
                      updatedAt: now(),
                    }
                  : c
              ),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  deleteTestCase: (projectId, categoryId, testCaseId) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.map(c => {
                if (c.id !== categoryId) return c;
                const filtered = c.testCases.filter(tc => tc.id !== testCaseId);
                // Re-number
                const renumbered = filtered.map((tc, i) => ({ ...tc, no: i + 1 }));
                return { ...c, testCases: renumbered, updatedAt: now() };
              }),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  reorderTestCases: (projectId, categoryId, testCaseIds) => {
    const { currentProfile } = get();
    if (!currentProfile) return;
    
    const updated = {
      ...currentProfile,
      projects: currentProfile.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              categories: p.categories.map(c => {
                if (c.id !== categoryId) return c;
                const reordered = testCaseIds.map((id, i) => {
                  const tc = c.testCases.find(t => t.id === id);
                  return tc ? { ...tc, no: i + 1 } : null;
                }).filter(Boolean) as TestCase[];
                return { ...c, testCases: reordered, updatedAt: now() };
              }),
              updatedAt: now(),
            }
          : p
      ),
      updatedAt: now(),
    };
    set({ currentProfile: updated });
    saveToStorage(updated);
  },
  
  // ===== EXPORT =====
  exportProfile: () => {
    const { currentProfile } = get();
    if (!currentProfile) return '';
    return JSON.stringify(currentProfile, null, 2);
  },
  
  exportProject: (projectId, anonymize = false) => {
    const { currentProfile } = get();
    if (!currentProfile) return '';
    
    const project = currentProfile.projects.find(p => p.id === projectId);
    if (!project) return '';
    
    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: now(),
      exportedBy: anonymize ? 'Anonymous' : currentProfile.name,
      isAnonymized: anonymize,
      project: anonymize 
        ? { ...project, testerName: '***' }
        : project,
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  importProject: (jsonString) => {
    const { currentProfile } = get();
    if (!currentProfile) return false;
    
    try {
      const data: ExportData = JSON.parse(jsonString);
      if (!data.project || !data.project.id || !data.project.testId) {
        return false;
      }
      
      // Check if project with same testId already exists
      const exists = currentProfile.projects.some(p => p.testId === data.project.testId);
      if (exists) return false;
      
      const updated = {
        ...currentProfile,
        projects: [...currentProfile.projects, { ...data.project, id: generateId(), createdAt: now(), updatedAt: now() }],
        updatedAt: now(),
      };
      set({ currentProfile: updated });
      saveToStorage(updated);
      return true;
    } catch {
      return false;
    }
  },
  
  generateHTMLReport: (projectId, anonymize = false) => {
    const { currentProfile } = get();
    if (!currentProfile) return '';
    
    const project = currentProfile.projects.find(p => p.id === projectId);
    if (!project) return '';
    
    const testerName = anonymize ? '***' : project.testerName;
    const exportDate = new Date().toLocaleDateString('id-ID', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    const passCount = project.categories.reduce((acc, cat) => 
      acc + cat.testCases.filter(tc => tc.status === 'pass').length, 0
    );
    const failCount = project.categories.reduce((acc, cat) => 
      acc + cat.testCases.filter(tc => tc.status === 'fail').length, 0
    );
    const totalCases = project.categories.reduce((acc, cat) => acc + cat.testCases.length, 0);
    const passRate = totalCases > 0 ? ((passCount / totalCases) * 100).toFixed(1) : '0.0';
    
    const categoriesHtml = project.categories.map(cat => {
      const testCasesHtml = cat.testCases.map(tc => {
        const statusColor = {
          pass: '#10b981', fail: '#ef4444', blocked: '#f59e0b',
          'not-tested': '#6b7280', skip: '#3b82f6'
        }[tc.status] || '#6b7280';
        const statusLabel = {
          pass: 'LULUS', fail: 'GAGAL', blocked: 'DIBLOKIR',
          'not-tested': 'BELUM UJI', skip: 'LEWATI'
        }[tc.status] || 'BELUM UJI';
        
        return `
          <tr>
            <td style="text-align:center;font-family:monospace;font-weight:600">${tc.no}</td>
            <td style="white-space:pre-line">${tc.testScenario || '-'}</td>
            <td style="white-space:pre-line">${tc.testSteps || '-'}</td>
            <td style="white-space:pre-line">${tc.expectedBehavior || '-'}</td>
            <td style="white-space:pre-line">${tc.actualBehavior || '-'}</td>
            <td><span style="color:${statusColor};font-weight:600">${statusLabel}</span></td>
          </tr>`;
      }).join('');
      
      return `
        <div class="category-section">
          <h2>${cat.name}</h2>
          ${cat.description ? `<p class="category-desc">${cat.description}</p>` : ''}
          ${cat.uiUrl ? `<p class="category-url">UI URL: ${cat.uiUrl}</p>` : ''}
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kode Uji</th>
                  <th>Detail Skenario</th>
                  <th>Data Uji</th>
                  <th>Ekspektasi</th>
                  <th>Hasil Aktual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${testCasesHtml}</tbody>
            </table>
          </div>
        </div>`;
    }).join('');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Black Box Testing Report</title>
  <meta name="test-id" content="${project.testId}">
  <meta name="description" content="Black Box Testing Report for ${project.applicationName}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f9fafb; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    .report-header { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .report-header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .report-header .test-id { color: #6b7280; font-family: monospace; font-size: 0.9rem; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    .meta-item label { display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-item span { font-weight: 500; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card .value { font-size: 2rem; font-weight: 700; }
    .summary-card .label { font-size: 0.85rem; color: #6b7280; }
    .summary-card.pass .value { color: #10b981; }
    .summary-card.fail .value { color: #ef4444; }
    .summary-card.rate .value { color: #3b82f6; }
    .category-section { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .category-section h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    .category-desc, .category-url { color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f3f4f6; padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
    td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:hover { background: #f9fafb; }
    .footer { text-align: center; color: #9ca3af; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    @media print { body { padding: 1rem; } .summary-card, .category-section { box-shadow: none; border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <h1>${project.name}</h1>
      <div class="test-id">Test ID: ${project.testId}</div>
      <div class="meta-grid">
        <div class="meta-item"><label>Application</label><span>${project.applicationName}</span></div>
        <div class="meta-item"><label>Environment</label><span>${project.environment}</span></div>
        <div class="meta-item"><label>Tester</label><span>${testerName}</span></div>
        <div class="meta-item"><label>Report Date</label><span>${exportDate}</span></div>
      </div>
      ${project.description ? `<p style="margin-top:1rem;color:#4b5563">${project.description}</p>` : ''}
    </div>
    
    <div class="summary-cards">
      <div class="summary-card pass"><div class="value">${passCount}</div><div class="label">Lulus</div></div>
      <div class="summary-card fail"><div class="value">${failCount}</div><div class="label">Gagal</div></div>
      <div class="summary-card"><div class="value">${totalCases}</div><div class="label">Total Kasus Uji</div></div>
      <div class="summary-card rate"><div class="value">${passRate}%</div><div class="label">Tingkat Kelulusan</div></div>
    </div>
    
    ${categoriesHtml}
    
    <div class="footer">
      <p>Generated by BBT Reporter | Test ID: ${project.testId} | ${exportDate}</p>
    </div>
  </div>
</body>
</html>`;
    
    return html;
  },
  
  // ===== HYDRATION =====
  hydrate: () => {
    const profile = loadFromStorage();
    if (profile) {
      set({ 
        currentProfile: profile, 
        isAuthenticated: true,
        currentView: { type: 'dashboard' }
      });
    }
  },
}));
