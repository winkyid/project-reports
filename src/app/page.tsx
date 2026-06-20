'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { LoginScreen } from '@/components/login-screen';
import { AppHeader } from '@/components/app-header';
import { Dashboard } from '@/components/dashboard';
import { ProjectDetail } from '@/components/project-detail';
import { CategoryDetail } from '@/components/category-detail';
import { SettingsPage } from '@/components/settings-page';
import { GlobalSearch } from '@/components/global-search';

export default function Home() {
  const { currentView, isAuthenticated, hydrate } = useAppStore();
  
  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  
  // Not authenticated → show login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  // Authenticated → show app layout
  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard':
        return <Dashboard />;
      case 'project':
        return <ProjectDetail projectId={currentView.projectId} />;
      case 'category':
        return <CategoryDetail projectId={currentView.projectId} categoryId={currentView.categoryId} />;
      case 'settings':
        return <SettingsPage />;
      case 'global-search':
        return <GlobalSearch />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        {renderContent()}
      </main>
      <footer className="border-t py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          BBT Reporter v1.0 — Privacy-first Black Box Testing Report Manager
        </p>
      </footer>
    </div>
  );
}
