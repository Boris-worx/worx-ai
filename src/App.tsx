import { useState, useEffect } from 'react';
import './styles/globals.css';
import { Alert, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { TenantsView } from './components/TenantsView';
import { TransactionsView } from './components/TransactionsView';
import { ModelSchemaView } from './components/ModelSchemaView';
import { DataSourcesView } from './components/DataSourcesView';
import { ApplicationsView } from './components/ApplicationsView';
import { BugReportDialog } from './components/BugReportDialog';
import { TutorialDialog } from './components/TutorialDialog';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { getTutorialSteps, getTutorialName } from './components/tutorial-steps';
import { ApicurioTestDialog } from './components/ApicurioTestDialog';
import { MobileMenu } from './components/MobileMenu';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { TenantsIcon } from './components/icons/TenantsIcon';
import { GridIcon } from './components/icons/GridIcon';
import { ListIcon } from './components/icons/ListIcon';
import { BugIcon } from './components/icons/BugIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import { SunIcon } from './components/icons/SunIcon';
import { Info, RefreshCw, Building2, Receipt, FileJson, Bug, Moon, Sun, AppWindow, Database } from 'lucide-react';
import { getAllTenants, getAllTransactions, getAllDataSources, loadTransactionTypes, Tenant, Transaction, DataSource } from './lib/api';
import { toast } from 'sonner@2.0.3';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginDialog } from './components/LoginDialog';
import { UserMenu } from './components/UserMenu';
import { searchApicurioArtifacts, ApicurioArtifact, clearArtifactsCache, hasApicurioCachedData } from './lib/apicurio';
import { useDataPreloader } from './lib/useDataPreloader';

