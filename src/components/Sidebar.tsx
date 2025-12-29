import { LogoIcon } from './LogoIcon';
import { LogoText } from './LogoText';
import { Button } from './ui/button';
import { TenantsIcon } from './icons/TenantsIcon';
import { GridIcon } from './icons/GridIcon';
import { ListIcon } from './icons/ListIcon';
import { SquareKanban, ReceiptText, SquareStack, Database, UserRound, Settings, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useSidebar } from './SidebarContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, hasAccessTo, isGlobalUser, logout } = useAuth();
  const { isCollapsed } = useSidebar();

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen fixed left-0 top-0 transition-all duration-300`}>
      {/* Logo */}
      <div className="p-7 flex items-center justify-center">
        {isCollapsed ? (
          <LogoIcon className="text-gray-900 dark:text-white" width={32} height={26} />
        ) : (
          <div className="flex items-center gap-3">
            <LogoIcon className="text-gray-900 dark:text-white" width={32} height={26} />
            <LogoText className="text-gray-900 dark:text-white" width={120} height={18} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto flex flex-col justify-center">
        <div className="space-y-6">
          {/* Dashboard */}
          <div className="space-y-1">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onTabChange('dashboard')}
              className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <SquareKanban className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Dashboard'}
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Manage Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Manage
                </h3>
              </div>
            )}

            {(hasAccessTo('Tenants') || user?.tenantId) && (
              <Button
                variant={activeTab === 'tenants' ? 'default' : 'ghost'}
                onClick={() => onTabChange('tenants')}
                className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                title={isCollapsed ? (user?.tenantId && !isGlobalUser() ? 'My Tenant' : 'Tenants') : undefined}
              >
                <TenantsIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (user?.tenantId && !isGlobalUser() ? 'My Tenant' : 'Tenants')}
              </Button>
            )}

            {hasAccessTo('Transactions') && (
              <>
                <Button
                  variant={activeTab === 'modelschema' ? 'default' : 'ghost'}
                  onClick={() => onTabChange('modelschema')}
                  className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                  title={isCollapsed ? 'Transactions' : undefined}
                >
                  <GridIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && 'Transactions'}
                </Button>

                <Button
                  variant={activeTab === 'applications' ? 'default' : 'ghost'}
                  onClick={() => onTabChange('applications')}
                  className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                  title={isCollapsed ? 'Applications' : undefined}
                >
                  <SquareStack className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && 'Applications'}
                </Button>

                <Button
                  variant={activeTab === 'datasources' ? 'default' : 'ghost'}
                  onClick={() => onTabChange('datasources')}
                  className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                  title={isCollapsed ? 'Data Sources' : undefined}
                >
                  <ReceiptText className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && 'Data Sources'}
                </Button>
              </>
            )}

            {hasAccessTo('Data Plane') && (
              <Button
                variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                onClick={() => onTabChange('transactions')}
                className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                title={isCollapsed ? 'Data Plane' : undefined}
              >
                <ListIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && 'Data Plane'}
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Environment Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Environment
                </h3>
              </div>
            )}

            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              onClick={() => onTabChange('profile')}
              className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isCollapsed ? 'Profile' : undefined}
            >
              <UserRound className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Profile'}
            </Button>

            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              onClick={() => onTabChange('settings')}
              className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Settings'}
            </Button>

            <Button
              variant="ghost"
              onClick={logout}
              className={`w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start'} text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950`}
              title={isCollapsed ? 'Log Out' : undefined}
            >
              <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Log Out'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <LogoIcon className="text-gray-400 dark:text-gray-600" width={24} height={20} />
              <LogoText className="text-gray-400 dark:text-gray-600" width={90} height={14} />
            </div>
            <p className="text-xs">© 2025 NexusFlow RT by WorxAI</p>
          </div>
        </div>
      )}
    </aside>
  );
}