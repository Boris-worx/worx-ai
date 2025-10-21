import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { TenantsIcon } from './icons/TenantsIcon';
import { GridIcon } from './icons/GridIcon';
import { ListIcon } from './icons/ListIcon';
import { BugIcon } from './icons/BugIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { Menu, Building2, FileJson, Receipt, Bug, Moon, Sun, LogOut, User } from 'lucide-react';
import { Separator } from './ui/separator';
import { useAuth } from './AuthContext';
import { Badge } from './ui/badge';

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onBugReportClick: () => void;
}

export function MobileMenu({ activeTab, onTabChange, theme, onThemeChange, onBugReportClick }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate between pages and access settings
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* User Info */}
          {user && (
            <>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Signed in as</span>
                </div>
                <p className="font-medium">{user.username}</p>
                <Badge className="mt-2 capitalize" variant="secondary">
                  {user.role}
                </Badge>
              </div>
              <Separator />
            </>
          )}

          {/* Navigation */}
          <div className="space-y-2">
            <p className="px-2 text-xs text-muted-foreground uppercase tracking-wider">Navigation</p>
            <nav className="space-y-1">
              <Button
                variant={activeTab === 'tenants' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('tenants')}
                className="w-full justify-start"
              >
                <TenantsIcon className="h-4 w-4 mr-3" />
                Tenants
              </Button>
              <Button
                variant={activeTab === 'modelschema' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('modelschema')}
                className="w-full justify-start"
              >
                <GridIcon className="h-4 w-4 mr-3" />
                Transaction Onboarding
              </Button>
              <Button
                variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('transactions')}
                className="w-full justify-start"
              >
                <ListIcon className="h-4 w-4 mr-3" />
                Data Plane
              </Button>
            </nav>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <p className="px-2 text-xs text-muted-foreground uppercase tracking-wider">Actions</p>
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => {
                  onBugReportClick();
                  setOpen(false);
                }}
                className="w-full justify-start"
              >
                <BugIcon className="h-4 w-4 mr-3" />
                Report a Bug
              </Button>
              <Button
                variant="ghost"
                onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                className="w-full justify-start"
              >
                {theme === 'light' ? (
                  <>
                    <MoonIcon className="h-4 w-4 mr-3" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <SunIcon className="h-4 w-4 mr-3" />
                    Light Mode
                  </>
                )}
              </Button>
            </div>
          </div>

          {user && (
            <>
              <Separator />
              {/* User Actions */}
              <div className="space-y-2">
                <p className="px-2 text-xs text-muted-foreground uppercase tracking-wider">Account</p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="w-full justify-start text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Log Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