function AppContent() {
  const { user, isAuthenticated, hasAccessTo, isGlobalUser } = useAuth();
  
  // Data preloader
  const { state: preloadState, data: preloadedData, retry: retryPreload } = useDataPreloader();
  
  // Active tab
  const [activeTab, setActiveTab] = useState('tenants');
  
  // Build navigation tabs based on user permissions
  const getNavigationTabs = () => {
    const tabs = [];
    
    // Tenants tab: Global users see "Tenants", tenant-specific users see "My Tenant"
    if (hasAccessTo('Tenants') || user?.tenantId) {
      tabs.push({
        id: 'tenants',
        label: user?.tenantId && !isGlobalUser() ? 'My Tenant' : 'Tenants',
        icon: <TenantsIcon className="h-4 w-4 mr-2" />,
        title: 'Tenants',
        subtitle: 'Manage supplier tenants and their configurations'
      });
    }
    
    if (hasAccessTo('Transactions')) {
      tabs.push({
        id: 'modelschema',
        label: 'Transactions',
        icon: <GridIcon className="h-4 w-4 mr-2" />,
        title: 'Transaction Onboarding',
        subtitle: 'Define and manage transaction types and models'
      });
      
      tabs.push({
        id: 'applications',
        label: 'Application',
        icon: <AppWindow className="h-4 w-4 mr-2" />,
        title: 'Applications',
        subtitle: 'Manage applications and their configurations'
      });
      
      tabs.push({
        id: 'datasources',
        label: 'Data Sources',
        icon: <Receipt className="h-4 w-4 mr-2" />,
        title: 'Data Source Onboarding',
        subtitle: 'Manage data sources and their configurations'
      });
    }
    
    if (hasAccessTo('Data Plane')) {
      tabs.push({
        id: 'transactions',
        label: 'Data Plane',
        icon: <ListIcon className="h-4 w-4 mr-2" />,
        title: 'Data Plane',
        subtitle: 'View and manage transaction data across all sources'
      });
    }
    
    return tabs;
  };
  
  // Get current tab metadata
  const getCurrentTabMetadata = () => {
    const tabs = getNavigationTabs();
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab || { title: 'Paradigm Transaction Gateway Management', subtitle: 'Manage supplier tenants and ERP transactions' };
  };
  
  // Shared state for tenants
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Shared state for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Shared state for data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState(false);

  // Shared state for Apicurio artifacts (loaded at app start)
  const [apicurioArtifacts, setApicurioArtifacts] = useState<ApicurioArtifact[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);

  // Active tenant state
  const [activeTenantId, setActiveTenantId] = useState<string>('global');

  // Bug report dialog state
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  
  // Tutorial dialog state
  const [tutorialOpen, setTutorialOpen] = useState(false);
  
  // Apicurio connection test dialog state
  const [apicurioTestOpen, setApicurioTestOpen] = useState(false);

  // Theme state - initialize from localStorage or default to light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('bfs_theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bfs_theme', theme);
  }, [theme]);

  // Clean up old navigation order from localStorage
  useEffect(() => {
    localStorage.removeItem('bfs_nav_order');
  }, []);

  // Load active tenant from localStorage on mount or set from user
  useEffect(() => {
    // Tenant-specific users: lock to their tenant
    if (user && !isGlobalUser() && user.tenantId) {
      setActiveTenantId(user.tenantId);
      localStorage.setItem('bfs_active_tenant', user.tenantId);
      return;
    }
    
    // Global users (superuser and viewonlysuperuser): allow tenant switching
    const savedTenantId = localStorage.getItem('bfs_active_tenant');
    if (savedTenantId) {
      setActiveTenantId(savedTenantId);
    } else {
      setActiveTenantId('global');
    }
  }, [user, isGlobalUser]);

  // Handle tenant change
  const handleTenantChange = (tenantId: string) => {
    setActiveTenantId(tenantId);
    localStorage.setItem('bfs_active_tenant', tenantId);
    
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
      if (hasAccessTo('Transactions')) return 'datasources';
      if (hasAccessTo('Transactions')) return 'applications';
      if (hasAccessTo('Data Plane')) return 'transactions';
      return 'tenants'; // default fallback
    };

    const tabMapping: Record<string, 'Tenants' | 'Transactions' | 'Data Plane'> = {
      'tenants': 'Tenants',
      'modelschema': 'Transactions',
      'datasources': 'Transactions',
      'applications': 'Transactions',
      'transactions': 'Data Plane',
    };

    // Check if user has access to current tab
    const currentTabSection = tabMapping[activeTab];
    if (currentTabSection && !hasAccessTo(currentTabSection)) {
      // Redirect to first accessible tab
      const firstAccessibleTab = getFirstAccessibleTab();
      setActiveTab(firstAccessibleTab);
    }
  }, [user, hasAccessTo, activeTab]);

  // Show initial loading toast
  useEffect(() => {
    if (preloadState.isPreloading && !preloadState.isComplete) {
      toast.loading('Loading data...', { id: 'initial-load' });
    }
  }, [preloadState.isPreloading, preloadState.isComplete]);

  // Initialize data from preloader when complete
  useEffect(() => {
    if (preloadState.isComplete) {
      setTenants(preloadedData.tenants);
      // Removed: setApicurioArtifacts - loaded lazily when Data Source Onboarding opens
      
      // Dismiss loading toast
      toast.dismiss('initial-load');
      
      // Show success message only if there were no errors
      if (!preloadState.error && preloadedData.tenants.length > 0) {
        toast.success(`Loaded ${preloadedData.tenants.length} tenant(s)`, { duration: 3000 });
      } else if (preloadState.error) {
        toast.error('Some data failed to load', { duration: 3000 });
      }
    }
  }, [preloadState.isComplete, preloadedData, preloadState.error]);

  // Track if data sources have been loaded at least once
  const [dataSourcesLoaded, setDataSourcesLoaded] = useState(false);
  
  // Track if Apicurio schemas have been loaded at least once
  const [apicurioSchemasLoaded, setApicurioSchemasLoaded] = useState(false);

  // Background load Apicurio schemas immediately on app mount (don't wait for datasources tab)
  useEffect(() => {
    const loadApicurioSchemas = async () => {
      if (!apicurioSchemasLoaded && isAuthenticated) {
        // Check if we have cached data first
        const hasCached = hasApicurioCachedData();
        
        if (hasCached) {
          console.log('📦 [Background] Apicurio templates available from cache - loading instantly');
        } else {
          console.log('📡 [Background] No cache - fetching Apicurio templates from API...');
          setIsLoadingArtifacts(true);
        }
        
        try {
          const result = await searchApicurioArtifacts('Value');
          setApicurioArtifacts(result.artifacts);
          setApicurioSchemasLoaded(true);
          
          if (hasCached) {
            console.log(`✅ [Background] ${result.count} Apicurio templates ready (from cache)`);
          } else {
            console.log(`✅ [Background] Loaded ${result.count} Apicurio templates from API`);
          }
        } catch (error) {
          console.error('[Background] Failed to load Apicurio schemas:', error);
          // Don't block the UI if Apicurio fails
          setApicurioSchemasLoaded(true); // Mark as loaded to avoid retry loops
        } finally {
          setIsLoadingArtifacts(false);
        }
      }
    };
    
    loadApicurioSchemas();
  }, [apicurioSchemasLoaded, isAuthenticated]);

  // Lazy load data sources when user opens datasources or transactions tab
  useEffect(() => {
    const needsDataSources = (activeTab === 'datasources' || activeTab === 'transactions');
    
    if (needsDataSources && !dataSourcesLoaded && activeTenantId && tenants.length > 0) {
      refreshDataSources();
      setDataSourcesLoaded(true);
    }
  }, [activeTab, activeTenantId, tenants, dataSourcesLoaded]);

  // Reload data sources when active tenant changes (only if already loaded once)
  useEffect(() => {
    if (dataSourcesLoaded && activeTenantId && tenants.length > 0) {
      refreshDataSources();
    }
  }, [activeTenantId]);

  // Refresh tenants from API (manual refresh only, initial load handled by preloader)
  const refreshTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const tenantsData = await getAllTenants();
      
      // Sort by CreateTime descending (newest first)
      const sortedTenants = [...tenantsData].sort((a, b) => {
        const dateA = a.CreateTime ? new Date(a.CreateTime).getTime() : 0;
        const dateB = b.CreateTime ? new Date(b.CreateTime).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      setTenants(sortedTenants);
      
      if (sortedTenants.length > 0) {
        toast.success(`Refreshed ${sortedTenants.length} tenant(s)`);
      }
    } catch (error: any) {
      if (error.message !== 'CORS_BLOCKED') {
        toast.error(`Could not load tenants: ${error.message}`, { duration: 5000 });
      }
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Refresh Apicurio artifacts from Apicurio Registry (manual refresh only)
  const refreshApicurioArtifacts = async () => {
    setIsLoadingArtifacts(true);
    try {
      // Clear cache before refresh
      clearArtifactsCache();
      console.log('🗑️ Cleared Apicurio artifacts cache before refresh');
      const response = await searchApicurioArtifacts('Value');
      setApicurioArtifacts(response.artifacts);
      console.log(`✅ Refreshed ${response.count} Apicurio artifacts from registry`);
      toast.success(`Refreshed ${response.count} Apicurio artifact(s)`);
    } catch (error) {
      console.error('Failed to refresh Apicurio artifacts:', error);
      toast.error('Could not refresh Apicurio artifacts', { duration: 5000 });
      // Don't clear existing artifacts on refresh failure
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Force refresh Apicurio artifacts (clears cache first)
  const forceRefreshApicurioArtifacts = async () => {
    clearArtifactsCache();
    await refreshApicurioArtifacts();
  };

  // Refresh transactions - no-op since transactions are loaded per-type
  const refreshTransactions = async () => {
    // Transactions are loaded per-type in TransactionsView
    // This is just a placeholder for the interface
  };

  // Refresh data sources from API (filtered by active tenant)
  const refreshDataSources = async () => {
    setIsLoadingDataSources(true);
    try {
      let allDataSources: DataSource[] = [];
      
      if (activeTenantId === 'global') {
        // For global tenant, fetch data sources from ALL tenants and combine them
        console.log('📡 Fetching data sources for GLOBAL tenant (all tenants)...');
        
        // Get data sources for each tenant
        const promises = tenants.map(async (tenant) => {
          try {
            const tenantDataSources = await getAllDataSources(tenant.TenantId);
            console.log(`✅ Loaded ${tenantDataSources.length} data sources for tenant ${tenant.TenantId}`);
            return tenantDataSources;
          } catch (error) {
            console.error(`❌ Failed to load data sources for tenant ${tenant.TenantId}:`, error);
            return [];
          }
        });
        
        // Wait for all requests to complete
        const results = await Promise.all(promises);
        allDataSources = results.flat();
        
        console.log(`✅ Total data sources from all tenants: ${allDataSources.length}`);
      } else {
        // For specific tenant, fetch only that tenant's data sources
        allDataSources = await getAllDataSources(activeTenantId);
        console.log(`✅ Loaded ${allDataSources.length} data sources for tenant ${activeTenantId}`);
      }
      
      // Sort by CreateTime descending (newest first)
      const sortedDataSources = [...allDataSources].sort((a, b) => {
        const dateA = a.CreateTime ? new Date(a.CreateTime).getTime() : 0;
        const dateB = b.CreateTime ? new Date(b.CreateTime).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      setDataSources(sortedDataSources);
      
      if (sortedDataSources.length > 0) {
        toast.success(`Loaded ${sortedDataSources.length} data source(s)`);
      }
    } catch (error: any) {
      if (error.message !== 'CORS_BLOCKED') {
        toast.error(`Could not load data sources: ${error.message}`, { duration: 5000 });
      }
    } finally {
      setIsLoadingDataSources(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full border-b bg-white dark:bg-card ${!isAuthenticated ? 'blur-sm' : ''}`}>
        <div className="container mx-auto px-4 py-3 max-w-[1440px]">
          <div className="flex items-center justify-between">
            {/* Left - Logo and Title */}
            <div className="flex items-center gap-3 md:w-auto">
              <svg width="48" height="48" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M79.5452 0H16.4548C7.36707 0 0 7.36811 0 16.4571V79.5429C0 88.6319 7.36706 96 16.4548 96H79.5452C88.6329 96 96 88.6319 96 79.5429V16.4571C96 7.36812 88.6329 0 79.5452 0Z" fill="url(#paint0_linear_12402_1400)"/>
<path d="M58.5836 59.5607V66.7565C58.5836 67.6492 57.8702 68.366 56.9818 68.366H39.1867C38.2983 68.366 37.5848 67.6492 37.5848 66.7565V59.5607C37.5848 58.668 36.8714 57.9512 35.983 57.9512H26.9778V77.4148C26.9778 78.3075 27.6912 79.0243 28.5796 79.0243H67.6023C68.4907 79.0243 69.2041 78.3075 69.2041 77.4148V57.9512H60.1989C59.3105 57.9512 58.597 58.668 58.597 59.5607" fill="white"/>
<path d="M80.5582 55.3558L49.0326 16.9722C48.3983 16.1963 47.1838 16.1963 46.5495 16.9722L15.0239 55.3558C14.1736 56.3993 14.9159 57.9512 16.2654 57.9512H26.6165L46.5495 33.7358C47.1972 32.9598 48.3983 32.9598 49.0326 33.7358L68.9656 57.9512H79.3301C80.6797 57.9512 81.422 56.3993 80.5717 55.3558" fill="white"/>
<defs>
<linearGradient id="paint0_linear_12402_1400" x1="50.3855" y1="-0.546216" x2="50.3855" y2="96.0033" gradientUnits="userSpaceOnUse">
<stop stopColor="#E11837"/>
<stop offset="0.34" stopColor="#DC1734"/>
<stop offset="0.73" stopColor="#CD152D"/>
<stop offset="1" stopColor="#C01327"/>
</linearGradient>
</defs>
</svg>
              <span className="font-bold text-sm md:text-base whitespace-nowrap leading-none text-[rgb(0,32,91)] dark:text-white">Paradigm Transaction<br></br>Gateway Management</span>
            </div>

            {/* Center - Navigation (Desktop only) */}
            <nav className="hidden md:flex items-center gap-1">
              {getNavigationTabs().map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>

            {/* Right - Actions + Mobile Menu */}
            <div className="flex items-center gap-2 md:w-[200px] justify-end">
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                {/* API Connection Test Button - Hidden for now */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setApicurioTestOpen(true)}
                  className="shrink-0"
                  title="Test API connections (Apicurio & BFS)"
                >
                  <Database className="h-5 w-5" />
                </Button> */}

                {/* Tutorial Button - Only for Tenants tab */}
                {activeTab === 'tenants' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTutorialOpen(true)}
                    className="shrink-0"
                    title="Tutorial - How to use this app"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                )}

                {/* Bug Report Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setBugDialogOpen(true)}
                  className="shrink-0"
                  title="Report a bug"
                >
                  <BugIcon className="h-5 w-5" />
                </Button>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="shrink-0"
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

              {/* Mobile Menu */}
              <MobileMenu
                activeTab={activeTab}
                onTabChange={setActiveTab}
                theme={theme}
                onThemeChange={setTheme}
                onTutorialClick={() => setTutorialOpen(true)}
                onBugReportClick={() => setBugDialogOpen(true)}
                onApicurioTestClick={() => setApicurioTestOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 container mx-auto py-4 md:py-8 px-4 max-w-full ${!isAuthenticated ? 'blur-sm' : ''}`}>
        {/* Header Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-[32px] font-[Inter] font-bold text-center">{getCurrentTabMetadata().title}</h1>
          <p className="text-muted-foreground text-sm md:text-base text-center">
            {getCurrentTabMetadata().subtitle}
          </p>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <ModelSchemaView 
              userRole={user?.role || 'viewer'}
              tenants={tenants}
              activeTenantId={activeTenantId}
              onTenantChange={handleTenantChange}
            />
          </TabsContent>

          <TabsContent value="datasources">
            <DataSourcesView
              dataSources={dataSources}
              setDataSources={setDataSources}
              isLoading={isLoadingDataSources}
              refreshData={refreshDataSources}
              userRole={user?.role || 'viewer'}
              tenants={tenants}
              activeTenantId={activeTenantId}
              onTenantChange={handleTenantChange}
              apicurioArtifacts={apicurioArtifacts}
              isLoadingArtifacts={isLoadingArtifacts}
              onRefreshArtifacts={forceRefreshApicurioArtifacts}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsView
              userRole={user?.role || 'viewer'}
              tenants={tenants}
              activeTenantId={activeTenantId}
              onTenantChange={handleTenantChange}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className={`w-full border-t bg-background mt-auto ${!isAuthenticated ? 'blur-sm' : ''}`}>
        <div className="container mx-auto px-4 py-6 w-full max-w-[1440px]  ">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left - Logo */}
            <div className="flex items-center">
              <svg width="365" height="15" viewBox="0 0 643 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M592.996 1.72869C595.86 1.72869 598.426 1.66957 600.962 1.72869C602.752 1.78781 603.438 3.23632 604.065 4.59614C606.183 9.38507 608.242 14.2036 610.36 18.9925C610.808 19.9976 611.315 20.9731 611.792 21.9782L612.448 22.126C612.956 21.2983 613.523 20.4706 613.91 19.6133C616.088 14.6765 618.266 9.76936 620.325 4.80306C621.22 2.64509 622.562 1.4922 625.009 1.66957C627.068 1.78781 629.126 1.66957 631.334 1.66957V26.5897H625.874V7.5227C625.665 7.46358 625.456 7.43402 625.277 7.3749C624.8 8.26174 624.293 9.11901 623.875 10.0059C621.876 14.3809 619.937 18.7856 617.908 23.1606C616.357 26.5306 612.657 28.0087 609.226 26.4715C608.182 25.9985 607.347 24.7569 606.81 23.6632C604.662 19.1994 602.692 14.647 600.604 10.1537C600.186 9.23726 599.649 8.35042 599.172 7.46358C598.963 7.5227 598.754 7.55227 598.575 7.58183V26.5897H593.026V1.72869H592.996Z" fill="#A6A6A6"/>
<path d="M580.764 1.66968V6.63598C579.959 6.72466 579.153 6.87247 578.318 6.87247C572.888 6.87247 567.458 6.87247 562.028 6.90203C558.03 6.96115 557.105 7.93667 557.075 11.8388C557.075 14.0263 557.076 16.2434 557.135 18.4309C557.165 20.1159 558.09 21.5644 559.701 21.6236C564.743 21.8009 569.785 21.6827 575.305 21.6827C575.454 19.9386 575.573 18.3422 575.722 16.3321H563.908V12.0753H580.287C580.287 12.0753 580.675 12.3709 580.675 12.5482C580.675 16.273 580.854 20.0272 580.556 23.752C580.376 25.9986 579.064 26.7377 576.856 26.7377C570.979 26.7377 565.131 26.7377 559.253 26.7377C555.017 26.7377 552.242 24.8162 551.765 20.7072C551.288 16.5094 551.317 12.1935 551.765 7.99579C552.153 4.18239 554.569 2.17222 558.627 1.93573C563.818 1.64012 569.069 1.7288 574.26 1.69924C576.319 1.69924 578.378 1.69924 580.764 1.69924" fill="#A6A6A6"/>
<path d="M431.739 18.5196C433.976 21.3279 435.945 23.7815 438.183 26.5898H431.649C429.74 24.1067 427.741 21.5348 425.861 19.1108H414.166V26.6194H408.646V1.81746C409.571 1.75834 410.347 1.69922 411.123 1.69922C416.911 1.69922 422.699 1.69922 428.487 1.69922C434.961 1.69922 437.019 3.82763 436.99 10.3016C436.99 10.8632 436.99 11.4249 436.99 11.9865C436.87 15.2087 435.408 17.485 431.768 18.5492M414.196 14.2628C414.703 14.4106 414.971 14.5288 415.21 14.5288C419.506 14.5288 423.803 14.5879 428.069 14.5288C430.694 14.4993 431.41 13.5237 431.351 10.4494C431.321 7.70016 430.426 6.72464 427.86 6.72464C423.922 6.69508 419.984 6.69508 416.075 6.72464C415.419 6.72464 414.792 6.93157 414.166 7.02025V14.2332L414.196 14.2628Z" fill="#A6A6A6"/>
<path d="M492.781 26.442V1.84705C493.586 1.78792 494.213 1.66968 494.839 1.66968C500.21 1.66968 505.55 1.66968 510.92 1.66968C511.905 1.66968 512.919 1.78792 513.904 1.90617C518.379 2.46783 521.034 4.53712 521.512 8.88264C521.959 12.696 521.87 16.6573 521.363 20.4707C520.855 24.2841 517.932 26.5603 514.023 26.649C507.161 26.7968 500.299 26.7081 493.437 26.7081C493.258 26.7081 493.049 26.5603 492.751 26.4125M498.181 21.6531C498.658 21.7714 498.867 21.8896 499.046 21.8896C501.254 21.8896 503.462 21.9192 505.699 21.9192C507.758 21.9192 509.846 22.0079 511.905 21.8305C514.68 21.5644 515.843 20.5593 516.052 17.8988C516.261 15.3861 516.141 12.8143 515.992 10.3016C515.873 8.35053 514.59 7.02027 512.71 6.96115C507.907 6.81334 503.074 6.90203 498.151 6.90203V21.6531H498.181Z" fill="#A6A6A6"/>
<path d="M334.358 19.4063V26.5897H328.958V1.96518C329.704 1.8765 330.39 1.69913 331.076 1.69913C337.163 1.69913 343.249 1.64001 349.305 1.69913C352.319 1.69913 355.422 2.05386 356.585 5.39429C357.778 8.88252 357.838 12.5777 356.406 15.9772C355.272 18.6969 352.587 19.229 349.932 19.2585C345.785 19.3177 341.638 19.2585 337.491 19.2585C336.566 19.2585 335.671 19.3472 334.388 19.3768M334.567 6.72455V14.2922C339.669 14.2922 344.651 14.3809 349.604 14.174C350.32 14.174 351.215 12.7846 351.573 11.8682C351.901 11.0996 351.662 10.065 351.573 9.14857C351.453 7.67051 350.588 6.75411 349.097 6.75411C344.323 6.69499 339.549 6.75411 334.537 6.75411" fill="#A6A6A6"/>
<path d="M464.885 6.96113C461.335 13.4646 457.814 19.9977 454.204 26.6194H447.909C448.625 25.2891 449.222 24.1954 449.819 23.1312C453.1 17.1598 456.352 11.1884 459.634 5.21701C461.454 1.90615 463.304 0.901065 467.003 1.84703C468.167 2.14264 469.48 3.11816 470.106 4.15281C474.224 11.2771 478.132 18.49 482.13 25.6734C482.249 25.9099 482.249 26.176 482.368 26.6194H476.491C472.911 20.1159 469.271 13.5237 465.631 6.93157C465.392 6.93157 465.154 6.93157 464.915 6.96113" fill="#A6A6A6"/>
<path d="M380.692 6.99066C377.112 13.5533 373.531 20.1159 369.981 26.6785H364.104C364.193 26.2055 364.193 25.7916 364.372 25.4665C368.251 18.4013 372.129 11.3066 376.097 4.27102C378.066 0.782787 383.795 0.516735 385.764 3.91628C389.941 11.1588 393.938 18.49 398.026 25.7916C398.145 26.0281 398.175 26.3237 398.264 26.6785H392.357C388.777 20.175 385.107 13.5828 381.467 6.99066C381.229 6.99066 380.99 6.99066 380.751 6.99066" fill="#A6A6A6"/>
<path d="M539.264 1.81738H534.072V26.6193H539.264V1.81738Z" fill="#A6A6A6"/>
<path d="M635.004 3.38415C635.213 2.88161 635.541 2.43819 635.899 2.08345C636.257 1.72872 636.734 1.4331 637.242 1.22618C637.749 1.01925 638.286 0.901001 638.853 0.901001C639.42 0.901001 639.957 1.01925 640.464 1.22618C640.971 1.4331 641.418 1.72872 641.776 2.08345C642.164 2.43819 642.463 2.88161 642.672 3.38415C642.88 3.88669 643 4.4188 643 5.01002C643 5.60125 642.88 6.16291 642.672 6.66545C642.463 7.168 642.135 7.61142 641.776 7.96615C641.389 8.35045 640.971 8.6165 640.464 8.82343C639.957 9.03036 639.42 9.11904 638.853 9.11904C638.286 9.11904 637.749 9.03036 637.242 8.82343C636.734 8.6165 636.287 8.32089 635.899 7.96615C635.511 7.61142 635.213 7.168 635.004 6.66545C634.795 6.16291 634.676 5.60125 634.676 5.01002C634.676 4.4188 634.795 3.88669 635.004 3.38415ZM635.69 6.3994C635.869 6.84282 636.108 7.19756 636.406 7.52273C636.705 7.84791 637.063 8.0844 637.48 8.26176C637.898 8.43913 638.345 8.52782 638.853 8.52782C639.36 8.52782 639.778 8.43913 640.195 8.26176C640.613 8.0844 640.971 7.84791 641.269 7.52273C641.568 7.19756 641.806 6.84282 641.985 6.3994C642.164 5.95598 642.254 5.51256 642.254 5.01002C642.254 4.50748 642.164 4.06406 641.985 3.62064C641.806 3.20678 641.568 2.82249 641.269 2.52687C640.971 2.2017 640.613 1.96521 640.195 1.78784C639.778 1.61047 639.33 1.52179 638.853 1.52179C638.375 1.52179 637.898 1.61047 637.48 1.78784C637.063 1.96521 636.705 2.2017 636.406 2.52687C636.108 2.85205 635.869 3.20678 635.69 3.62064C635.511 4.0345 635.422 4.50748 635.422 5.01002C635.422 5.51256 635.511 5.98554 635.69 6.3994ZM639.121 2.61556C639.688 2.61556 640.136 2.7338 640.404 2.97029C640.673 3.20678 640.822 3.53196 640.822 4.00494C640.822 4.44836 640.702 4.74397 640.464 4.9509C640.225 5.15783 639.927 5.27607 639.539 5.30563L640.941 7.43405H640.136L638.823 5.36476H638.017V7.43405H637.271V2.61556H639.151H639.121ZM638.793 4.74397C638.972 4.74397 639.121 4.74397 639.27 4.74397C639.42 4.74397 639.569 4.71441 639.688 4.65529C639.807 4.59616 639.897 4.53704 639.957 4.4188C640.016 4.30055 640.076 4.15274 640.076 3.97538C640.076 3.82757 640.046 3.67976 639.986 3.59108C639.927 3.5024 639.837 3.41371 639.748 3.38415C639.658 3.32503 639.539 3.29547 639.39 3.2659C639.27 3.2659 639.121 3.2659 639.002 3.2659H637.987V4.80309H638.763L638.793 4.74397Z" fill="#A6A6A6"/>
<path d="M253.089 0.959839H263.322C268.991 0.959839 271.527 3.94553 271.527 7.46332C271.527 10.449 269.796 12.3705 267.857 13.08C269.647 13.6712 272.362 15.504 272.362 19.1992C272.362 23.9585 268.663 26.7964 263.621 26.7964H253.089V0.959839ZM262.696 11.6019C266.246 11.6019 267.648 10.183 267.648 7.81806C267.648 5.63052 266.037 4.09334 263.143 4.09334H256.878V11.6019H262.696ZM256.878 23.6925H263.054C266.276 23.6925 268.364 22.244 268.364 19.1992C268.364 16.5091 266.634 14.7354 262.487 14.7354H256.848V23.6925H256.878Z" fill="#A6A6A6"/>
<path d="M201.534 0.959839H211.022C218.421 0.959839 223.373 5.92614 223.373 13.5825C223.373 21.2389 218.54 26.7668 210.872 26.7668H201.534V0.959839ZM205.383 23.6038H210.604C216.541 23.6038 219.316 19.3765 219.316 13.6712C219.316 8.73446 216.78 4.18202 210.664 4.18202H205.413V23.5742L205.383 23.6038Z" fill="#A6A6A6"/>
<path d="M188.138 14.8832H175.279V23.5447H189.421L188.944 26.7668H171.49V0.959839H188.735V4.24114H175.279V11.661H188.138V14.8832Z" fill="#A6A6A6"/>
<path d="M143.595 15.5927V26.7668H139.776V0.959839H150.219C155.619 0.959839 158.513 3.88641 158.513 7.90674C158.513 11.2767 156.573 13.2869 154.187 13.9964C156.126 14.5285 158.005 16.0657 158.005 20.559V21.6823C158.005 23.456 157.976 25.6435 158.393 26.7668H154.634C154.187 25.6435 154.187 23.6334 154.187 21.1502V20.6772C154.187 17.1594 153.202 15.5927 148.607 15.5927H143.625H143.595ZM143.595 12.4296H149.085C152.904 12.4296 154.515 11.0107 154.515 8.23192C154.515 5.63052 152.784 4.15246 149.413 4.15246H143.595V12.4296Z" fill="#A6A6A6"/>
<path d="M126.38 14.8832H113.521V23.5447H127.663L127.186 26.7668H109.732V0.959839H126.977V4.24114H113.521V11.661H126.38V14.8832Z" fill="#A6A6A6"/>
<path d="M71.3646 26.7669L64.4131 0.959839H68.5303C70.6187 10.0647 73.095 19.7313 73.5425 22.6578H73.5724C74.3183 19.0514 77.6896 7.49289 79.3603 0.959839H83.0599C84.5516 6.57649 87.9229 19.0809 88.5793 22.51H88.6091C89.4744 17.7802 92.8755 6.04438 94.2479 0.959839H98.037L90.5484 26.7964H86.461C84.9096 20.8842 81.777 9.35525 81.0609 6.01482H81.0311C80.2554 10.0056 77.0631 21.0024 75.452 26.7964H71.3646V26.7669Z" fill="#A6A6A6"/>
<path d="M0 0.959839H10.0543C15.2158 0.959839 18.7065 3.82728 18.7065 8.58665C18.7065 13.7008 14.9473 16.3908 9.8455 16.3908H3.8487V26.7964H0V0.959839ZM3.8487 13.1982H9.57699C12.9483 13.1982 14.7683 11.6019 14.7683 8.67534C14.7683 5.74877 12.6201 4.18202 9.69633 4.18202H3.8487V13.1982Z" fill="#A6A6A6"/>
<path d="M290.77 26.7669V17.3664C290.77 17.1003 290.71 16.8638 290.591 16.6569L281.432 0.930298H285.847C288.144 5.09844 291.695 11.4541 292.888 13.819C294.022 11.5132 297.721 5.03932 300.078 0.930298H304.196L294.798 16.6865C294.738 16.8343 294.648 16.9821 294.648 17.3664V26.7669H290.74H290.77Z" fill="#A6A6A6"/>
<path d="M54.1803 13.7303C54.1803 20.8546 50.0929 27.1512 41.8287 27.1512C34.0716 27.1512 29.7754 21.2685 29.7754 13.8781C29.7754 6.48782 34.2506 0.575562 42.1569 0.575562C49.5559 0.575562 54.2101 6.01484 54.2101 13.7303H54.1803ZM33.8628 13.7599C33.8628 19.2287 36.6076 23.8994 42.0077 23.8994C47.8553 23.8994 50.1526 19.1105 50.1526 13.7895C50.1526 8.46843 47.557 3.79774 42.0077 3.79774C36.4584 3.79774 33.8628 8.32062 33.8628 13.7599Z" fill="#A6A6A6"/>
</svg>

            </div>
            
            {/* Right - Copyright */}
            <p className="text-xs text-muted-foreground">
              ©2025 WTS Paradigm, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Tutorial Dialog - Old version */}
      {/* <TutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} /> */}
      
      {/* Interactive Tutorial - Context-aware for each tab */}
      <InteractiveTutorial 
        open={tutorialOpen} 
        onOpenChange={setTutorialOpen}
        steps={getTutorialSteps(activeTab)}
        tabName={getTutorialName(activeTab)}
      />

      {/* Bug Report Dialog */}
      <BugReportDialog open={bugDialogOpen} onOpenChange={setBugDialogOpen} />
      
      {/* Apicurio Connection Test Dialog */}
      <ApicurioTestDialog open={apicurioTestOpen} onOpenChange={setApicurioTestOpen} />

      {/* Login Dialog */}
      <LoginDialog />

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}