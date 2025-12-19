import {
  Transaction,
  TRANSACTION_TYPES,
  TRANSACTION_TYPES_INFO,
  TransactionTypeInfo,
  getTransactionsByType,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  PaginatedTransactionsResponse,
  formatTransactionType,
  getAllDataSources,
  DataSource,
} from "../lib/api";
import { useState, useMemo, useEffect, useRef, memo } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

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

// Format number with thousand separators (e.g., 41609423 → 41,609,423)
const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return '—';
  return num.toLocaleString('en-US');
};

// Memoized transaction type button for better performance with large lists
const TransactionTypeButton = memo(({ 
  type, 
  isActive, 
  count, 
  isCountLoaded, 
  isLoadingThisCount,
  onClick 
}: { 
  type: string; 
  isActive: boolean; 
  count: number | undefined;
  isCountLoaded: boolean;
  isLoadingThisCount: boolean;
  onClick: () => void;
}) => {
  const displayCount = isCountLoaded ? formatNumber(count) : (isLoadingThisCount ? '...' : '—');
  
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      className="w-full justify-between text-left h-auto py-1.5 px-3 gap-2"
      onClick={onClick}
      title={isCountLoaded ? `${formatNumber(count)} transaction(s)` : 'Click to load'}
    >
      <span className="text-sm truncate flex-1">
        {formatTransactionType(type)}
      </span>
      <Badge 
        variant={isActive ? "secondary" : "outline"}
        className={`ml-auto flex-shrink-0 text-xs ${isLoadingThisCount ? 'animate-pulse' : ''}`}
      >
        {displayCount}
      </Badge>
    </Button>
  );
});

