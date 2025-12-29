/**
 * NexusFlow RT Management Portal
 * 
 * Mock Data Mode:
 * - All data is loaded from /lib/mockData.ts instead of Azure Cosmos DB
 * - Dashboard is now visible as the first menu item
 * - No real API calls are made
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import './styles/globals.css';
import { Tabs, TabsContent } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Skeleton } from './components/ui/skeleton';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { TenantsView } from './components/TenantsView';
import { TransactionsView } from './components/TransactionsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';

// Lazy load heavy components
const ModelSchemaView = lazy(() => import('./components/ModelSchemaView').then(m => ({ default: m.ModelSchemaView })));
const DataSourcesView = lazy(() => import('./components/DataSourcesView').then(m => ({ default: m.DataSourcesView })));
const ApplicationsView = lazy(() => import('./components/ApplicationsView').then(m => ({ default: m.ApplicationsView })));

import { toast } from 'sonner@2.0.3';
import { AuthProvider, useAuth } from './components/AuthContext';
import { SidebarProvider, useSidebar } from './components/SidebarContext';

// Import mock data
import { 
  getMockTenants, 
  getMockDataSources, 
  getMockTransactions,
  MOCK_TRANSACTION_TYPES 
} from './lib/mockData';
import type { Tenant, DataSource, Transaction } from './lib/api';

function AppContent() {
  const { user, isAuthenticated, hasAccessTo, isGlobalUser, login } = useAuth();
  const { isCollapsed } = useSidebar();
  
  // Active tab - start with 'dashboard' now that it's visible
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Build navigation tabs based on user permissions
  const getNavigationTabs = () => {
    const tabs = [];
    
    // Dashboard tab - NOW VISIBLE as first menu item
    tabs.push({
      id: 'dashboard',
      label: 'Dashboard',
      title: 'Dashboard',
      subtitle: 'Overview of your data and activities',
      hidden: false // Changed from true to false
    });
    
    if (hasAccessTo('Tenants') || user?.tenantId) {
      tabs.push({
        id: 'tenants',
        label: user?.tenantId && !isGlobalUser() ? 'My Tenant' : 'Tenants',
        title: 'Tenants',
        subtitle: 'Manage supplier tenants and their configurations'
      });
    }
    
    if (hasAccessTo('Transactions')) {
      tabs.push({
        id: 'modelschema',
        label: 'Transactions',
        title: 'Transaction Onboarding',
        subtitle: 'Define and manage transaction types and models'
      });
      
      tabs.push({
        id: 'applications',
        label: 'Application',
        title: 'Applications',
        subtitle: 'Manage applications and their configurations'
      });
      
      tabs.push({
        id: 'datasources',
        label: 'Data Sources',
        title: 'Data Source Onboarding',
        subtitle: 'Manage data sources and their configurations'
      });
    }
    
    if (hasAccessTo('Data Plane')) {
      tabs.push({
        id: 'transactions',
        label: 'Data Plane',
        title: 'Data Plane',
        subtitle: 'View and manage transaction data across all sources'
      });
    }
    
    // Profile tab
    tabs.push({
      id: 'profile',
      label: 'Profile',
      title: 'Profile',
      subtitle: 'Manage your user profile and preferences',
      hidden: true // Hidden from top tabs, only in sidebar
    });
    
    // Settings tab
    tabs.push({
      id: 'settings',
      label: 'Settings',
      title: 'Settings',
      subtitle: 'Configure application settings',
      hidden: true // Hidden from top tabs, only in sidebar
    });
    
    return tabs;
  };
  
  // Get current tab metadata
  const getCurrentTabMetadata = () => {
    const tabs = getNavigationTabs();
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab || { title: 'NexusFlow RT', subtitle: 'Real-time transaction processing platform' };
  };
  
  // Shared state for tenants (MOCK DATA)
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Shared state for transactions (MOCK DATA)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Shared state for data sources (MOCK DATA)
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState(false);

  // Active tenant state
  const [activeTenantId, setActiveTenantId] = useState<string>('global');

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('nexusflow_theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nexusflow_theme', theme);
  }, [theme]);

  // Check URL for dashboard access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    
    if (urlParams.get('tab') === 'dashboard' || hash === 'dashboard') {
      setActiveTab('dashboard');
      console.log('🔓 Dashboard opened via URL');
    }
  }, []);

  // Load active tenant from localStorage
  useEffect(() => {
    if (user && !isGlobalUser() && user.tenantId) {
      setActiveTenantId(user.tenantId);
      localStorage.setItem('nexusflow_active_tenant', user.tenantId);
      return;
    }
    
    const savedTenantId = localStorage.getItem('nexusflow_active_tenant');
    if (savedTenantId) {
      setActiveTenantId(savedTenantId);
    } else {
      setActiveTenantId('global');
    }
  }, [user, isGlobalUser]);

  // Handle tenant change
  const handleTenantChange = (tenantId: string) => {
    setActiveTenantId(tenantId);
    localStorage.setItem('nexusflow_active_tenant', tenantId);
    
    const tenantName = tenantId === 'global' 
      ? 'Global Tenant' 
      : tenants.find(t => t.TenantId === tenantId)?.TenantName || tenantId;
    
    toast.success(`Switched to ${tenantName}`);
  };

  // Auto-redirect to first accessible tab
  useEffect(() => {
    const getFirstAccessibleTab = () => {
      if (hasAccessTo('Tenants')) return 'tenants';
      if (hasAccessTo('Transactions')) return 'modelschema';
      if (hasAccessTo('Data Plane')) return 'transactions';
      return 'tenants';
    };

    const tabMapping: Record<string, 'Tenants' | 'Transactions' | 'Data Plane'> = {
      'tenants': 'Tenants',
      'modelschema': 'Transactions',
      'datasources': 'Transactions',
      'applications': 'Transactions',
      'transactions': 'Data Plane',
    };

    const currentTabSection = tabMapping[activeTab];
    if (currentTabSection && !hasAccessTo(currentTabSection)) {
      const firstAccessibleTab = getFirstAccessibleTab();
      setActiveTab(firstAccessibleTab);
    }
  }, [user, hasAccessTo, activeTab]);

  // Load MOCK data on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadInitialData = async () => {
      setIsLoadingTenants(true);
      try {
        const mockTenants = await getMockTenants();
        setTenants(mockTenants);
        toast.success(`Loaded ${mockTenants.length} tenant(s) (Mock Data)`, { duration: 2000 });
      } catch (error) {
        toast.error('Failed to load mock data');
      } finally {
        setIsLoadingTenants(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated]);

  // Load data sources (MOCK)
  const refreshDataSources = async () => {
    setIsLoadingDataSources(true);
    try {
      const mockDataSources = await getMockDataSources(activeTenantId === 'global' ? undefined : activeTenantId);
      setDataSources(mockDataSources);
      toast.success(`Loaded ${mockDataSources.length} data source(s) (Mock Data)`);
    } catch (error) {
      toast.error('Failed to load mock data sources');
    } finally {
      setIsLoadingDataSources(false);
    }
  };

  // Load transactions (MOCK)
  const refreshTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const mockTransactions = await getMockTransactions(activeTenantId === 'global' ? undefined : activeTenantId);
      setTransactions(mockTransactions);
      toast.success(`Loaded ${mockTransactions.length} transaction(s) (Mock Data)`);
    } catch (error) {
      toast.error('Failed to load mock transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Refresh tenants (MOCK)
  const refreshTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const mockTenants = await getMockTenants();
      setTenants(mockTenants);
      toast.success(`Refreshed ${mockTenants.length} tenant(s) (Mock Data)`);
    } catch (error) {
      toast.error('Failed to refresh mock tenants');
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Load data when needed
  useEffect(() => {
    if (!isAuthenticated || !tenants.length) return;

    if (activeTab === 'dashboard' || activeTab === 'datasources') {
      refreshDataSources();
    }
    
    if (activeTab === 'dashboard' || activeTab === 'transactions') {
      refreshTransactions();
    }
  }, [activeTab, isAuthenticated, tenants, activeTenantId]);

  // Handle login
  const handleLogin = (email: string, password: string) => {
    // Extract username from email (part before @)
    const username = email.split('@')[0];
    const success = login(username, password);
    
    if (success) {
      toast.success('Welcome back!');
    } else {
      toast.error('Invalid credentials. Try: superuser / super123');
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[rgb(241,243,255)] dark:bg-gray-950">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* TopBar */}
        <TopBar 
          theme={theme} 
          onThemeChange={setTheme}
          currentTabMetadata={getCurrentTabMetadata()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <main className="pt-20 md:pt-24 px-4 md:px-6 py-4 md:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard">
              <DashboardView
                tenants={tenants}
                dataSources={dataSources}
                activeTenantId={activeTenantId}
                isLoadingTenants={isLoadingTenants}
                isLoadingDataSources={isLoadingDataSources}
                userRole={user?.role || 'viewer'}
                transactions={transactions}
                onTabChange={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="tenants">
              <TenantsView
                tenants={tenants}
                setTenants={setTenants}
                isLoading={isLoadingTenants}
                refreshData={refreshTenants}
                userRole={user?.role || 'viewer'}
                activeTenantId={activeTenantId}
                onTenantChange={handleTenantChange}
              />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsView
                transactions={transactions}
                setTransactions={setTransactions}
                isLoading={isLoadingTransactions}
                refreshData={refreshTransactions}
                userRole={user?.role || 'viewer'}
                tenants={tenants}
                activeTenantId={activeTenantId}
                onTenantChange={handleTenantChange}
              />
            </TabsContent>

            <TabsContent value="modelschema">
              <Suspense fallback={
                <div className="w-full max-w-[1440px] mx-auto space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              }>
                <ModelSchemaView 
                  userRole={user?.role || 'viewer'}
                  tenants={tenants}
                  activeTenantId={activeTenantId}
                  onTenantChange={handleTenantChange}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="datasources">
              <Suspense fallback={
                <div className="w-full max-w-[1440px] mx-auto space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              }>
                <DataSourcesView
                  dataSources={dataSources}
                  setDataSources={setDataSources}
                  isLoading={isLoadingDataSources}
                  refreshData={refreshDataSources}
                  userRole={user?.role || 'viewer'}
                  tenants={tenants}
                  activeTenantId={activeTenantId}
                  onTenantChange={handleTenantChange}
                  apicurioArtifacts={[]}
                  isLoadingArtifacts={false}
                  onRefreshArtifacts={async () => {}}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="applications">
              <Suspense fallback={
                <div className="w-full max-w-[1440px] mx-auto space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              }>
                <ApplicationsView
                  userRole={user?.role || 'viewer'}
                  tenants={tenants}
                  activeTenantId={activeTenantId}
                  onTenantChange={handleTenantChange}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="profile">
              <ProfileView />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsView theme={theme} onThemeChange={setTheme} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </AuthProvider>
  );
}