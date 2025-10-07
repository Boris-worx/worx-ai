import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { Transaction } from '../lib/api';
import { toast } from 'sonner';
import { TransactionForm } from './TransactionForm';

interface TransactionsViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isLoading: boolean;
  refreshData: () => void;
}

export function TransactionsView({ transactions, setTransactions, isLoading, refreshData }: TransactionsViewProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Auto-select first transaction when transactions change
  useEffect(() => {
    if (transactions.length > 0 && !selectedTransactionId) {
      setSelectedTransactionId(transactions[0].TransactionId);
    }
  }, [transactions]);

  // Add new transaction
  const handleTransactionCreated = (newTransaction: Transaction) => {
    setTransactions((prev) => [...prev, newTransaction]);
    setSelectedTransactionId(newTransaction.TransactionId);
    setIsCreateOpen(false);
  };

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter((t) =>
      t.TransactionName.toLowerCase().includes(lowerSearch) ||
      t.TransactionId.toLowerCase().includes(lowerSearch)
    );
  }, [transactions, searchTerm]);

  // Get selected transaction
  const selectedTransaction = transactions.find(
    (t) => t.TransactionId === selectedTransactionId
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ERP Transactions</CardTitle>
          <CardDescription>
            View and manage the 16 ERP transaction types stored in Cosmos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Transaction
            </Button>

            <Button variant="outline" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {/* Two Column Layout */}
          {transactions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Left Column - Transaction List */}
              <div className="space-y-3">
                {/* Search Field */}
                <div className="space-y-2">
                  <Label>Search Transactions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Transaction List */}
                <Card className="border-2">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm">
                      Transactions
                      {searchTerm && filteredTransactions.length !== transactions.length ? (
                        <Badge variant="secondary" className="ml-2">
                          {filteredTransactions.length} of {transactions.length}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2">
                          {transactions.length}
                        </Badge>
                      )}
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
                              onClick={() => setSelectedTransactionId(transaction.TransactionId)}
                            >
                              <span className="font-medium truncate">{transaction.TransactionName}</span>
                              <span className="text-xs text-muted-foreground font-mono ml-2 flex-shrink-0">
                                {transaction.TransactionId.replace('txn-', '')}
                              </span>
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No transactions match "{searchTerm}"
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Transaction Details */}
              <div>
                {selectedTransaction ? (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>{selectedTransaction.TransactionName}</CardTitle>
                      <CardDescription>
                        Transaction ID: {selectedTransaction.TransactionId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="request" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="request">Request JSON</TabsTrigger>
                          <TabsTrigger value="response">Response JSON</TabsTrigger>
                        </TabsList>

                        <TabsContent value="request" className="mt-4">
                          <Card className="p-4">
                            <ScrollArea className="h-[500px] w-full">
                              <pre className="text-sm whitespace-pre-wrap break-words">
                                <code>
                                  {JSON.stringify(selectedTransaction.RequestJSON, null, 2) || 'No request data'}
                                </code>
                              </pre>
                            </ScrollArea>
                          </Card>
                        </TabsContent>

                        <TabsContent value="response" className="mt-4">
                          <Card className="p-4">
                            <ScrollArea className="h-[500px] w-full">
                              <pre className="text-sm whitespace-pre-wrap break-words">
                                <code>
                                  {JSON.stringify(selectedTransaction.ResponseJSON, null, 2) || 'No response data'}
                                </code>
                              </pre>
                            </ScrollArea>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      {/* Metadata */}
                      {(selectedTransaction.CreateTime || selectedTransaction._etag) && (
                        <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t mt-4">
                          {selectedTransaction.CreateTime && (
                            <div>Created: {new Date(selectedTransaction.CreateTime).toLocaleString()}</div>
                          )}
                          {selectedTransaction._etag && (
                            <div className="font-mono break-all">ETag: {selectedTransaction._etag}</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed">
                    <CardContent className="flex items-center justify-center h-[600px]">
                      <p className="text-muted-foreground">Select a transaction to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isLoading ? 'Loading transactions...' : 'No transactions found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transaction Dialog */}
      <TransactionForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleTransactionCreated}
      />
    </div>
  );
}
