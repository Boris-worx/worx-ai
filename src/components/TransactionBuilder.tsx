import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Link2, Save, Search, X, RefreshCw } from 'lucide-react';
import { Tenant, Transaction } from '../lib/api';
import { toast } from 'sonner';

interface BuilderAction {
  store: boolean;
  publish: boolean;
  respond: boolean;
  agent: boolean;
}

interface TransactionBuilderProps {
  tenants: Tenant[];
  transactions: Transaction[];
  isLoading: boolean;
  refreshData: () => void;
}

export function TransactionBuilder({ tenants, transactions, isLoading, refreshData }: TransactionBuilderProps) {

  // Selection
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');

  // Search
  const [tenantSearch, setTenantSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  // Edit
  const [requestJSON, setRequestJSON] = useState<string>('');
  const [responseJSON, setResponseJSON] = useState<string>('');
  const [actions, setActions] = useState<BuilderAction>({
    store: false,
    publish: false,
    respond: false,
    agent: false,
  });

  // Filter tenants by search
  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const lower = tenantSearch.toLowerCase();
    return tenants.filter((t) =>
      t.TenantName.toLowerCase().includes(lower) ||
      t.TenantId.toLowerCase().includes(lower)
    );
  }, [tenants, tenantSearch]);

  // Filter transactions by tenant and search
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by tenant (if not ALL)
    if (selectedTenantId !== 'ALL') {
      // In real scenario, transactions would have TenantId field
      // For now, show all transactions for any tenant
      filtered = transactions;
    }

    // Filter by search
    if (transactionSearch.trim()) {
      const lower = transactionSearch.toLowerCase();
      filtered = filtered.filter((t) =>
        t.TransactionName.toLowerCase().includes(lower) ||
        t.TransactionId.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [transactions, selectedTenantId, transactionSearch]);

  // Handle tenant selection
  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    // Reset transaction selection when changing tenant
    if (filteredTransactions.length > 0) {
      const firstTransaction = filteredTransactions[0];
      setSelectedTransactionId(firstTransaction.TransactionId);
      setRequestJSON(JSON.stringify(firstTransaction.RequestJSON, null, 2));
      setResponseJSON(JSON.stringify(firstTransaction.ResponseJSON, null, 2));
    }
  };

  // Handle transaction selection
  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.TransactionId);
    setRequestJSON(JSON.stringify(transaction.RequestJSON, null, 2));
    setResponseJSON(JSON.stringify(transaction.ResponseJSON, null, 2));
  };

  // Handle action checkbox
  const handleActionChange = (action: keyof BuilderAction, checked: boolean) => {
    setActions((prev) => ({
      ...prev,
      [action]: checked,
    }));
  };

  // Handle file upload
  const handleFileUpload = (file: File | undefined, type: 'request' | 'response') => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'request') {
        setRequestJSON(content);
      } else {
        setResponseJSON(content);
      }
      toast.success(`${type === 'request' ? 'Request' : 'Response'} JSON loaded`);
    };
    reader.readAsText(file);
  };

  // Handle save
  const handleSave = () => {
    // Validation
    if (!selectedTransactionId) {
      toast.error('Please select a transaction');
      return;
    }

    const selectedActions = Object.entries(actions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    if (selectedActions.length === 0) {
      toast.error('Please select at least one action');
      return;
    }

    try {
      // Validate JSON
      JSON.parse(requestJSON);
      JSON.parse(responseJSON);
    } catch (error) {
      toast.error('Invalid JSON format');
      return;
    }

    // Process save
    toast.success('Transaction updated successfully!', {
      description: `Tenant: ${selectedTenantId}, Actions: ${selectedActions.join(', ')}`,
    });

    console.log('Save Config:', {
      tenantId: selectedTenantId,
      transactionId: selectedTransactionId,
      requestJSON: JSON.parse(requestJSON),
      responseJSON: JSON.parse(responseJSON),
      actions: selectedActions,
    });
  };

  const selectedTransaction = transactions.find(
    (t) => t.TransactionId === selectedTransactionId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Builder</CardTitle>
        <CardDescription>
          Select tenant and transaction to edit and configure workflow actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[240px_280px_1fr] gap-4">
          {/* Column 1: Tenants */}
          <div className="space-y-3">
            {/* Tenant Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search Tenants</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-8 pr-8 h-9 text-sm"
                />
                {tenantSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTenantSearch('')}
                    className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tenant List */}
            <Card className="border-2">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">
                  Tenants
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tenants.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-0.5 px-2 pb-2">
                    {/* ALL Option */}
                    <Button
                      variant={selectedTenantId === 'ALL' ? "default" : "ghost"}
                      className="w-full justify-between text-left h-8 py-1.5 px-2 text-sm"
                      onClick={() => handleTenantSelect('ALL')}
                    >
                      <span className="font-medium">ALL Tenants</span>
                      <Badge variant="outline" className="ml-2 text-xs">*</Badge>
                    </Button>

                    {/* Tenant Buttons */}
                    {filteredTenants.length > 0 ? (
                      filteredTenants.map((tenant) => (
                        <Button
                          key={tenant.TenantId}
                          variant={selectedTenantId === tenant.TenantId ? "default" : "ghost"}
                          className="w-full justify-between text-left h-8 py-1.5 px-2 text-sm"
                          onClick={() => handleTenantSelect(tenant.TenantId)}
                        >
                          <span className="font-medium truncate">{tenant.TenantName}</span>
                          <span className="text-xs text-muted-foreground font-mono ml-2 flex-shrink-0">
                            {tenant.TenantId.replace('tenant-', '')}
                          </span>
                        </Button>
                      ))
                    ) : tenants.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No tenants. Import from Tenants tab.
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No match "{tenantSearch}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Transactions */}
          <div className="space-y-3">
            {/* Transaction Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search Transactions</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-8 pr-8 h-9 text-sm"
                />
                {transactionSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransactionSearch('')}
                    className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Transaction List */}
            <Card className="border-2">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">
                  Transactions
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredTransactions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-0.5 px-2 pb-2">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <Button
                          key={transaction.TransactionId}
                          variant={selectedTransactionId === transaction.TransactionId ? "default" : "ghost"}
                          className="w-full justify-between text-left h-8 py-1.5 px-2 text-sm"
                          onClick={() => handleTransactionSelect(transaction)}
                        >
                          <span className="font-medium truncate">{transaction.TransactionName}</span>
                          <span className="text-xs text-muted-foreground font-mono ml-2 flex-shrink-0">
                            {transaction.TransactionId.replace('txn-', '')}
                          </span>
                        </Button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        {transactionSearch ? `No match "${transactionSearch}"` : 'No transactions'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Editor & Actions */}
          <div>
            {selectedTransaction ? (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>{selectedTransaction.TransactionName}</CardTitle>
                  <CardDescription>
                    Transaction ID: {selectedTransaction.TransactionId}
                    {selectedTenantId !== 'ALL' && (
                      <> • Tenant: {tenants.find(t => t.TenantId === selectedTenantId)?.TenantName || selectedTenantId}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* JSON Editor */}
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="request">Request JSON</TabsTrigger>
                      <TabsTrigger value="response">Response JSON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="request" className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e: any) => handleFileUpload(e.target.files?.[0], 'request');
                            input.click();
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setRequestJSON(text);
                              toast.success('Pasted from clipboard');
                            } catch {
                              toast.error('Failed to read clipboard');
                            }
                          }}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-2" />
                          Paste
                        </Button>
                      </div>
                      <Textarea
                        value={requestJSON}
                        onChange={(e) => setRequestJSON(e.target.value)}
                        placeholder="Request JSON..."
                        className="font-mono text-xs min-h-[300px]"
                      />
                    </TabsContent>

                    <TabsContent value="response" className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e: any) => handleFileUpload(e.target.files?.[0], 'response');
                            input.click();
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setResponseJSON(text);
                              toast.success('Pasted from clipboard');
                            } catch {
                              toast.error('Failed to read clipboard');
                            }
                          }}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-2" />
                          Paste
                        </Button>
                      </div>
                      <Textarea
                        value={responseJSON}
                        onChange={(e) => setResponseJSON(e.target.value)}
                        placeholder="Response JSON..."
                        className="font-mono text-xs min-h-[300px]"
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Label>Actions:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="action-store"
                          checked={actions.store}
                          onCheckedChange={(checked) =>
                            handleActionChange('store', checked as boolean)
                          }
                        />
                        <Label htmlFor="action-store" className="cursor-pointer font-normal text-sm">
                          STORE <span className="text-muted-foreground text-xs">(database)</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="action-publish"
                          checked={actions.publish}
                          onCheckedChange={(checked) =>
                            handleActionChange('publish', checked as boolean)
                          }
                        />
                        <Label htmlFor="action-publish" className="cursor-pointer font-normal text-sm">
                          PUBLISH <span className="text-muted-foreground text-xs">(forward)</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="action-respond"
                          checked={actions.respond}
                          onCheckedChange={(checked) =>
                            handleActionChange('respond', checked as boolean)
                          }
                        />
                        <Label htmlFor="action-respond" className="cursor-pointer font-normal text-sm">
                          RESPOND <span className="text-muted-foreground text-xs">(query)</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="action-agent"
                          checked={actions.agent}
                          onCheckedChange={(checked) =>
                            handleActionChange('agent', checked as boolean)
                          }
                        />
                        <Label htmlFor="action-agent" className="cursor-pointer font-normal text-sm">
                          AGENT <span className="text-muted-foreground text-xs">(MCP)</span>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <Button onClick={handleSave} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="flex items-center justify-center h-[600px]">
                  <p className="text-muted-foreground">Select a transaction to edit</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}