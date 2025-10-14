import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { TenantsView } from './components/TenantsView';
import { Info, RefreshCw } from 'lucide-react';
import { getAllTenants, Tenant } from './lib/api';
import { toast } from 'sonner';

export default function App() {
  // Shared state for tenants
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-load tenants from API on mount (CORS is now configured)
  useEffect(() => {
    refreshData();
  }, []);

  // Callback to refresh data from API
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const tenantsData = await getAllTenants();
      setTenants(tenantsData);

      if (tenantsData.length > 0) {
        toast.success(`✅ Loaded ${tenantsData.length} tenant(s) from BFS API`);
      } else {
        toast.info('Connected to API. Database is empty - create your first tenant!');
      }
    } catch (error: any) {
      // Handle errors gracefully
      if (error.message === 'CORS_BLOCKED') {
        toast.error(
          'Cannot connect to API\n\n' +
          'Please check if the API server is accessible.',
          { duration: 6000 }
        );
      } else {
        toast.error(`Could not load tenants: ${error.message}`, { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* API Status Banner */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <strong>BFS API:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">dp-eastus-poc-txservices-apis.azurewebsites.net</code>
                {isLoading && <span className="text-muted-foreground"> • Loading...</span>}
                {!isLoading && tenants.length > 0 && <span className="text-green-600"> • {tenants.length} tenant(s) ✓</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Load from API
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1>BFS Platform Management</h1>
          <p className="text-muted-foreground">
            Manage supplier tenants and ERP transactions
          </p>
        </div>

        {/* Tenants View */}
        <TenantsView
          tenants={tenants}
          setTenants={setTenants}
          isLoading={isLoading}
          refreshData={refreshData}
        />
      </div>

      <Toaster />
    </div>
  );
}
