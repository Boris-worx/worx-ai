import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import { Logo } from './Logo';
import { TenantsIcon } from './icons/TenantsIcon';
import { GridIcon } from './icons/GridIcon';
import { ListIcon } from './icons/ListIcon';
import { AppWindow, Receipt, LayoutDashboard } from 'lucide-react';
import { useAuth } from './AuthContext';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { user, hasAccessTo, isGlobalUser } = useAuth();

  const handleTabChange = (tab: string) => {
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
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>
            <Logo className="text-gray-900 dark:text-white" width="140px" />
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {/* Dashboard - first menu item */}
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('dashboard')}
            className="w-full justify-start"
          >
            <LayoutDashboard className="h-4 w-4 mr-3" />
            Dashboard
          </Button>

          {(hasAccessTo('Tenants') || user?.tenantId) && (
            <Button
              variant={activeTab === 'tenants' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('tenants')}
              className="w-full justify-start"
            >
              <TenantsIcon className="h-4 w-4 mr-3" />
              {user?.tenantId && !isGlobalUser() ? 'My Tenant' : 'Tenants'}
            </Button>
          )}

          {hasAccessTo('Transactions') && (
            <>
              <Button
                variant={activeTab === 'modelschema' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('modelschema')}
                className="w-full justify-start"
              >
                <GridIcon className="h-4 w-4 mr-3" />
                Transactions
              </Button>

              <Button
                variant={activeTab === 'applications' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('applications')}
                className="w-full justify-start"
              >
                <AppWindow className="h-4 w-4 mr-3" />
                Application
              </Button>

              <Button
                variant={activeTab === 'datasources' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('datasources')}
                className="w-full justify-start"
              >
                <Receipt className="h-4 w-4 mr-3" />
                Data Sources
              </Button>
            </>
          )}

          {hasAccessTo('Data Plane') && (
            <Button
              variant={activeTab === 'transactions' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('transactions')}
              className="w-full justify-start"
            >
              <ListIcon className="h-4 w-4 mr-3" />
              Data Plane
            </Button>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <Logo className="text-gray-400 dark:text-gray-600 mx-auto mb-2" width="100px" />
            <p>© 2024 NexusFlow RT</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}