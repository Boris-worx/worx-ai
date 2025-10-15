import { useState, useEffect } from 'react';
import './styles/globals.css';
import { Alert, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { TenantsView } from './components/TenantsView';
import { TransactionsView } from './components/TransactionsView';
import { ModelSchemaView } from './components/ModelSchemaView';
import { Info, RefreshCw, Building2, Receipt, FileJson } from 'lucide-react';
import { getAllTenants, getAllTransactions, Tenant, Transaction } from './lib/api';
import { toast } from 'sonner@2.0.3';

export default function App() {
  // Active tab
  const [activeTab, setActiveTab] = useState('tenants');
  
  // Shared state for tenants
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Shared state for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Auto-load tenants from API on mount
  // Don't auto-load transactions - API requires TxnType parameter
  useEffect(() => {
    refreshTenants();
  }, []);

  // Refresh tenants from API
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
        toast.success(`✅ Loaded ${sortedTenants.length} tenant(s)`);
      }
    } catch (error: any) {
      if (error.message !== 'CORS_BLOCKED') {
        toast.error(`Could not load tenants: ${error.message}`, { duration: 5000 });
      }
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Refresh transactions - no-op since transactions are loaded per-type
  const refreshTransactions = async () => {
    // Transactions are loaded per-type in TransactionsView
    // This is just a placeholder for the interface
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-full">
        {/* API Status Banner - Hidden but kept in code */}
        <Alert className="mb-6 hidden">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <strong>BFS API:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">dp-eastus-poc-txservices-apis.azurewebsites.net</code>
                {activeTab === 'tenants' && (
                  <>
                    {isLoadingTenants && <span className="text-muted-foreground"> • Loading tenants...</span>}
                    {!isLoadingTenants && tenants.length > 0 && <span className="text-green-600"> • {tenants.length} tenant(s) ✓</span>}
                  </>
                )}
                {activeTab === 'transactions' && (
                  <>
                    {isLoadingTransactions && <span className="text-muted-foreground"> • Loading transactions...</span>}
                    {!isLoadingTransactions && transactions.length > 0 && <span className="text-green-600"> • {transactions.length} transaction(s) ✓</span>}
                  </>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1>BFS Transaction and Data Management</h1>
          <p className="text-muted-foreground">
            Manage supplier tenants and ERP transactions
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="tenants" className="gap-2">
                <Building2 className="h-4 w-4" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="modelschema" className="gap-2">
                <FileJson className="h-4 w-4" />
                Transaction Onboarding
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2">
                <Receipt className="h-4 w-4" />
                Data Plan
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tenants">
            <TenantsView
              tenants={tenants}
              setTenants={setTenants}
              isLoading={isLoadingTenants}
              refreshData={refreshTenants}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsView
              transactions={transactions}
              setTransactions={setTransactions}
              isLoading={isLoadingTransactions}
              refreshData={refreshTransactions}
            />
          </TabsContent>

          <TabsContent value="modelschema">
            <ModelSchemaView />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}