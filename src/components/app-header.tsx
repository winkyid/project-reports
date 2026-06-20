'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger, 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, Settings, LogOut, Search, ClipboardList, 
  ChevronLeft, Menu 
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const { currentProfile, currentView, navigate, goBack, logout } = useAppStore();
  
  if (!currentProfile) return null;
  
  const initials = currentProfile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const canGoBack = currentView.type !== 'dashboard' && currentView.type !== 'auth';
  
  const getTitle = () => {
    switch (currentView.type) {
      case 'dashboard': return 'Dashboard';
      case 'project': return 'Project Detail';
      case 'category': return 'Test Cases';
      case 'settings': return 'Settings';
      case 'global-search': return 'Global Search';
      default: return 'BBT Reporter';
    }
  };
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {canGoBack && (
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-base">{getTitle()}</h1>
        </div>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ type: 'global-search' })}
          className="text-muted-foreground"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ type: 'dashboard' })}
          className="text-muted-foreground"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">{currentProfile.name}</p>
              {currentProfile.email && (
                <p className="text-xs text-muted-foreground leading-none">{currentProfile.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ type: 'settings' })}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
