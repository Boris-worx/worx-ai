import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { TenantsIcon } from './icons/TenantsIcon';
import { GridIcon } from './icons/GridIcon';
import { ListIcon } from './icons/ListIcon';
import { BugIcon } from './icons/BugIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { Menu, Receipt, LogOut, UserCircle, RefreshCw, AppWindow, Database, Info, LayoutDashboard } from 'lucide-react';
import { Separator } from './ui/separator';
import { useAuth } from './AuthContext';
import { RoleTestDialog } from './RoleTestDialog';
import { ProfileDialog } from './ProfileDialog';
import { getTutorialSteps } from './tutorial-steps';

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onBugReportClick: () => void;
  onTutorialClick: () => void;
  onApicurioTestClick: () => void;
}

export function MobileMenu({ activeTab, onTabChange, theme, onThemeChange, onBugReportClick, onTutorialClick, onApicurioTestClick }: MobileMenuProps) {
  const { user, logout, hasAccessTo } = useAuth();
  const [open, setOpen] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  // Check if user is in test mode
  const isTestMode = localStorage.getItem('bfs_test_role') !== null;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate between pages and access settings
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 pl-4">
            {/* Navigation */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Navigation</p>
              <nav className="space-y-1">
                {/* Dashboard - hidden from menu but accessible via direct navigation */}
                {/* <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => handleTabClick('dashboard')}
                  className="w-full justify-start hidden"
                >
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  Dashboard
                </Button> */}
                {hasAccessTo('Tenants') && (
                  <Button
                    variant={activeTab === 'tenants' ? 'default' : 'ghost'}
                    onClick={() => handleTabClick('tenants')}
                    className="w-full justify-start"
                  >
                    <TenantsIcon className="h-4 w-4 mr-3" />
                    Tenants
                  </Button>
                )}
                {hasAccessTo('Transactions') && (
                  <Button
                    variant={activeTab === 'modelschema' ? 'default' : 'ghost'}
                    onClick={() => handleTabClick('modelschema')}
                    className="w-full justify-start"
                  >
                    <GridIcon className="h-4 w-4 mr-3" />
                    Transactions
                  </Button>
                )}
                {hasAccessTo('Transactions') && (
                  <Button
                    variant={activeTab === 'datasources' ? 'default' : 'ghost'}
                    onClick={() => handleTabClick('datasources')}
                    className="w-full justify-start"
                  >
                    <Receipt className="h-4 w-4 mr-3" />
                    Data Sources
                  </Button>
                )}
                {hasAccessTo('Transactions') && (
                  <Button
                    variant={activeTab === 'applications' ? 'default' : 'ghost'}
                    onClick={() => handleTabClick('applications')}
                    className="w-full justify-start"
                  >
                    <AppWindow className="h-4 w-4 mr-3" />
                    Applications
                  </Button>
                )}
                {hasAccessTo('Data Plane') && (
                  <Button
                    variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                    onClick={() => handleTabClick('transactions')}
                    className="w-full justify-start"
                  >
                    <ListIcon className="h-4 w-4 mr-3" />
                    Data Plane
                  </Button>
                )}
              </nav>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Actions</p>
              <div className="space-y-1">
                {user && (
                  <>
                    {/* User Icon - View Profile */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowProfileDialog(true);
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3">
                        <mask id="mask0_2031_1596" style={{maskType:'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                          <rect width="24" height="24" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_2031_1596)">
                          <path d="M5.85 17.1C6.7 16.45 7.65 15.9375 8.7 15.5625C9.75 15.1875 10.85 15 12 15C13.15 15 14.25 15.1875 15.3 15.5625C16.35 15.9375 17.3 16.45 18.15 17.1C18.7333 16.4167 19.1875 15.6417 19.5125 14.775C19.8375 13.9083 20 12.9833 20 12C20 9.78333 19.2208 7.89583 17.6625 6.3375C16.1042 4.77917 14.2167 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 12.9833 4.1625 13.9083 4.4875 14.775C4.8125 15.6417 5.26667 16.4167 5.85 17.1ZM12 13C11.0167 13 10.1875 12.6625 9.5125 11.9875C8.8375 11.3125 8.5 10.4833 8.5 9.5C8.5 8.51667 8.8375 7.6875 9.5125 7.0125C10.1875 6.3375 11.0167 6 12 6C12.9833 6 13.8125 6.3375 14.4875 7.0125C15.1625 7.6875 15.5 8.51667 15.5 9.5C15.5 10.4833 15.1625 11.3125 14.4875 11.9875C13.8125 12.6625 12.9833 13 12 13ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C12.8833 20 13.7167 19.8708 14.5 19.6125C15.2833 19.3542 16 18.9833 16.65 18.5C16 18.0167 15.2833 17.6458 14.5 17.3875C13.7167 17.1292 12.8833 17 12 17C11.1167 17 10.2833 17.1292 9.5 17.3875C8.71667 17.6458 8 18.0167 7.35 18.5C8 18.9833 8.71667 19.3542 9.5 19.6125C10.2833 19.8708 11.1167 20 12 20ZM12 11C12.4333 11 12.7917 10.8583 13.075 10.575C13.3583 10.2917 13.5 9.93333 13.5 9.5C13.5 9.06667 13.3583 8.70833 13.075 8.425C12.7917 8.14167 12.4333 8 12 8C11.5667 8 11.2083 8.14167 10.925 8.425C10.6417 8.70833 10.5 9.06667 10.5 9.5C10.5 9.93333 10.6417 10.2917 10.925 10.575C11.2083 10.8583 11.5667 11 12 11Z" fill="currentColor"/>
                        </g>
                      </svg>
                      View Profile
                      {isTestMode && (
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      )}
                    </Button>

                    {/* Change Role */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowRoleDialog(true);
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <RefreshCw className="h-4 w-4 mr-3" />
                      Change Role
                    </Button>
                  </>
                )}

                {/* Test API Connections - Hidden for now */}
                {/* <Button
                  variant="ghost"
                  onClick={() => {
                    onApicurioTestClick();
                    setOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Database className="h-4 w-4 mr-3" />
                  Test API Connections
                </Button> */}

                {/* Tutorial - Available for all tabs with tutorials */}
                {(activeTab === 'tenants' || activeTab === 'modelschema' || activeTab === 'datasources' || activeTab === 'applications' || activeTab === 'transactions') && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onTutorialClick();
                      setOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Info className="h-4 w-4 mr-3" />
                    Tutorial
                  </Button>
                )}

                {/* Report a Bug */}
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

                {/* Theme Toggle */}
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
                {/* Account */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Account</p>
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
                      {user.isAzureAuth ? 'Sign Out from Azure' : 'Log Out'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <RoleTestDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
      <ProfileDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </>
  );
}