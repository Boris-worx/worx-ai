import { Button } from './ui/button';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { Bell, Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { useSidebar } from './SidebarContext';

interface TopBarProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  currentTabMetadata: {
    title: string;
    subtitle: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopBar({ theme, onThemeChange, currentTabMetadata, activeTab, onTabChange }: TopBarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  
  return (
    <header className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 z-40 transition-all duration-300 ${isCollapsed ? 'left-0 md:left-20' : 'left-0 md:left-64'}`}>
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        {/* Sidebar Toggle Button - Desktop Only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex mr-2 bg-[rgb(241,243,255)]"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Mobile Menu Button */}
        <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
        
        {/* Page Title */}
        <div className="flex-1 min-w-0 md:ml-0 ml-2">
          <h1 className="text-lg md:text-xl truncate font-bold">{currentTabMetadata.title}</h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{currentTabMetadata.subtitle}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}