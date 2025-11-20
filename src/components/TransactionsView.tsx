import {
  Transaction,
  TRANSACTION_TYPES,
  getTransactionsByType,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  PaginatedTransactionsResponse,
  formatTransactionType,
  getDataCaptureSpecs,
  DataCaptureSpec,
} from "../lib/api";
import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { SearchIcon } from "./icons/SearchIcon";
import { ViewIcon } from "./icons/ViewIcon";
import { EditIcon } from "./icons/EditIcon";
import { DeleteIcon } from "./icons/DeleteIcon";
import { Skeleton } from "./ui/skeleton";
import {
  Plus,
  Receipt,
  Eye,
  Search,
  AlertCircle,
  Trash2,
  Pencil,
  MoreVertical,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { DataTable } from "./DataTable";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionCreateDialog } from "./TransactionCreateDialog";
import { TransactionEditDialog } from "./TransactionEditDialog";
import { ColumnSelector, ColumnConfig } from "./ColumnSelector";
import { toast } from "sonner@2.0.3";
import { UserRole } from "./AuthContext";
import { TenantSelector } from "./TenantSelector";
import { Tenant } from "../lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TransactionsViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<
    React.SetStateAction<Transaction[]>
  >;
  isLoading: boolean;
  refreshData: () => void;
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function TransactionsView({
  transactions,
  setTransactions,
  isLoading,
  refreshData,
  userRole,
  tenants,
  activeTenantId,
  onTenantChange,
}: TransactionsViewProps) {
  const [selectedTxnType, setSelectedTxnType] =
    useState<string>("Customer"); // Default to keyi
  const [isLoadingType, setIsLoadingType] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] =
    useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeCounts, setTypeCounts] = useState<
    Record<string, number>
  >({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [continuationToken, setContinuationToken] = useState<
    string | null
  >(null);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // State for Data Capture Spec filtering
  const [dataSourceId, setDataSourceId] = useState<string>(""); // For filtering Data Capture Specs
  
  // State for dynamic Transaction Types from Data Capture Specs
  const [dataCaptureSpecs, setDataCaptureSpecs] = useState<DataCaptureSpec[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(true);
  
  // State for sorting transaction types
  type SortMode = 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';
  const [sortMode, setSortMode] = useState<SortMode>('name-asc');

  // Build dynamic transaction types list from Data Capture Specs
  const transactionTypes = useMemo(() => {
    // All supported transaction types from BFS API
    const fallbackTypes = [
      'Customer',
      'Customer Aging',
      'Location',
      'Quote',
      'QuoteDetail',
      'QuotePack',
      'QuotePackOrder',
      'ReasonCode',
      'LineType',
      'LineTypes',
      'ServiceRequest',
      'WorkflowCustomer',
      'Job',
      'Items',
      'Invoice',
      'Invoice PDF',
      'Sales Order',
      'Item Pricing',
      'Item Pricing PDF',
      'Invoice Reprice',
      'Target Margin',
      'Statements',
      'Statements PDF',
      'Sales Order Create/DI Order',
      'Product Hierarchy/Item Class',
      'PO Create',
      'Sales Order Query',
      'DI order enhancements',
      'Quotes',
      'Publish Sales Order Quote',
      'Publish Bid Quote-Quote',
    ];
    
    // Get unique container names from Data Capture Specs
    const specTypes = dataCaptureSpecs
      .filter(spec => spec.isActive !== false) // Only active specs
      .map(spec => spec.containerName)
      .filter((name, index, self) => self.indexOf(name) === index); // Unique
    
    // Combine both lists and remove duplicates
    const combinedTypes = [...fallbackTypes, ...specTypes]
      .filter((name, index, self) => self.indexOf(name) === index) // Unique
      .sort();
    
    console.log('📋 Transaction Types (API + Data Capture Specs):', combinedTypes);
    console.log('  - API types:', fallbackTypes);
    console.log('  - From Data Capture Specs:', specTypes);
    
    return combinedTypes;
  }, [dataCaptureSpecs]);

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    if (field.startsWith("Txn.")) {
      field = field.substring(4);
    }
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, " $1").trim();
  };

  // Default columns - commonly used fields (type-specific)
  const getDefaultColumns = (
    txnType?: string,
  ): ColumnConfig[] => {
    // Core Fields - ALWAYS enabled and locked (cannot be disabled)
    const coreFields: ColumnConfig[] = [
      {
        key: "TxnId",
        label: "Txn ID",
        enabled: true,
        locked: true,
      },
      {
        key: "TxnType",
        label: "Type",
        enabled: true,
        locked: true,
      },
      {
        key: "CreateTime",
        label: "Created",
        enabled: true,
        locked: true,
      },
    ];

    // Quote-specific additional columns
    if (txnType === "Quote") {
      return [
        ...coreFields,
        {
          key: "Txn.location.Address",
          label: "location Address",
          enabled: true,
        },
        {
          key: "Txn.location.Code",
          label: "location Code",
          enabled: true,
        },
        {
          key: "Txn.location.Name",
          label: "location Name",
          enabled: true,
        },
        {
          key: "Txn.quoteId",
          label: "Quote ID",
          enabled: false,
        },
        {
          key: "Txn.accountNumber",
          label: "Account Number",
          enabled: false,
        },
        {
          key: "Txn.customerRequestedByDate",
          label: "Requested By Date",
          enabled: false,
        },
        {
          key: "Txn.exportNotes",
          label: "Export Notes",
          enabled: false,
        },
        {
          key: "Txn.erpUserId",
          label: "ERP User ID",
          enabled: false,
        },
        { key: "UpdateTime", label: "Updated", enabled: false },
      ];
    }

    // Data Capture Specification types (keyi, podt, invloc, invap, irc)
    if (
      ["keyi", "podt", "invloc", "invap", "irc"].includes(
        txnType || "",
      )
    ) {
      return [
        ...coreFields,
        { key: "TenantId", label: "Tenant ID", enabled: true },
        { key: "Txn.id", label: "Spec ID", enabled: false },
        { key: "UpdateTime", label: "Updated", enabled: false },
      ];
    }

    // LineType-specific additional columns
    if (txnType === "LineType" || txnType === "LineTypes") {
      return [
        ...coreFields,
        {
          key: "Txn.lineTypeId",
          label: "Line Type ID",
          enabled: true,
        },
        {
          key: "Txn.lineTypeCode",
          label: "Code",
          enabled: true,
        },
        {
          key: "Txn.description",
          label: "Description",
          enabled: true,
        },
        {
          key: "Txn.erpOrderLineType",
          label: "ERP Order Type",
          enabled: true,
        },
        {
          key: "Txn.isActive",
          label: "Active",
          enabled: true,
        },
        { key: "Txn.colorCode", label: "Color Code", enabled: false },
        { key: "Txn.sortOrder", label: "Sort Order", enabled: false },
        { key: "Txn.skuType", label: "SKU Type", enabled: false },
        { key: "Txn.categoryRequired", label: "Category Required", enabled: false },
        { key: "Txn.manualCostRequired", label: "Manual Cost Required", enabled: false },
        { key: "Txn.manualPriceRequired", label: "Manual Price Required", enabled: false },
        { key: "Txn.isNotesAllowed", label: "Notes Allowed", enabled: false },
        { key: "Txn.defaultSku", label: "Default SKU", enabled: false },
        { key: "Txn.defaultDescription", label: "Default Description", enabled: false },
        { key: "Txn.defaultCategory", label: "Default Category", enabled: false },
        { key: "Txn.defaultQuantity", label: "Default Quantity", enabled: false },
        { key: "Txn.eRP", label: "ERP", enabled: false },
        { key: "Txn.isSkuTypeDefault", label: "SKU Type Default", enabled: false },
        { key: "Txn.enforceQuantityOfOne", label: "Enforce Qty of 1", enabled: false },
        { key: "Txn.isInstallOnly", label: "Install Only", enabled: false },
        { key: "UpdateTime", label: "Updated", enabled: false },
      ];
    }

    // ReasonCode-specific additional columns
    if (txnType === "ReasonCode") {
      return [
        ...coreFields,
        {
          key: "Txn.reasonCodeId",
          label: "Reason Code ID",
          enabled: true,
        },
        {
          key: "Txn.reasonCodeText",
          label: "Reason Text",
          enabled: true,
        },
        {
          key: "Txn.eRPCode",
          label: "ERP Code",
          enabled: true,
        },
        {
          key: "Txn.isActive",
          label: "Active",
          enabled: true,
        },
        { key: "UpdateTime", label: "Updated", enabled: false },
      ];
    }

    // Customer-specific additional columns
    if (txnType === "Customer") {
      return [
        ...coreFields,
        {
          key: "Txn.CustomerId",
          label: "Customer ID",
          enabled: false,
        },
        { key: "Txn.Name", label: "Name", enabled: true },
        { key: "Txn.Status", label: "Status", enabled: true },
        { key: "Txn.Phone1", label: "Phone", enabled: false },
        {
          key: "Txn.Address",
          label: "Address",
          enabled: false,
        },
        { key: "UpdateTime", label: "Updated", enabled: false },
      ];
    }

    // Default additional columns for other transaction types
    return [
      ...coreFields,
      { key: "Txn.Name", label: "Name", enabled: true },
      { key: "Txn.Status", label: "Status", enabled: true },
      {
        key: "Txn.CustomerId",
        label: "Customer ID",
        enabled: false,
      },
      {
        key: "Txn.CustomerType",
        label: "Customer Type",
        enabled: false,
      },
      { key: "Txn.Email", label: "Email", enabled: false },
      { key: "Txn.Phone1", label: "Phone", enabled: false },
      { key: "Txn.Address", label: "Address", enabled: false },
      { key: "Txn.Amount", label: "Amount", enabled: false },
      {
        key: "Txn.Currency",
        label: "Currency",
        enabled: false,
      },
      { key: "UpdateTime", label: "Updated", enabled: false },
    ];
  };

  // Column configuration state with localStorage persistence (per transaction type)
  const [columnConfigs, setColumnConfigs] = useState<
    ColumnConfig[]
  >(() => {
    const STORAGE_VERSION = "10"; // v10: Core Fields (TxnId, Type, Created) are always locked and enabled
    const storageKey = `transactionsViewColumns_${selectedTxnType}`;
    const saved = localStorage.getItem(storageKey);
    const savedVersion = localStorage.getItem(
      `${storageKey}_version`,
    );

    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved columns:", e);
      }
    }

    // Clear old data and use defaults for this type
    localStorage.removeItem(storageKey);
    localStorage.setItem(
      `${storageKey}_version`,
      STORAGE_VERSION,
    );
    return getDefaultColumns(selectedTxnType);
  });

  // Reset columns to default
  const handleResetColumns = () => {
    const STORAGE_VERSION = "10";
    const storageKey = `transactionsViewColumns_${selectedTxnType}`;
    setColumnConfigs(getDefaultColumns(selectedTxnType));
    localStorage.removeItem(storageKey);
    localStorage.setItem(
      `${storageKey}_version`,
      STORAGE_VERSION,
    );
    toast.success("Column settings reset to default");
  };

  // Save column configs to localStorage whenever they change (per transaction type)
  useEffect(() => {
    const STORAGE_VERSION = "10";
    const storageKey = `transactionsViewColumns_${selectedTxnType}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify(columnConfigs),
    );
    localStorage.setItem(
      `${storageKey}_version`,
      STORAGE_VERSION,
    );
  }, [columnConfigs, selectedTxnType]);

  // Extract available fields from transactions to offer as columns (including nested)
  const availableFields = useMemo(() => {
    if (transactions.length === 0) return [];

    const fieldsSet = new Set<string>();

    // Helper to recursively extract fields
    const extractFields = (obj: any, prefix: string = "") => {
      if (!obj || typeof obj !== "object") return;

      Object.keys(obj).forEach((key) => {
        if (key.startsWith("_")) return; // Skip metadata fields

        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          // For nested objects, add the nested field path
          fieldsSet.add(fullKey);
          // Also extract nested fields (e.g., Txn.location.Address)
          extractFields(value, fullKey);
        } else {
          fieldsSet.add(fullKey);
        }
      });
    };

    transactions.forEach((txn) => {
      // Add top-level fields
      Object.keys(txn).forEach((key) => {
        if (!key.startsWith("_") && key !== "Txn") {
          fieldsSet.add(key);
        }
      });

      // Add Txn object fields (including nested)
      if (txn.Txn && typeof txn.Txn === "object") {
        extractFields(txn.Txn, "Txn");
      }
    });

    return Array.from(fieldsSet).sort();
  }, [transactions]);

  // Update column configs when new fields are detected
  useEffect(() => {
    if (availableFields.length > 0) {
      setColumnConfigs((prev) => {
        const existingKeys = new Set(prev.map((c) => c.key));
        const newColumns: ColumnConfig[] = [];

        availableFields.forEach((field) => {
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
          console.log(
            `Found ${newColumns.length} new field(s):`,
            newColumns.map((c) => c.key),
          );
          return [...prev, ...newColumns];
        }
        return prev;
      });
    }
  }, [availableFields]);

  // Load Data Capture Specs on mount and when tenant changes
  useEffect(() => {
    loadDataCaptureSpecs();
  }, [activeTenantId]);

  // Load Data Capture Specs
  const loadDataCaptureSpecs = async () => {
    setIsLoadingSpecs(true);
    try {
      console.log('📡 Loading Data Capture Specs for tenant:', activeTenantId);
      const specs = await getDataCaptureSpecs(activeTenantId);
      console.log('✅ Loaded', specs.length, 'Data Capture Specs:', specs);
      setDataCaptureSpecs(specs);
    } catch (error) {
      console.error('❌ Failed to load Data Capture Specs:', error);
      setDataCaptureSpecs([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Load transaction counts for all types on mount
  useEffect(() => {
    // Wait for specs to load first
    if (!isLoadingSpecs && transactionTypes.length > 0) {
      loadAllTypeCounts();
    }
  }, [isLoadingSpecs, transactionTypes]);

  // Load counts for all transaction types
  const loadAllTypeCounts = async () => {
    setIsLoadingCounts(true);
    const counts: Record<string, number> = {};

    try {
      console.log(
        "Loading transaction counts for dynamic types from Data Capture Specs...",
      );
      console.log("Transaction Types:", transactionTypes);

      // Load counts for all types in parallel
      const results = await Promise.allSettled(
        transactionTypes.map(async (type) => {
          try {
            const response = await getTransactionsByType(
              type,
              undefined,
              activeTenantId,
            );
            // Use TxnTotalCount from API if available, otherwise fallback to transactions.length
            const count = response.totalCount !== undefined 
              ? response.totalCount 
              : response.transactions.length;
            return {
              type,
              count,
              supported: true,
            };
          } catch (error: any) {
            // Silently handle expected errors (CORS, unsupported types)
            if (
              error.message === "Unsupported TxnType" ||
              error.message === "Unsupported txn_type" ||
              error.message === "CORS_ERROR" ||
              error.message === "CORS_BLOCKED"
            ) {
              return { type, count: 0, supported: false };
            }
            // Only log unexpected errors
            return { type, count: 0, supported: false };
          }
        }),
      );

      // Process results
      let supportedCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          counts[result.value.type] = result.value.count;
          if (result.value.count > 0) supportedCount++;
        }
      });

      console.log(
        `✅ Loaded ${supportedCount} supported type(s) with data (using TxnTotalCount from API)`,
      );
      console.log("Type counts:", counts);
      setTypeCounts(counts);

      // Find first type with data and load it
      const firstActiveType = transactionTypes.find(
        (type) => counts[type] > 0,
      );
      if (firstActiveType) {
        setSelectedTxnType(firstActiveType);
        loadTransactionsForType(firstActiveType);
      } else {
        // If no types have data, use first type or show empty
        if (transactionTypes.length > 0) {
          setSelectedTxnType(transactionTypes[0]);
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error("Error loading type counts:", error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Load transactions for selected type
  const loadTransactionsForType = async (
    txnType: string,
    reset: boolean = true,
  ) => {
    if (!txnType) return;

    setIsLoadingType(true);
    if (reset) {
      setContinuationToken(null);
      setHasMoreData(false);
    }

    try {
      console.log(
        `========== Loading transactions for type: ${txnType} ==========`,
      );
      const response = await getTransactionsByType(
        txnType,
        undefined,
        activeTenantId,
      );
      console.log(
        `========== Received ${response.transactions.length} transactions ==========`,
      );

      // Sort by CreateTime descending (newest first)
      const sortedTxns = [...response.transactions].sort(
        (a, b) => {
          const dateA = a.CreateTime
            ? new Date(a.CreateTime).getTime()
            : 0;
          const dateB = b.CreateTime
            ? new Date(b.CreateTime).getTime()
            : 0;
          return dateB - dateA; // Descending order (newest first)
        },
      );

      setTransactions(sortedTxns);
      setContinuationToken(response.continuationToken);
      setHasMoreData(response.hasMore);

      if (sortedTxns.length === 0) {
        toast.info(
          `No ${txnType} transactions found. Check browser Console (F12) for API response details.`,
          {
            duration: 6000,
          },
        );
      } else {
        const moreInfo = response.hasMore
          ? " (more available)"
          : "";
        toast.success(
          `Loaded ${sortedTxns.length} ${txnType} transaction(s)${moreInfo}`,
        );
        console.log(
          "Transactions set to state. First transaction:",
          sortedTxns[0],
        );
        if (response.hasMore) {
          console.log(
            '📄 Pagination available - click "Load More" to fetch next batch',
          );
        }
      }
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      if (error.message !== "CORS_BLOCKED") {
        toast.error(
          `Failed to load transactions: ${error.message}. Check Console (F12) for details.`,
          {
            duration: 6000,
          },
        );
      }
      setTransactions([]);
      setContinuationToken(null);
      setHasMoreData(false);
    } finally {
      setIsLoadingType(false);
    }
  };

  // Load more transactions (next page)
  const loadMoreTransactions = async () => {
    if (!selectedTxnType || !continuationToken || !hasMoreData)
      return;

    setIsLoadingMore(true);
    try {
      console.log(
        `========== Loading more transactions for type: ${selectedTxnType} ==========`,
      );
      console.log(
        `   Continuation token: ${continuationToken.substring(0, 50)}...`,
      );

      const response = await getTransactionsByType(
        selectedTxnType,
        continuationToken,
        activeTenantId,
      );
      console.log(
        `========== Received ${response.transactions.length} more transactions ==========`,
      );

      // Sort new transactions by CreateTime descending
      const sortedNewTxns = [...response.transactions].sort(
        (a, b) => {
          const dateA = a.CreateTime
            ? new Date(a.CreateTime).getTime()
            : 0;
          const dateB = b.CreateTime
            ? new Date(b.CreateTime).getTime()
            : 0;
          return dateB - dateA;
        },
      );

      // Append to existing transactions
      setTransactions((prev) => [...prev, ...sortedNewTxns]);
      setContinuationToken(response.continuationToken);
      setHasMoreData(response.hasMore);

      const moreInfo = response.hasMore
        ? " (more available)"
        : " (all loaded)";
      toast.success(
        `Loaded ${response.transactions.length} more transaction(s)${moreInfo}`,
      );

      if (response.hasMore) {
        console.log(
          '📄 More data available - click "Load More" again to fetch next batch',
        );
      } else {
        console.log("✅ All transactions loaded");
      }
    } catch (error: any) {
      console.error("Error loading more transactions:", error);
      if (error.message !== "CORS_BLOCKED") {
        toast.error(`Failed to load more: ${error.message}`, {
          duration: 6000,
        });
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load columns for selected transaction type
  useEffect(() => {
    const STORAGE_VERSION = "10";
    const storageKey = `transactionsViewColumns_${selectedTxnType}`;
    const saved = localStorage.getItem(storageKey);
    const savedVersion = localStorage.getItem(
      `${storageKey}_version`,
    );

    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        setColumnConfigs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved columns:", e);
        setColumnConfigs(getDefaultColumns(selectedTxnType));
      }
    } else {
      // Load default columns for this type
      setColumnConfigs(getDefaultColumns(selectedTxnType));
    }
  }, [selectedTxnType]);

  // Handle type selection
  const handleTypeChange = (value: string) => {
    setSelectedTxnType(value);
    loadTransactionsForType(value);
    setSearchTerm(""); // Reset search when changing type
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
  const handleDeleteTransaction = (
    transaction: Transaction,
  ) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (
      !selectedTransaction ||
      !selectedTransaction._etag ||
      !selectedTransaction.TxnId
    ) {
      toast.error("Cannot delete: missing transaction data");
      return;
    }

    try {
      // TxnId is already in format "TxnType:EntityId" from the API response
      console.log("Deleting transaction:", {
        TxnId: selectedTransaction.TxnId,
        TxnType: selectedTransaction.TxnType,
        etag: selectedTransaction._etag,
      });

      await deleteTransaction(
        selectedTransaction.TxnId,
        selectedTransaction._etag,
      );
      toast.success(
        `Deleted ${selectedTransaction.TxnType} transaction`,
      );
      setIsDeleteDialogOpen(false);

      // Refresh current type and update counts
      await loadTransactionsForType(selectedTxnType);
      await loadAllTypeCounts();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  // Handle create transaction
  const handleCreateTransaction = async (
    txnType: string,
    txnData: any,
  ) => {
    try {
      const newTxn = await createTransaction(txnType, txnData);
      toast.success(
        `Created ${txnType} transaction successfully!`,
      );
      setIsCreateDialogOpen(false);

      // Refresh if we're viewing this type
      if (selectedTxnType === txnType) {
        await loadTransactionsForType(txnType);
      }

      // Update type counts
      await loadAllTypeCounts();

      return newTxn;
    } catch (error: any) {
      toast.error(
        `Failed to create transaction: ${error.message}`,
      );
      throw error;
    }
  };

  // Handle update transaction
  const handleUpdateTransaction = async (
    txnId: string,
    txnType: string,
    txnData: any,
    etag: string,
  ) => {
    try {
      await updateTransaction(txnId, txnType, txnData, etag);
      toast.success(
        `Updated ${txnType} transaction successfully!`,
      );
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
    if (!searchTerm.trim()) return transactionTypes;
    const lower = searchTerm.toLowerCase();
    return transactionTypes.filter((type) =>
      type.toLowerCase().includes(lower),
    );
  }, [searchTerm, transactionTypes]);
  
  // Sort filtered types based on sort mode
  const sortedFilteredTypes = useMemo(() => {
    const typesToSort = filteredTypes.filter((type) => {
      const count = typeCounts[type] || 0;
      return count > 0;
    });
    
    return [...typesToSort].sort((a, b) => {
      const countA = typeCounts[a] || 0;
      const countB = typeCounts[b] || 0;
      
      switch (sortMode) {
        case 'name-asc':
          return a.localeCompare(b);
        case 'name-desc':
          return b.localeCompare(a);
        case 'count-desc':
          return countB - countA;
        case 'count-asc':
          return countA - countB;
        default:
          return 0;
      }
    });
  }, [filteredTypes, typeCounts, sortMode]);

  // Helper function to get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    if (path.includes(".")) {
      const parts = path.split(".");
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
    if (
      typeof value === "string" &&
      (value.trim() === "" ||
        value === "—" ||
        value === "-" ||
        value === "N/A")
    )
      return true;
    return false;
  };

  // Helper to check if a column has any non-empty values
  const hasNonEmptyValues = (columnKey: string): boolean => {
    if (transactions.length === 0) return false;

    return transactions.some((txn) => {
      const value = getNestedValue(txn, columnKey);
      return !isEmptyValue(value);
    });
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (transactions.length === 0) {
      // If no data, don't mark anything as empty
      return columnConfigs.map((col) => ({
        ...col,
        isEmpty: false,
      }));
    }

    const enriched = columnConfigs.map((col) => {
      // Check if column has any non-empty values
      const hasData =
        col.locked ||
        transactions.some((txn) => {
          const value = getNestedValue(txn, col.key);
          const isEmpty = isEmptyValue(value);
          return !isEmpty;
        });

      return {
        ...col,
        isEmpty: !hasData,
      };
    });

    // Debug: Log columns marked as empty
    const emptyColumns = enriched.filter((c) => c.isEmpty);
    if (emptyColumns.length > 0) {
      console.log(
        "Columns with no data:",
        emptyColumns.map((c) => c.key),
      );
    }

    return enriched;
  }, [columnConfigs, transactions]);

  // DataTable columns configuration - dynamically generated based on enabled columns
  const columns = useMemo(() => {
    // Use enrichedColumnConfigs which already has isEmpty flags
    const enabledColumns = enrichedColumnConfigs.filter(
      (col) => col.enabled,
    );

    // Filter out columns that have no data (all values are empty)
    const columnsWithData = enabledColumns.filter(
      (col) => col.locked || !col.isEmpty,
    );

    return columnsWithData.map((colConfig) => {
      // Special rendering for known columns
      if (colConfig.key === "TxnId") {
        return {
          key: "TxnId",
          header: "ID",
          render: (row: Transaction) => {
            const displayId = row.TxnId || "N/A";
            return (
              <div className="max-w-[120px] md:max-w-[180px]">
                <code
                  className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block"
                  title={displayId}
                >
                  {displayId}
                </code>
              </div>
            );
          },
        };
      }

      if (colConfig.key === "Name") {
        return {
          key: "Name",
          header: "Name",
          render: (row: Transaction) => {
            const name =
              row.Txn?.Name ||
              row.Txn?.CustomerName ||
              row.Txn?.InvoiceId ||
              "-";
            return (
              <div className="max-w-[150px] md:max-w-[250px]">
                <span
                  className="text-xs md:text-sm truncate block"
                  title={name}
                >
                  {name}
                </span>
              </div>
            );
          },
        };
      }

      if (colConfig.key === "CreateTime") {
        return {
          key: "CreateTime",
          header: "Created",
          render: (row: Transaction) => {
            if (!row.CreateTime)
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            return (
              <span className="whitespace-nowrap text-xs md:text-sm">
                {new Date(row.CreateTime).toLocaleDateString()}
              </span>
            );
          },
        };
      }

      // Special rendering for Status
      if (
        colConfig.key === "Txn.Status" ||
        colConfig.key === "Status"
      ) {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (row: Transaction) => {
            const value = getNestedValue(row, colConfig.key);
            if (!value || value === "-") {
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            }
            return (
              <Badge
                variant="default"
                className="whitespace-nowrap text-xs bg-[#1D6BCD] hover:bg-[#1858A8]"
              >
                {String(value)}
              </Badge>
            );
          },
        };
      }

      // Special rendering for Amount/Currency
      if (
        colConfig.key.toLowerCase().includes("amount") ||
        colConfig.key.toLowerCase().includes("price")
      ) {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (row: Transaction) => {
            const value = getNestedValue(row, colConfig.key);
            if (value === null || value === undefined) {
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            }
            const numValue =
              typeof value === "number"
                ? value
                : parseFloat(value);
            if (!isNaN(numValue)) {
              return (
                <span className="text-xs md:text-sm tabular-nums">
                  {numValue.toLocaleString()}
                </span>
              );
            }
            return (
              <span className="text-xs md:text-sm">
                {String(value)}
              </span>
            );
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
            return (
              <span className="text-xs md:text-sm text-muted-foreground">
                -
              </span>
            );
          }

          // Handle dates
          if (
            colConfig.key.toLowerCase().includes("time") ||
            colConfig.key.toLowerCase().includes("date")
          ) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return (
                  <span className="whitespace-nowrap text-xs md:text-sm">
                    {date.toLocaleDateString()}
                  </span>
                );
              }
            } catch (e) {
              // Not a date, continue
            }
          }

          // Handle booleans
          if (typeof value === "boolean") {
            return (
              <Badge
                variant={value ? "default" : "secondary"}
                className="text-xs"
              >
                {value ? "Yes" : "No"}
              </Badge>
            );
          }

          // Handle objects and arrays
          if (typeof value === "object") {
            return (
              <div className="max-w-[150px]">
                <code
                  className="text-[10px] md:text-[11px] bg-muted px-1 py-0.5 rounded truncate block"
                  title={JSON.stringify(value)}
                >
                  {JSON.stringify(value)}
                </code>
              </div>
            );
          }

          // Handle primitives
          return (
            <div className="max-w-[150px] md:max-w-[200px]">
              <span
                className="text-xs md:text-sm truncate block"
                title={String(value)}
              >
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
    <div className="flex gap-1 whitespace-nowrap justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewDetail(row)}
        className="h-7 md:h-8 w-7 md:w-8 p-0"
        title="View transaction details"
      >
        <Eye className="h-3 w-3 md:h-3.5 md:w-3.5" />
      </Button>
      {(userRole === "superuser" ||
        userRole === "admin" ||
        userRole === "developer") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditTransaction(row)}
          className="h-7 md:h-8 w-7 md:w-8 p-0"
          title="Edit transaction"
        >
          <Pencil className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
      )}
      {(userRole === "superuser" ||
        userRole === "admin" ||
        userRole === "developer") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteTransaction(row)}
          className="h-7 md:h-8 w-7 md:w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Delete transaction"
        >
          <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
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
      {(userRole === "superuser" ||
        userRole === "admin" ||
        userRole === "developer") && (
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
      {(userRole === "superuser" ||
        userRole === "admin" ||
        userRole === "developer") && (
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
      <Card className="shadow-sm">
     
        <CardContent className="overflow-x-hidden pt-6">
          {/* Top Bar - Headers */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[260px_1fr] gap-6 mb-3">
            {/* Left: Transaction Types Header - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <h3 className="text-base md:text-lg">
                Transaction Types
              </h3>
              <Badge variant="secondary">
                {
                  filteredTypes.filter(
                    (type) => typeCounts[type] > 0,
                  ).length
                }
              </Badge>
            </div>

            {/* Right: Current Type and Actions */}
            <div className="flex flex-col gap-3">
              {/* Mobile type selector - First row on mobile */}
              <div className="md:hidden">
                <Select
                  value={selectedTxnType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTypes
                      .filter(
                        (type) => (typeCounts[type] || 0) > 0,
                      )
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatTransactionType(type)} (
                          {typeCounts[type] || 0})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Desktop type display */}
                <div className="hidden md:flex items-center gap-2">
                  <h3 className="text-base md:text-lg">
                    {formatTransactionType(selectedTxnType)}
                  </h3>
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
                    isSuperUser={userRole === "superuser"}
                  />
                  <ColumnSelector
                    columns={enrichedColumnConfigs}
                    onColumnsChange={setColumnConfigs}
                    availableFields={availableFields}
                    onReset={handleResetColumns}
                  />
                </div>

                {/* Mobile View - Dropdown Menu - Second row on mobile */}
                <div className="flex md:hidden items-center gap-2 justify-end ml-auto">
                  {/* Tenant Selector */}
                  <TenantSelector
                    tenants={tenants}
                    activeTenantId={activeTenantId}
                    onTenantChange={onTenantChange}
                    isSuperUser={userRole === "superuser"}
                  />

                  {/* Dropdown Menu with other actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48"
                    >
                      {(userRole === "superuser" ||
                        userRole === "admin" ||
                        userRole === "developer") && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              setIsCreateDialogOpen(true)
                            }
                          >
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
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* Left Sidebar - Transaction Types List */}
            <div className="space-y-3 md:block hidden">
              {/* Search Types and Sort */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortMode('name-asc')}>
                      <Check className={`h-4 w-4 mr-2 ${sortMode === 'name-asc' ? 'opacity-100' : 'opacity-0'}`} />
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortMode('name-desc')}>
                      <Check className={`h-4 w-4 mr-2 ${sortMode === 'name-desc' ? 'opacity-100' : 'opacity-0'}`} />
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortMode('count-desc')}>
                      <Check className={`h-4 w-4 mr-2 ${sortMode === 'count-desc' ? 'opacity-100' : 'opacity-0'}`} />
                      Count (High to Low)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortMode('count-asc')}>
                      <Check className={`h-4 w-4 mr-2 ${sortMode === 'count-asc' ? 'opacity-100' : 'opacity-0'}`} />
                      Count (Low to High)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Types List */}
              <Card className="border rounded-[10px]">
                <ScrollArea className="h-[600px]">
                  {isLoadingCounts ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {sortedFilteredTypes
                        .map((type) => {
                          const count = typeCounts[type] || 0;

                          return (
                            <Button
                              key={type}
                              variant={
                                selectedTxnType === type
                                  ? "default"
                                  : "ghost"
                              }
                              className="w-full justify-between text-left h-auto py-1.5 px-3 gap-2"
                              onClick={() =>
                                handleTypeChange(type)
                              }
                              title={`${count} transaction(s)`}
                            >
                              <span className="text-sm truncate flex-1">
                                {formatTransactionType(type)}
                              </span>
                              <Badge 
                                variant={selectedTxnType === type ? "secondary" : "outline"}
                                className="ml-auto flex-shrink-0 text-xs"
                              >
                                {count}
                              </Badge>
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
              {/* Loading State */}
              {isLoadingType && (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}

              {/* Empty State - Loading Spinner */}
              {transactions.length === 0 && !isLoadingType && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}

              {/* Data Table */}
              {transactions.length > 0 && !isLoadingType && (
                <>
                  <DataTable
                    data={transactions}
                    columns={columns}
                    actions={renderActions}
                    actionsCompact={renderActionsCompact}
                    searchPlaceholder="Search transactions..."
                    emptyMessage={`No ${selectedTxnType} transactions found`}
                  />

                  {/* Load More Button */}
                  {hasMoreData && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={loadMoreTransactions}
                        disabled={isLoadingMore}
                        className="min-w-[200px]"
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load More (next 100)
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Info badge showing total loaded */}
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Showing {transactions.length} transaction(s)
                    {hasMoreData && " • More available"}
                  </div>
                </>
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{" "}
              {selectedTransaction?.TxnType} transaction?
              <br />
              <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                {selectedTransaction?.TxnId}
              </code>
              <br />
              <strong className="text-destructive mt-2 inline-block">
                This action cannot be undone.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}