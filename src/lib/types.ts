// ==========================================
// Black Box Testing Report - Data Types
// ==========================================

export type TestStatus = 'pass' | 'fail' | 'blocked' | 'not-tested' | 'skip';
export type Priority = 'high' | 'medium' | 'low';

// Full user profile (stored as JSON file)
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  projects: Project[];
}

// A testing project
export interface Project {
  id: string;
  name: string;
  testerName: string; // who is performing the test
  testId: string; // unique ID for global search & sharing
  description: string;
  applicationName: string; // app being tested
  environment: 'development' | 'staging' | 'production' | 'other';
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

// A category = one UI section/sub-menu being tested
export interface Category {
  id: string;
  name: string;
  description: string;
  uiUrl?: string; // URL or path of the UI being tested
  createdAt: string;
  updatedAt: string;
  testCases: TestCase[];
}

// A single black box test case
export interface TestCase {
  id: string;
  no: number;
  moduleName: string;
  testScenario: string;
  precondition: string;
  testSteps: string; // numbered steps, newline separated
  expectedBehavior: string;
  actualBehavior: string;
  status: TestStatus;
  priority: Priority;
  bugId?: string;
  notes: string;
  evidence?: string; // screenshot ref or description
  createdAt: string;
  updatedAt: string;
}

// App navigation views (SPA routing)
export type AppView = 
  | { type: 'auth' }
  | { type: 'dashboard' }
  | { type: 'project'; projectId: string }
  | { type: 'category'; projectId: string; categoryId: string }
  | { type: 'settings' }
  | { type: 'global-search' };

// Export format for sharing
export interface ExportData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  isAnonymized: boolean;
  project: Project;
}

// Status color mapping
export const STATUS_CONFIG: Record<TestStatus, { label: string; color: string; bgColor: string }> = {
  pass: { label: 'Lulus', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
  fail: { label: 'Gagal', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
  blocked: { label: 'Diblokir', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
  'not-tested': { label: 'Belum Uji', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' },
  skip: { label: 'Lewati', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-red-600 dark:text-red-400' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400' },
};

export const ENVIRONMENT_LABELS: Record<string, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
  other: 'Other',
};