TransactionTypeButton.displayName = 'TransactionTypeButton';

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
    useState<string>(""); // Will be set to first type when loaded
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
  const loadingCountsRef = useRef<Set<string>>(new Set()); // Track which counts are currently loading
  const [continuationToken, setContinuationToken] = useState<
    string | null
  >(null);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for sorting transaction types
  type SortMode = 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';
  const [sortMode, setSortMode] = useState<SortMode>('name-asc');

  // State for Data Source filtering
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("all");
  
  // State for Accordion (which groups are open)
  // By default all groups are open, we track closed groups instead
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  // Use transaction types loaded from data-capture-specs API
  // These are loaded via loadTransactionTypes() in App.tsx on mount
  const transactionTypes = useMemo(() => {
    const types = TRANSACTION_TYPES.length > 0 ? TRANSACTION_TYPES : [];
    
    if (types.length > 0) {
      console.log(`📋 ${types.length} transaction types loaded`);
    }
    
    return types;
  }, [TRANSACTION_TYPES]);

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
    // Core Fields - Only TxnId is required and locked
    const coreFields: ColumnConfig[] = [
      {
        key: "TxnId",
        label: "Txn ID",
        enabled: true,
        locked: true,
      },
    ];

    // Optional common fields (can be enabled/disabled)
    const optionalCommonFields: ColumnConfig[] = [
      {
        key: "TxnType",
        label: "Type",
        enabled: false,
        locked: false,
      },
      {
        key: "CreateTime",
        label: "Created",
        enabled: false,
        locked: false,
      },
      {
        key: "UpdateTime",
        label: "Updated",
        enabled: false,
        locked: false,
      },
      {
        key: "TenantId",
        label: "Tenant ID",
        enabled: false,
        locked: false,
      },
      {
        key: "_ts",
        label: "Timestamp",
        enabled: false,
        locked: false,
      },
    ];

    // AR-specific additional columns (first 5 data fields from JSON are locked)
    if (txnType === "ar") {
      return [
        ...coreFields,
        ...optionalCommonFields,
        { key: "Txn.arnum", label: "arnum", enabled: true, locked: true },
        { key: "Txn.arnum2", label: "arnum2", enabled: true, locked: true },
        { key: "Txn.arnum3", label: "arnum3", enabled: true, locked: true },
        { key: "Txn.arname", label: "arname", enabled: true, locked: true },
        { key: "Txn.arlname", label: "arlname", enabled: true, locked: true },
        { key: "Txn.arfname", label: "arfname", enabled: false },
        { key: "Txn.artitle", label: "artitle", enabled: false },
        { key: "Txn.arsort", label: "arsort", enabled: false },
        { key: "Txn.aradd1", label: "aradd1", enabled: false },
        { key: "Txn.aradd2", label: "aradd2", enabled: false },
        { key: "Txn.arcity", label: "arcity", enabled: false },
        { key: "Txn.arstate", label: "arstate", enabled: false },
        { key: "Txn.arzip", label: "arzip", enabled: false },
        { key: "Txn.phone1", label: "phone1", enabled: false },
        { key: "Txn.phone2", label: "phone2", enabled: false },
      ];
    }

    // Quote-specific additional columns
    if (txnType === "Quote") {
      return [
        ...coreFields,
        ...optionalCommonFields,
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
        ...optionalCommonFields,
        { key: "Txn.id", label: "Spec ID", enabled: false },
      ];
    }

    // LineType-specific additional columns
    if (txnType === "LineType" || txnType === "LineTypes") {
      return [
        ...coreFields,
        ...optionalCommonFields,
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
      ];
    }

    // ReasonCode-specific additional columns
    if (txnType === "ReasonCode") {
      return [
        ...coreFields,
        ...optionalCommonFields,
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
      ];
    }

    // QuoteDetail-specific additional columns
    if (txnType === "QuoteDetail") {
      return [
        ...coreFields,
        ...optionalCommonFields,
        {
          key: "Txn.quoteDetailId",
          label: "Quote Detail ID",
          enabled: true,
        },
        {
          key: "Txn.quoteId",
          label: "Quote ID",
          enabled: true,
        },
        {
          key: "Txn.lineNumber",
          label: "Line Number",
          enabled: true,
        },
        {
          key: "Txn.manualPrice",
          label: "Manual Price",
          enabled: true,
        },
        {
          key: "Txn.systemPrice",
          label: "System Price",
          enabled: true,
        },
        {
          key: "Txn.systemAverageCost",
          label: "System Avg Cost",
          enabled: true,
        },
        {
          key: "Txn.quantity",
          label: "Quantity",
          enabled: false,
        },
        {
          key: "Txn.sku",
          label: "SKU",
          enabled: false,
        },
        {
          key: "Txn.description",
          label: "Description",
          enabled: false,
        },
        {
          key: "Txn.lineTypeCode",
          label: "Line Type Code",
          enabled: false,
        },
        {
          key: "Txn.category",
          label: "Category",
          enabled: false,
        },
        {
          key: "Txn.unitOfMeasure",
          label: "Unit of Measure",
          enabled: false,
        },
        {
          key: "Txn.notes",
          label: "Notes",
          enabled: false,
        },
        {
          key: "Txn.isActive",
          label: "Active",
          enabled: false,
        },
        {
          key: "Txn.productCode",
          label: "Product Code",
          enabled: false,
        },
        {
          key: "Txn.vendorCode",
          label: "Vendor Code",
          enabled: false,
        },
        {
          key: "Txn.extendedPrice",
          label: "Extended Price",
          enabled: false,
        },
        {
          key: "Txn.discount",
          label: "Discount",
          enabled: false,
        },
        {
          key: "Txn.taxAmount",
          label: "Tax Amount",
          enabled: false,
        },
      ];
    }

    // QuotePack-specific additional columns
    if (txnType === "QuotePack") {
      return [
        ...coreFields,
        ...optionalCommonFields,
        {
          key: "Txn.quotePackId",
          label: "Quote Pack ID",
          enabled: true,
        },
        {
          key: "Txn.quoteId",
          label: "Quote ID",
          enabled: true,
        },
        {
          key: "Txn.packNumber",
          label: "Pack Number",
          enabled: true,
        },
        {
          key: "Txn.packName",
          label: "Pack Name",
          enabled: true,
        },
        {
          key: "Txn.totalPrice",
          label: "Total Price",
          enabled: true,
        },
        {
          key: "Txn.quantity",
          label: "Quantity",
          enabled: false,
        },
        {
          key: "Txn.description",
          label: "Description",
          enabled: false,
        },
        {
          key: "Txn.isActive",
          label: "Active",
          enabled: false,
        },
      ];
    }

    // Quotes-specific additional columns  
    if (txnType === "Quotes") {
      return [
        ...coreFields,
        {
          key: "Txn.quoteId",
          label: "Quote ID",
          enabled: true,
        },
        {
          key: "Txn.quoteNumber",
          label: "Quote Number",
          enabled: true,
        },
        {
          key: "Txn.customerId",
          label: "Customer ID",
          enabled: true,
        },
        {
          key: "Txn.customerName",
          label: "Customer Name",
          enabled: true,
        },
        {
          key: "Txn.totalAmount",
          label: "Total Amount",
          enabled: true,
        },
        {
          key: "Txn.status",
          label: "Status",
          enabled: true,
        },
        {
          key: "Txn.quoteDate",
          label: "Quote Date",
          enabled: false,
        },
        {
          key: "Txn.expirationDate",
          label: "Expiration Date",
          enabled: false,
        },
        {
          key: "Txn.salesperson",
          label: "Salesperson",
          enabled: false,
        },
        {
          key: "Txn.notes",
          label: "Notes",
          enabled: false,
        },
        {
          key: "Txn.isActive",
          label: "Active",
          enabled: false,
        },
      ];
    }

    // ServiceRequest-specific additional columns
    if (txnType === "ServiceRequest") {
      return [
        ...coreFields,
        {
          key: "Txn.serviceRequestId",
          label: "Service Request ID",
          enabled: true,
        },
        {
          key: "Txn.customerId",
          label: "Customer ID",
          enabled: true,
        },
        {
          key: "Txn.requestType",
          label: "Request Type",
          enabled: true,
        },
        {
          key: "Txn.status",
          label: "Status",
          enabled: true,
        },
        {
          key: "Txn.priority",
          label: "Priority",
          enabled: true,
        },
        {
          key: "Txn.description",
          label: "Description",
          enabled: false,
        },
        {
          key: "Txn.assignedTo",
          label: "Assigned To",
          enabled: false,
        },
        {
          key: "Txn.requestDate",
          label: "Request Date",
          enabled: false,
        },
        {
          key: "Txn.completedDate",
          label: "Completed Date",
          enabled: false,
        },
        {
          key: "Txn.notes",
          label: "Notes",
          enabled: false,
        },
      ];
    }

    // WorkflowCustomer-specific additional columns
    if (txnType === "WorkflowCustomer") {
      return [
        ...coreFields,
        {
          key: "Txn.workflowCustomerId",
          label: "Workflow Customer ID",
          enabled: true,
        },
        {
          key: "Txn.customerId",
          label: "Customer ID",
          enabled: true,
        },
        {
          key: "Txn.customerName",
          label: "Customer Name",
          enabled: true,
        },
        {
          key: "Txn.workflowStatus",
          label: "Workflow Status",
          enabled: true,
        },
        {
          key: "Txn.stage",
          label: "Stage",
          enabled: true,
        },
        {
          key: "Txn.assignedTo",
          label: "Assigned To",
          enabled: false,
        },
        {
          key: "Txn.priority",
          label: "Priority",
          enabled: false,
        },
        {
          key: "Txn.startDate",
          label: "Start Date",
          enabled: false,
        },
        {
          key: "Txn.expectedCompletionDate",
          label: "Expected Completion",
          enabled: false,
        },
        {
          key: "Txn.notes",
          label: "Notes",
          enabled: false,
        },
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
      ];
    }

    // Default additional columns for other transaction types
    return [
      ...coreFields,
      ...optionalCommonFields,
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
    ];
  };

  // Generate columns from actual transaction data (shows first 5 fields, rest in filter)
  const generateColumnsFromData = (transactions: Transaction[], txnType: string): ColumnConfig[] => {
    if (transactions.length === 0) {
      return getDefaultColumns(txnType);
    }

    const firstTxn = transactions[0];
    const columns: ColumnConfig[] = [];

    // Always add TxnId first (locked)
    columns.push({
      key: "TxnId",
      label: "Txn ID",
      enabled: true,
      locked: true,
    });

    // Extract all fields from Txn object
    if (firstTxn.Txn && typeof firstTxn.Txn === 'object') {
      const txnFields = Object.keys(firstTxn.Txn);
      
      // Add all Txn fields: first 4 enabled (ID + 4 = 5 total), rest disabled
      txnFields.forEach((field, index) => {
        columns.push({
          key: `Txn.${field}`,
          label: formatFieldLabel(field),
          enabled: index < 4, // First 4 fields enabled (with ID makes 5 total)
          locked: false,
        });
      });
    }

    // Add common system fields (optional, disabled by default)
    columns.push(
      { key: "TxnType", label: "Type", enabled: false, locked: false },
      { key: "CreateTime", label: "Created", enabled: false, locked: false },
      { key: "UpdateTime", label: "Updated", enabled: false, locked: false },
      { key: "TenantId", label: "Tenant ID", enabled: false, locked: false },
      { key: "_ts", label: "Timestamp", enabled: false, locked: false }
    );

    console.log(`✨ Auto-generated ${columns.length} columns from data for type "${txnType}"`);
    console.log(`   Enabled columns: ${columns.filter(c => c.enabled).length}`);
    
    return columns;
  };

  // Column configuration state with localStorage persistence (per transaction type)
  const [columnConfigs, setColumnConfigs] = useState<
    ColumnConfig[]
  >(() => {
    const STORAGE_VERSION = "17"; // v17: Auto-generate first 5 columns visible, rest in filter
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
    const STORAGE_VERSION = "17";
    const storageKey = `transactionsViewColumns_${selectedTxnType}`;
    // Regenerate from current transaction data
    if (transactions.length > 0) {
      const autoColumns = generateColumnsFromData(transactions, selectedTxnType);
      setColumnConfigs(autoColumns);
    } else {
      setColumnConfigs(getDefaultColumns(selectedTxnType));
    }
    localStorage.removeItem(storageKey);
    localStorage.setItem(
      `${storageKey}_version`,
      STORAGE_VERSION,
    );
    toast.success("Column settings reset to default");
  };

  // Save column configs to localStorage whenever they change (per transaction type)
  useEffect(() => {
    const STORAGE_VERSION = "14";
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

    const fieldsMap = new Map<string, boolean>(); // Preserves insertion order

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
          fieldsMap.set(fullKey, true);
          // Also extract nested fields (e.g., Txn.location.Address)
          extractFields(value, fullKey);
        } else {
          fieldsMap.set(fullKey, true);
        }
      });
    };

    transactions.forEach((txn) => {
      // Add top-level fields
      Object.keys(txn).forEach((key) => {
        if (!key.startsWith("_") && key !== "Txn") {
          fieldsMap.set(key, true);
        }
      });

      // Add Txn object fields (including nested)
      if (txn.Txn && typeof txn.Txn === "object") {
        extractFields(txn.Txn, "Txn");
      }
    });

    // Return fields in the order they appear in JSON (Map preserves insertion order)
    return Array.from(fieldsMap.keys());
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

  // Initialize with first transaction type when types are available
  const initialLoadDoneRef = useRef(false);
  const countsLoadStartedRef = useRef(false);
  
  // Load counts for all transaction types in parallel (with batching)
  const loadAllTypeCounts = async () => {
    console.log(`📊 Loading counts for ${transactionTypes.length} transaction types...`);
    const startTime = performance.now();
    
    const BATCH_SIZE = 10; // Load 10 types at a time
    const batches: string[][] = [];
    
    // Filter types that need loading
    const typesToLoad = transactionTypes.filter(
      type => typeCounts[type] === undefined && !loadingCountsRef.current.has(type)
    );
    
    // Split into batches
    for (let i = 0; i < typesToLoad.length; i += BATCH_SIZE) {
      batches.push(typesToLoad.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Loading ${typesToLoad.length} types in ${batches.length} batches of ${BATCH_SIZE}`);
    
    // Process batches sequentially, but items within batch in parallel
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Batch ${batchIndex + 1}/${batches.length}: Loading ${batch.length} types...`);
      
      const batchPromises = batch.map(async (type) => {
        // Mark as loading
        loadingCountsRef.current.add(type);
        
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
          
          // Update counts state
          setTypeCounts(prev => ({
            ...prev,
            [type]: count
          }));
        } catch (error: any) {
          // Silently handle expected errors
          setTypeCounts(prev => ({
            ...prev,
            [type]: 0
          }));
        } finally {
          // Remove from loading set
          loadingCountsRef.current.delete(type);
        }
      });
      
      // Wait for this batch to complete before starting next
      await Promise.all(batchPromises);
    }
    
    const endTime = performance.now();
    console.log(`✅ All counts loaded in ${Math.round(endTime - startTime)}ms`);
  };
  
  useEffect(() => {
    if (transactionTypes.length > 0) {
      setIsLoadingCounts(false);
      
      if (!selectedTxnType) {
        // Set default type to LineType, or first available if not found
        const hasLineType = transactionTypes.includes("LineType");
        if (hasLineType) {
          setSelectedTxnType("LineType");
          console.log("📌 Default type set to: LineType");
        } else {
          const sortedTypes = [...transactionTypes].sort((a, b) => a.localeCompare(b));
          setSelectedTxnType(sortedTypes[0]);
          console.log(`📌 Default type set to: ${sortedTypes[0]} (LineType not available)`);
        }
      }
      
      // Load all counts in parallel (once)
      if (!countsLoadStartedRef.current) {
        countsLoadStartedRef.current = true;
        console.log(`🚀 Starting parallel count loading for ${transactionTypes.length} types...`);
        loadAllTypeCounts();
      }
    }
  }, [transactionTypes, selectedTxnType]);

  // Load Data Sources for filtering
  useEffect(() => {
    const loadDataSources = async () => {
      try {
        const sources = await getAllDataSources(activeTenantId === 'global' ? undefined : activeTenantId);
        setDataSources(sources);
        console.log(`📂 Loaded ${sources.length} Data Sources:`, sources.map(ds => ({
          id: ds.DatasourceId || ds.DataSourceId,
          name: ds.DatasourceName || ds.DataSourceName
        })));
      } catch (error) {
        console.error('Failed to load data sources:', error);
      }
    };
    
    loadDataSources();
  }, [activeTenantId]);

  // Auto-load data when selectedTxnType changes
  useEffect(() => {
    if (selectedTxnType && transactionTypes.length > 0) {
      // Load count in background (non-blocking) - fallback if not loaded by parallel load
      if (typeCounts[selectedTxnType] === undefined) {
        loadTypeCount(selectedTxnType);
      }
      
      // Load transactions for first type automatically
      if (!initialLoadDoneRef.current) {
        console.log(`🚀 Auto-loading transactions for first type: ${selectedTxnType}`);
        loadTransactionsForType(selectedTxnType);
        initialLoadDoneRef.current = true;
      }
    }
  }, [selectedTxnType]);

  // Load count for a single transaction type (lazy loading on-demand)
  const loadTypeCount = async (type: string) => {
    // Skip if we already have the count for this type or it's currently loading
    if (typeCounts[type] !== undefined || loadingCountsRef.current.has(type)) {
      return;
    }

    // Mark as loading
    loadingCountsRef.current.add(type);

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
      
      // Update counts state
      setTypeCounts(prev => ({
        ...prev,
        [type]: count
      }));
    } catch (error: any) {
      // Silently handle expected errors
      if (
        error.message === "Unsupported TxnType" ||
        error.message === "Unsupported txn_type" ||
        error.message === "Internal Server Error" ||
        error.message === "CORS_ERROR" ||
        error.message === "CORS_BLOCKED"
      ) {
        setTypeCounts(prev => ({
          ...prev,
          [type]: 0
        }));
      } else {
        setTypeCounts(prev => ({
          ...prev,
          [type]: 0
        }));
      }
    } finally {
      // Remove from loading set
      loadingCountsRef.current.delete(type);
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

      // Auto-generate columns from data (shows ALL fields)
      if (sortedTxns.length > 0 && reset) {
        const autoColumns = generateColumnsFromData(sortedTxns, txnType);
        setColumnConfigs(autoColumns);
      }

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

  // Note: Column loading is now handled automatically in loadTransactionsForType()
  // which calls generateColumnsFromData() to show ALL fields from actual data

  // Handle refresh - reload all counts and current type's transactions
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    console.log('🔄 Refreshing Data Plane data...');
    setIsRefreshing(true);
    
    try {
      // Clear all counts to force reload
      setTypeCounts({});
      loadingCountsRef.current.clear();
      countsLoadStartedRef.current = false;
      
      // Reload all counts in parallel
      await loadAllTypeCounts();
      
      // Reload transactions for current type if one is selected
      if (selectedTxnType) {
        await loadTransactionsForType(selectedTxnType);
      }
      
      toast.success('Data refreshed successfully!');
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle type selection
  const handleTypeChange = async (value: string) => {
    console.log(`🔄 handleTypeChange called with type: ${value}`);
    setSelectedTxnType(value);
    // Note: Don't reset searchTerm here as it's used for searching transaction types in sidebar
    
    // Load count for this type in background (non-blocking)
    loadTypeCount(value);
    
    // Load transactions for this type
    loadTransactionsForType(value);
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

      // Refresh current type and update its count
      await loadTransactionsForType(selectedTxnType);
      await loadTypeCount(selectedTxnType);
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

      // Update count for this specific type
      await loadTypeCount(txnType);

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

  // Determine which group a transaction type belongs to
  const getTypeGroup = (type: string): string => {
    // Find the Data Source for this transaction type
    const typeInfo = TRANSACTION_TYPES_INFO.find(t => t.name === type);
    if (typeInfo?.dataSourceId) {
      // Find the Data Source name
      const ds = dataSources.find(d => 
        (d.DatasourceId || d.DataSourceId) === typeInfo.dataSourceId
      );
      if (ds) {
        return ds.DatasourceName || ds.DataSourceName || 'Unknown';
      }
    }
    // Fallback to old logic if Data Source not found
    const firstChar = type.charAt(0);
    return firstChar === firstChar.toLowerCase() ? 'BFS Online' : 'Paradigm BigTools';
  };

  // Filter types by search term and Data Source
  const filteredTypes = useMemo(() => {
    let types = transactionTypes;
    
    // Filter by Data Source
    if (selectedDataSourceId !== "all") {
      types = types.filter((type) => {
        const typeInfo = TRANSACTION_TYPES_INFO.find(t => t.name === type);
        return typeInfo?.dataSourceId === selectedDataSourceId;
      });
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      types = types.filter((type) =>
        type.toLowerCase().includes(lower),
      );
    }
    
    // Filter out types with 0 count - only show types with data
    types = types.filter((type) => {
      const count = typeCounts[type];
      // Show types that are still loading (undefined) or have count > 0
      return count === undefined || count > 0;
    });
    
    return types;
  }, [searchTerm, transactionTypes, selectedDataSourceId, typeCounts]);
  
  // Sort filtered types based on sort mode
  const sortedFilteredTypes = useMemo(() => {
    return [...filteredTypes].sort((a, b) => {
      const countA = typeCounts[a] ?? -1; // Use -1 for unloaded counts so they sort to end
      const countB = typeCounts[b] ?? -1;
      
      switch (sortMode) {
        case 'name-asc':
          return a.localeCompare(b);
        case 'name-desc':
          return b.localeCompare(a);
        case 'count-desc':
          // Put unloaded (-1) at the end
          if (countA === -1 && countB === -1) return a.localeCompare(b);
          if (countA === -1) return 1;
          if (countB === -1) return -1;
          return countB - countA;
        case 'count-asc':
          // Put unloaded (-1) at the end
          if (countA === -1 && countB === -1) return a.localeCompare(b);
          if (countA === -1) return 1;
          if (countB === -1) return -1;
          return countA - countB;
        default:
          return 0;
      }
    });
  }, [filteredTypes, typeCounts, sortMode]);
  
  // Auto-switch to first available type if current type is filtered out (has 0 count)
  useEffect(() => {
    if (selectedTxnType && sortedFilteredTypes.length > 0) {
      // Check if current type is still in the filtered list
      const isCurrentTypeAvailable = sortedFilteredTypes.includes(selectedTxnType);
      
      if (!isCurrentTypeAvailable) {
        // Current type was filtered out (has 0 count), switch to first available
        const firstAvailableType = sortedFilteredTypes[0];
        console.log(`⚠️ Current type "${selectedTxnType}" has 0 transactions, switching to "${firstAvailableType}"`);
        setSelectedTxnType(firstAvailableType);
      }
    }
  }, [selectedTxnType, sortedFilteredTypes]);
  
  // Group types by their group
  const groupedTypes = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    sortedFilteredTypes.forEach(type => {
      const group = getTypeGroup(type);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(type);
    });
    
    return groups;
  }, [sortedFilteredTypes, dataSources]);

  // Get group names in a consistent order
  const groupNames = useMemo(() => {
    return Object.keys(groupedTypes).sort();
  }, [groupedTypes]);

  // Calculate which groups are open (all groups except closed ones)
  const openGroups = useMemo(() => {
    return groupNames.filter(name => !closedGroups.has(name));
  }, [groupNames, closedGroups]);

  // Show all Data Sources that have at least one transaction type defined
  const filteredDataSources = useMemo(() => {
    const filtered = dataSources.filter((ds) => {
      const dsId = ds.DatasourceId || ds.DataSourceId;
      // Check if this Data Source has at least one transaction type
      return transactionTypes.some((type) => {
        const typeInfo = TRANSACTION_TYPES_INFO.find(t => t.name === type);
        return typeInfo?.dataSourceId === dsId;
      });
    });
    
    console.log(`📊 Filtered Data Sources (${filtered.length}):`, filtered.map(ds => ({
      id: ds.DatasourceId || ds.DataSourceId,
      name: ds.DatasourceName || ds.DataSourceName,
      typeCount: transactionTypes.filter(type => {
        const typeInfo = TRANSACTION_TYPES_INFO.find(t => t.name === type);
        return typeInfo?.dataSourceId === (ds.DatasourceId || ds.DataSourceId);
      }).length
    })));
    
    return filtered;
  }, [dataSources, transactionTypes, typeCounts]);

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

      if (colConfig.key === "TxnType") {
        return {
          key: "TxnType",
          header: "Type",
          render: (row: Transaction) => {
            const txnType = row.TxnType || "-";
            return (
              <div className="max-w-[120px] md:max-w-[150px]">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {formatTransactionType(txnType)}
                </Badge>
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

      if (colConfig.key === "UpdateTime") {
        return {
          key: "UpdateTime",
          header: "Updated",
          render: (row: Transaction) => {
            if (!row.UpdateTime)
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            return (
              <span className="whitespace-nowrap text-xs md:text-sm">
                {new Date(row.UpdateTime).toLocaleDateString()}
              </span>
            );
          },
        };
      }

      if (colConfig.key === "TenantId") {
        return {
          key: "TenantId",
          header: "Tenant ID",
          render: (row: Transaction) => {
            const tenantId = getNestedValue(row, "TenantId") || getNestedValue(row, "Txn.tenantId");
            if (!tenantId)
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            return (
              <div className="max-w-[120px] md:max-w-[150px]">
                <code
                  className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block"
                  title={tenantId}
                >
                  {tenantId}
                </code>
              </div>
            );
          },
        };
      }

      if (colConfig.key === "_ts") {
        return {
          key: "_ts",
          header: "Timestamp",
          render: (row: Transaction) => {
            if (!row._ts)
              return (
                <span className="text-xs md:text-sm text-muted-foreground">
                  -
                </span>
              );
            // _ts is Unix timestamp in seconds
            return (
              <span className="whitespace-nowrap text-xs md:text-sm tabular-nums">
                {new Date(row._ts * 1000).toLocaleString()}
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
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[320px_1fr] gap-6 mb-3">
            {/* Left: Transaction Types Header - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <h3 className="text-base md:text-lg">
                Transaction Types
              </h3>
              <Badge variant="secondary">
                {formatNumber(filteredTypes.length)}
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
                    {/* Dynamic Data Source Groups */}
                    {groupNames.map((groupName, index) => (
                      groupedTypes[groupName].length > 0 && (
                        <div key={groupName}>
                          <div className={`px-2 py-1.5 text-xs font-semibold text-muted-foreground ${index > 0 ? 'border-t mt-1 pt-2' : ''}`}>
                            {groupName}
                          </div>
                          {groupedTypes[groupName].map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatTransactionType(type)} ({formatNumber(typeCounts[type] || 0)})
                            </SelectItem>
                          ))}
                        </div>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Desktop type display */}
                <div className="hidden md:flex items-center gap-2" data-tour-id="transaction-type-selector">
                  <h3 className="text-base md:text-lg">
                    {formatTransactionType(selectedTxnType)}
                  </h3>
                  <Badge variant="secondary">
                    {formatNumber(transactions.length)}
                  </Badge>
                </div>

                {/* Desktop View - All buttons visible */}
                <div className="hidden md:flex gap-2">
                
                  
                  <div data-tour-id="tenant-selector">
                    <TenantSelector
                      tenants={tenants}
                      activeTenantId={activeTenantId}
                      onTenantChange={onTenantChange}
                      isSuperUser={userRole === "superuser"}
                    />
                  </div>
                  <div data-tour-id="column-selector-btn">
                    <ColumnSelector
                      columns={enrichedColumnConfigs}
                      onColumnsChange={setColumnConfigs}
                      availableFields={availableFields}
                      onReset={handleResetColumns}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    data-tour-id="refresh-data-btn"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                    {(userRole === "superuser" ||
                    userRole === "admin" ||
                    userRole === "developer") && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      data-tour-id="create-transaction-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  )}
                </div>

                {/* Mobile View - Dropdown Menu - Second row on mobile */}
                <div className="flex md:hidden items-center gap-2 justify-end ml-auto">
                  {/* Tenant Selector */}
                  <div data-tour-id="tenant-selector">
                    <TenantSelector
                      tenants={tenants}
                      activeTenantId={activeTenantId}
                      onTenantChange={onTenantChange}
                      isSuperUser={userRole === "superuser"}
                    />
                  </div>

                  {/* Dropdown Menu with other actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" data-tour-id="mobile-actions-menu">
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
                            data-tour-id="create-transaction-btn"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Transaction
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        data-tour-id="refresh-data-btn"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                      </DropdownMenuItem>
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
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            {/* Left Sidebar - Transaction Types List */}
            <div className="space-y-3 md:block hidden">
              {/* Data Source Filter */}
              <Select
                value={selectedDataSourceId}
                onValueChange={setSelectedDataSourceId}
              >
                <SelectTrigger className="w-full" data-tour-id="datasource-filter">
                  <SelectValue placeholder="Filter by Data Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data Sources</SelectItem>
                  {filteredDataSources.map((ds) => (
                    <SelectItem
                      key={ds.DatasourceId || ds.DataSourceId}
                      value={ds.DatasourceId || ds.DataSourceId || ''}
                    >
                      {ds.DatasourceName || ds.DataSourceName || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search Types and Sort */}
              <div className="flex gap-2">
                <div className="relative flex-1" data-tour-id="search-types">
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

              {/* Types List - Grouped by Source */}
              <Card className="border rounded-[10px]" data-tour-id="transaction-types-list">
                <ScrollArea className="h-[600px]">
                  {isLoadingCounts ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : sortedFilteredTypes.length > 0 ? (
                    <Accordion 
                      type="multiple" 
                      value={openGroups} 
                      onValueChange={(newOpenGroups) => {
                        // Calculate which groups are now closed
                        const newClosedGroups = new Set(
                          groupNames.filter(name => !newOpenGroups.includes(name))
                        );
                        setClosedGroups(newClosedGroups);
                      }} 
                      className="w-full"
                    >
                      {/* Dynamic Data Source Groups */}
                      {groupNames.map((groupName) => (
                        groupedTypes[groupName].length > 0 && (
                          <AccordionItem key={groupName} value={groupName} className="border-b-0">
                            <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm">
                              <div className="flex items-center gap-2">
                                <span>{groupName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {groupedTypes[groupName].length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="space-y-1 px-2 pb-2">
                                {groupedTypes[groupName].map((type) => {
                                  const count = typeCounts[type];
                                  const isCountLoaded = count !== undefined;
                                  const isActiveType = selectedTxnType === type;
                                  const isLoadingThisCount = !isCountLoaded && isActiveType && isLoadingType;
                                  
                                  return (
                                    <TransactionTypeButton
                                      key={type}
                                      type={type}
                                      isActive={isActiveType}
                                      count={count}
                                      isCountLoaded={isCountLoaded}
                                      isLoadingThisCount={isLoadingThisCount}
                                      onClick={() => handleTypeChange(type)}
                                    />
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      ))}
                    </Accordion>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No transaction types available
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

              {/* Empty State */}
              {transactions.length === 0 && !isLoadingType && (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions available
                </div>
              )}

              {/* Data Table */}
              {transactions.length > 0 && !isLoadingType && (
                <>
                  <div data-tour-id="transactions-table">
                    <DataTable
                      data={transactions}
                      columns={columns}
                      actions={renderActions}
                      actionsCompact={renderActionsCompact}
                      searchPlaceholder="Search transactions..."
                      searchTourId="search-transactions"
                      emptyMessage={`No ${selectedTxnType} transactions found`}
                    />
                  </div>

                  {/* Load More Button */}
                  {hasMoreData && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={loadMoreTransactions}
                        disabled={isLoadingMore}
                        className="min-w-[200px]"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isLoadingMore ? 'Loading...' : 'Load More (next 100)'}
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