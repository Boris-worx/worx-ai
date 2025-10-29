import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { RefreshIcon } from './icons/RefreshIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Plus, RefreshCw, Receipt, Eye, Search, AlertCircle, Trash2, Pencil, MoreVertical, Filter } from 'lucide-react';
import { Transaction, TRANSACTION_TYPES, getTransactionsByType, createTransaction, updateTransaction, deleteTransaction } from '../lib/api';
import { DataTable } from './DataTable';
import { TransactionDetail } from './TransactionDetail';
import { TransactionCreateDialog } from './TransactionCreateDialog';
import { TransactionEditDialog } from './TransactionEditDialog';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { UserRole } from './AuthContext';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface TransactionsViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isLoading: boolean;
  refreshData: () => void;
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function TransactionsView({ transactions, setTransactions, isLoading, refreshData, userRole, tenants, activeTenantId, onTenantChange }: TransactionsViewProps) {
  const [selectedTxnType, setSelectedTxnType] = useState<string>('Customer'); // Default to Customer
  const [isLoadingType, setIsLoadingType] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    if (field.startsWith('Txn.')) {
      field = field.substring(4);
    }
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns - commonly used fields
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'TxnId', label: 'ID', enabled: true, locked: true },
    { key: 'Txn.Name', label: 'Name', enabled: true },
    { key: 'TxnType', label: 'Type', enabled: false },
    { key: 'Txn.Status', label: 'Status', enabled: true },
    { key: 'Txn.CustomerId', label: 'Customer ID', enabled: false },
    { key: 'Txn.CustomerType', label: 'Customer Type', enabled: false },
    { key: 'Txn.Email', label: 'Email', enabled: false },
    { key: 'Txn.Phone1', label: 'Phone', enabled: false },
    { key: 'Txn.Address', label: 'Address', enabled: false },
    { key: 'Txn.Amount', label: 'Amount', enabled: false },
    { key: 'Txn.Currency', label: 'Currency', enabled: false },
    { key: 'CreateTime', label: 'Created', enabled: true },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '4'; // Increment when changing default columns
    const saved = localStorage.getItem('transactionsViewColumns');
    const savedVersion = localStorage.getItem('transactionsViewColumnsVersion');
    
    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    // Clear old data and use defaults
    localStorage.removeItem('transactionsViewColumns');
    localStorage.setItem('transactionsViewColumnsVersion', STORAGE_VERSION);
    return getDefaultColumns();
  });

  // Reset columns to default
  const handleResetColumns = () => {
    const STORAGE_VERSION = '4';
    setColumnConfigs(getDefaultColumns());
    localStorage.removeItem('transactionsViewColumns');
    localStorage.setItem('transactionsViewColumnsVersion', STORAGE_VERSION);
    toast.success('Column settings reset to default');
  };

  // Save column configs to localStorage whenever they change
  useEffect(() => {
    const STORAGE_VERSION = '4';
    localStorage.setItem('transactionsViewColumns', JSON.stringify(columnConfigs));
    localStorage.setItem('transactionsViewColumnsVersion', STORAGE_VERSION);
  }, [columnConfigs]);

  // Extract available fields from transactions to offer as columns
  const availableFields = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const fieldsSet = new Set<string>();
    transactions.forEach(txn => {
      // Add top-level fields
      Object.keys(txn).forEach(key => {
        if (!key.startsWith('_') && key !== 'Txn') {
          fieldsSet.add(key);
        }
      });
      // Add Txn object fields
      if (txn.Txn && typeof txn.Txn === 'object') {
        Object.keys(txn.Txn).forEach(key => {
          fieldsSet.add(`Txn.${key}`);
        });
      }
    });
    
    return Array.from(fieldsSet).sort();
  }, [transactions]);

  // Update column configs when new fields are detected
  useEffect(() => {
    if (availableFields.length > 0) {
      setColumnConfigs(prev => {
        const existingKeys = new Set(prev.map(c => c.key));
        const newColumns: ColumnConfig[] = [];
        
        availableFields.forEach(field => {
          if (!existingKeys.has(field)) {
            // Add new field as disabled by default
            newColumns.push({
              key: field,
              label: formatFieldLabel(field),
              enabled: false,
            });
          }
        });
        
        if (newColumns.length > 0) {
          console.log(`Found ${newColumns.length} new field(s):`, newColumns.map(c => c.key));
          return [...prev, ...newColumns];
        }
        return prev;
      });
    }
  }, [availableFields]);

  // Load transaction counts for all types on mount
  useEffect(() => {
    loadAllTypeCounts();
  }, []);

  // Load counts for all transaction types
  const loadAllTypeCounts = async () => {
    setIsLoadingCounts(true);
    const counts: Record<string, number> = {};
    
    try {
      console.log('Loading transaction counts for all types...');
      
      // Load counts for all types in parallel
      const results = await Promise.allSettled(
        TRANSACTION_TYPES.map(async (type) => {
          try {
            const txns = await getTransactionsByType(type);
            return { type, count: txns.length, supported: true };
          } catch (error: any) {
            // Silently handle expected errors (CORS, unsupported types)
            if (error.message === 'Unsupported TxnType' || error.message === 'Unsupported txn_type' || error.message === 'CORS_ERROR' || error.message === 'CORS_BLOCKED') {
              return { type, count: 0, supported: false };
            }
            // Only log unexpected errors
            return { type, count: 0, supported: false };
          }
        })
      );

      // Process results
      let supportedCount = 0;
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          counts[result.value.type] = result.value.count;
          if (result.value.count > 0) supportedCount++;
        }
      });

      console.log(`Loaded ${supportedCount} supported type(s) with data`);
      console.log('Type counts:', counts);
      setTypeCounts(counts);

      // Find first type with data and load it
      const firstActiveType = TRANSACTION_TYPES.find(type => counts[type] > 0);
      if (firstActiveType) {
        setSelectedTxnType(firstActiveType);
        loadTransactionsForType(firstActiveType);
      } else {
        // If no types have data, default to Customer
        setSelectedTxnType('Customer');
        loadTransactionsForType('Customer');
      }
      
    } catch (error) {
      console.error('Error loading type counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Load transactions for selected type
  const loadTransactionsForType = async (txnType: string) => {
    if (!txnType) return;
    
    setIsLoadingType(true);
    try {
      console.log(`========== Loading transactions for type: ${txnType} ==========`);
      const txns = await getTransactionsByType(txnType);
      console.log(`========== Received ${txns.length} transactions ==========`);
      
      // Sort by CreateTime descending (newest first)
      const sortedTxns = [...txns].sort((a, b) => {
        const dateA = a.CreateTime ? new Date(a.CreateTime).getTime() : 0;
        const dateB = b.CreateTime ? new Date(b.CreateTime).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      setTransactions(sortedTxns);
      
      if (sortedTxns.length === 0) {
        toast.info(`No ${txnType} transactions found. Check browser Console (F12) for API response details.`, {
          duration: 6000,
        });
      } else {
        toast.success(`Loaded ${sortedTxns.length} ${txnType} transaction(s)`);
        console.log('Transactions set to state. First transaction:', sortedTxns[0]);
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      if (error.message !== 'CORS_BLOCKED') {
        toast.error(`Failed to load transactions: ${error.message}. Check Console (F12) for details.`, {
          duration: 6000,
        });
      }
      setTransactions([]);
    } finally {
      setIsLoadingType(false);
    }
  };

  // Handle type selection
  const handleTypeChange = (value: string) => {
    setSelectedTxnType(value);
    loadTransactionsForType(value);
    setSearchTerm(''); // Reset search when changing type
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedTxnType) {
      loadTransactionsForType(selectedTxnType);
    }
  };

  // View transaction detail
  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailDialogOpen(true);
  };

  // Edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // Delete transaction
  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedTransaction || !selectedTransaction._etag || !selectedTransaction.TxnId) {
      toast.error('Cannot delete: missing transaction data');
      return;
    }

    try {
      // TxnId is already in format "TxnType:EntityId" from the API response
      console.log('Deleting transaction:', {
        TxnId: selectedTransaction.TxnId,
        TxnType: selectedTransaction.TxnType,
        etag: selectedTransaction._etag
      });
      
      await deleteTransaction(selectedTransaction.TxnId, selectedTransaction._etag);
      toast.success(`Deleted ${selectedTransaction.TxnType} transaction`);
      setIsDeleteDialogOpen(false);
      
      // Refresh current type and update counts
      await loadTransactionsForType(selectedTxnType);
      await loadAllTypeCounts();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  // Handle create transaction
  const handleCreateTransaction = async (txnType: string, txnData: any) => {
    try {
      const newTxn = await createTransaction(txnType, txnData);
      toast.success(`Created ${txnType} transaction successfully!`);
      setIsCreateDialogOpen(false);
      
      // Refresh if we're viewing this type
      if (selectedTxnType === txnType) {
        await loadTransactionsForType(txnType);
      }
      
      // Update type counts
      await loadAllTypeCounts();
      
      return newTxn;
    } catch (error: any) {
      toast.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  };

  // Handle update transaction
  const handleUpdateTransaction = async (txnId: string, txnType: string, txnData: any, etag: string) => {
    try {
      await updateTransaction(txnId, txnType, txnData, etag);
      toast.success(`Updated ${txnType} transaction successfully!`);
      setIsEditDialogOpen(false);
      
      // Refresh current type
      loadTransactionsForType(selectedTxnType);
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
      throw error;
    }
  };

  // Filter types by search term
  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return TRANSACTION_TYPES;
    const lower = searchTerm.toLowerCase();
    return TRANSACTION_TYPES.filter(type => type.toLowerCase().includes(lower));
  }, [searchTerm]);

  // Helper function to get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    if (path.includes('.')) {
      const parts = path.split('.');
      let value = obj;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return undefined;
      }
      return value;
    }
    return obj[path];
  };

  // Helper to check if a value is empty
  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && (value.trim() === '' || value === '—' || value === '-' || value === 'N/A')) return true;
    return false;
  };

  // Helper to check if a column has any non-empty values
  const hasNonEmptyValues = (columnKey: string): boolean => {
    if (transactions.length === 0) return false;
    
    return transactions.some(txn => {
      const value = getNestedValue(txn, columnKey);
      return !isEmptyValue(value);
    });
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (transactions.length === 0) {
      // If no data, don't mark anything as empty
      return columnConfigs.map(col => ({ ...col, isEmpty: false }));
    }
    
    const enriched = columnConfigs.map(col => {
      // Check if column has any non-empty values
      const hasData = col.locked || transactions.some(txn => {
        const value = getNestedValue(txn, col.key);
        const isEmpty = isEmptyValue(value);
        return !isEmpty;
      });
      
      return {
        ...col,
        isEmpty: !hasData
      };
    });
    
    // Debug: Log columns marked as empty
    const emptyColumns = enriched.filter(c => c.isEmpty);
    if (emptyColumns.length > 0) {
      console.log('Columns with no data:', emptyColumns.map(c => c.key));
    }
    
    return enriched;
  }, [columnConfigs, transactions]);

  // DataTable columns configuration - dynamically generated based on enabled columns
  const columns = useMemo(() => {
    // Use enrichedColumnConfigs which already has isEmpty flags
    const enabledColumns = enrichedColumnConfigs.filter(col => col.enabled);
    
    // Filter out columns that have no data (all values are empty)
    const columnsWithData = enabledColumns.filter(col => 
      col.locked || !col.isEmpty
    );
    
    return columnsWithData.map(colConfig => {
      // Special rendering for known columns
      if (colConfig.key === 'TxnId') {
        return {
          key: 'TxnId',
          header: 'ID',
          render: (row: Transaction) => {
            const displayId = row.TxnId || 'N/A';
            return (
              <div className="max-w-[120px] md:max-w-[180px]">
                <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={displayId}>
                  {displayId}
                </code>
              </div>
            );
          },
        };
      }
      
      if (colConfig.key === 'Name') {
        return {
          key: 'Name',
          header: 'Name',
          render: (row: Transaction) => {
            const name = row.Txn?.Name || row.Txn?.CustomerName || row.Txn?.InvoiceId || '-';
            return (
              <div className="max-w-[150px] md:max-w-[250px]">
                <span className="text-xs md:text-sm truncate block" title={name}>{name}</span>
              </div>
            );
          },
        };
      }
      
      if (colConfig.key === 'CreateTime') {
        return {
          key: 'CreateTime',
          header: 'Created',
          render: (row: Transaction) => {
            if (!row.CreateTime) return <span className="text-xs md:text-sm text-muted-foreground">-</span>;
            return <span className="whitespace-nowrap text-xs md:text-sm">{new Date(row.CreateTime).toLocaleDateString()}</span>;
          },
        };
      }

      // Special rendering for Status
      if (colConfig.key === 'Txn.Status' || colConfig.key === 'Status') {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (row: Transaction) => {
            const value = getNestedValue(row, colConfig.key);
            if (!value || value === '-') {
              return <span className="text-xs md:text-sm text-muted-foreground">-</span>;
            }
            return (
              <Badge variant="default" className="whitespace-nowrap text-xs bg-[#1D6BCD] hover:bg-[#1858A8]">
                {String(value)}
              </Badge>
            );
          },
        };
      }

      // Special rendering for Amount/Currency
      if (colConfig.key.toLowerCase().includes('amount') || colConfig.key.toLowerCase().includes('price')) {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (row: Transaction) => {
            const value = getNestedValue(row, colConfig.key);
            if (value === null || value === undefined) {
              return <span className="text-xs md:text-sm text-muted-foreground">-</span>;
            }
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (!isNaN(numValue)) {
              return <span className="text-xs md:text-sm tabular-nums">{numValue.toLocaleString()}</span>;
            }
            return <span className="text-xs md:text-sm">{String(value)}</span>;
          },
        };
      }

      // Generic rendering for other columns
      return {
        key: colConfig.key,
        header: colConfig.label,
        render: (row: Transaction) => {
          const value = getNestedValue(row, colConfig.key);
          
          if (value === null || value === undefined) {
            return <span className="text-xs md:text-sm text-muted-foreground">-</span>;
          }
          
          // Handle dates
          if (colConfig.key.toLowerCase().includes('time') || colConfig.key.toLowerCase().includes('date')) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return <span className="whitespace-nowrap text-xs md:text-sm">{date.toLocaleDateString()}</span>;
              }
            } catch (e) {
              // Not a date, continue
            }
          }
          
          // Handle booleans
          if (typeof value === 'boolean') {
            return (
              <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                {value ? 'Yes' : 'No'}
              </Badge>
            );
          }
          
          // Handle objects and arrays
          if (typeof value === 'object') {
            return (
              <div className="max-w-[150px]">
                <code className="text-[10px] md:text-[11px] bg-muted px-1 py-0.5 rounded truncate block" title={JSON.stringify(value)}>
                  {JSON.stringify(value)}
                </code>
              </div>
            );
          }
          
          // Handle primitives
          return (
            <div className="max-w-[150px] md:max-w-[200px]">
              <span className="text-xs md:text-sm truncate block" title={String(value)}>
                {String(value)}
              </span>
            </div>
          );
        },
      };
    });
  }, [enrichedColumnConfigs, transactions]);

  // Actions render function (displayed as last column on the right)
  const renderActions = (row: Transaction) => (
    <div className="flex gap-0.5 md:gap-1 whitespace-nowrap justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewDetail(row)}
        className="h-7 md:h-8 px-1.5 md:px-2"
        title="View transaction details"
      >
        <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
        <span className="hidden md:inline">View</span>
      </Button>
      {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditTransaction(row)}
          className="h-7 md:h-8 px-1.5 md:px-2"
          title="Edit transaction"
        >
          <Pencil className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
          <span className="hidden md:inline">Edit</span>
        </Button>
      )}
      {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteTransaction(row)}
          className="h-7 md:h-8 px-1.5 md:px-2 text-muted-foreground hover:text-destructive"
          title="Delete transaction"
        >
          <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
          <span className="hidden md:inline">Delete</span>
        </Button>
      )}
    </div>
  );

  // Compact actions (icons only) for when table has horizontal scroll
  const renderActionsCompact = (row: Transaction) => (
    <div className="flex gap-1 whitespace-nowrap justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewDetail(row)}
        className="h-8 w-8 p-0"
        title="View transaction details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditTransaction(row)}
          className="h-8 w-8 p-0"
          title="Edit transaction"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteTransaction(row)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Delete transaction"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-bold text-[20px]\ text-[20px]">Data Plane</CardTitle>
          <CardDescription>
            View and manage ERP transactions across all suppliers
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-hidden">{/* Top Bar - Headers */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[200px_1fr] gap-6 mb-3">
            {/* Left: Transaction Types Header - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <h3 className="text-base md:text-lg">Transaction Types</h3>
              <Badge variant="secondary">
                {filteredTypes.filter(type => typeCounts[type] > 0).length}
              </Badge>
            </div>

            {/* Right: Current Type and Actions */}
            <div className="flex flex-col gap-3">
              {/* Mobile type selector - First row on mobile */}
              <div className="md:hidden">
                <Select value={selectedTxnType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTypes
                      .filter((type) => (typeCounts[type] || 0) > 0)
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {type} ({typeCounts[type] || 0})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Desktop type display */}
                <div className="hidden md:flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base md:text-lg">{selectedTxnType}</h3>
                  <Badge variant="secondary">
                    {transactions.length}
                  </Badge>
                </div>
                
                {/* Desktop View - All buttons visible */}
                <div className="hidden md:flex gap-2">
                  <TenantSelector
                    tenants={tenants}
                    activeTenantId={activeTenantId}
                    onTenantChange={onTenantChange}
                    isSuperUser={userRole === 'superuser'}
                  />
                  <ColumnSelector
                    columns={enrichedColumnConfigs}
                    onColumnsChange={setColumnConfigs}
                    availableFields={availableFields}
                    onReset={handleResetColumns}
                  />
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoadingType}
                  >
                    <RefreshIcon className={`h-4 w-4 mr-2 ${isLoadingType ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Transaction
                    </Button>
                  )}
                </div>

                {/* Mobile View - Dropdown Menu - Second row on mobile */}
                <div className="flex md:hidden items-center gap-2 justify-end ml-auto">
                  {/* Tenant Selector */}
                  <TenantSelector
                    tenants={tenants}
                    activeTenantId={activeTenantId}
                    onTenantChange={onTenantChange}
                    isSuperUser={userRole === 'superuser'}
                  />
                  
                  {/* Dropdown Menu with other actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleRefresh} disabled={isLoadingType}>
                        <RefreshIcon className={`h-4 w-4 mr-2 ${isLoadingType ? 'animate-spin' : ''}`} />
                        Refresh
                      </DropdownMenuItem>
                      {(userRole === 'superuser' || userRole === 'admin' || userRole === 'developer') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Transaction
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="flex-1">Columns</span>
                        <ColumnSelector
                          columns={enrichedColumnConfigs}
                          onColumnsChange={setColumnConfigs}
                          availableFields={availableFields}
                          onReset={handleResetColumns}
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout: Sidebar + Content */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            {/* Left Sidebar - Transaction Types List */}
            <div className="space-y-3 md:block hidden">
              {/* Search Types */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Types List */}
              <Card className="border-2">
                <ScrollArea className="h-[600px]">
                  {isLoadingCounts ? (
                    <div className="p-8 text-center">
                      <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground mt-2">Loading types...</p>
                    </div>
                  ) : (
                      <div className="space-y-1 p-2">
                        {filteredTypes
                          .filter((type) => {
                            const count = typeCounts[type] || 0;
                            return count > 0; // Показываем только типы с данными
                          })
                          .map((type) => {
                            const count = typeCounts[type] || 0;
                            
                            return (
                              <Button
                                key={type}
                                variant={selectedTxnType === type ? 'default' : 'ghost'}
                                className="w-full justify-start text-left h-auto py-1.5 px-3"
                                onClick={() => handleTypeChange(type)}
                                title={`${count} transaction(s)`}
                              >
                                <span className="text-sm truncate">{type}</span>
                              </Button>
                            );
                          })}
                      </div>
                    )}
                </ScrollArea>
              </Card>
            </div>

            {/* Right Content - Table */}
            <div className="min-w-0 overflow-hidden">
              {/* Empty State */}
              {transactions.length === 0 && !isLoadingType && (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg mb-2">No {selectedTxnType} transactions</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      No transactions found in the database for this type. Create your first transaction to get started.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create {selectedTxnType} Transaction
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Data Table */}
              {transactions.length > 0 && (
                <DataTable
                  data={transactions}
                  columns={columns}
                  actions={renderActions}
                  actionsCompact={renderActionsCompact}
                  searchPlaceholder="Search transactions..."
                  emptyMessage={`No ${selectedTxnType} transactions found`}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
        />
      )}

      {/* Create Dialog */}
      <TransactionCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateTransaction}
        defaultTxnType={selectedTxnType}
      />

      {/* Edit Dialog */}
      {selectedTransaction && (
        <TransactionEditDialog
          transaction={selectedTransaction}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleUpdateTransaction}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {selectedTransaction?.TxnType} transaction?
              <br />
              <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                {selectedTransaction?.TxnId}
              </code>
              <br />
              <strong className="text-destructive mt-2 inline-block">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}