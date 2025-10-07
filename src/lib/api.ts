// API Configuration
const API_BASE_URL =
  "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0";
const AUTH_HEADER_KEY = "X-BFS-Auth";
const AUTH_HEADER_VALUE =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// Set to true to use demo mode (no real API calls)
// Set to false to use real BFS API
const DEMO_MODE = false; // Always use real BFS API

// Export demo mode status for UI
export const isDemoMode = () => DEMO_MODE;

// Tenant Interface
export interface Tenant {
  TenantId: string;
  TenantName: string;
  CreateTime?: string;
  UpdateTime?: string;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

// Transaction Interface
export interface Transaction {
  TransactionId: string;
  TransactionName: string;
  RequestJSON?: any;
  ResponseJSON?: any;
  CreateTime?: string;
  UpdateTime?: string;
  _etag?: string;
}

// API Response Interface
export interface ApiResponse<T> {
  status: {
    code: number;
    message: string;
  };
  data: T;
}

// Generic headers builder
const getHeaders = (includeEtag?: string) => {
  const headers: Record<string, string> = {
    [AUTH_HEADER_KEY]: AUTH_HEADER_VALUE,
    "Content-Type": "application/json",
  };

  if (includeEtag) {
    headers["If-Match"] = includeEtag;
  }

  return headers;
};

// ==================== DEMO DATA ====================
// Import tenants from multiple sources (API import, JSON import, create tenant)
// These persist across component remounts when in demo mode
let demoTenants: Tenant[] = [];

let demoTransactions: Transaction[] = [
  {
    TransactionId: "txn-1",
    TransactionName: "Customer",
    _etag: '"demo-etag-1"',
    RequestJSON: { type: "Customer", action: "create" },
    ResponseJSON: { success: true, customerId: "12345" },
  },
  {
    TransactionId: "txn-2",
    TransactionName: "Customer Aging",
    _etag: '"demo-etag-2"',
    RequestJSON: { type: "CustomerAging", action: "query" },
    ResponseJSON: { aging: [{ period: "0-30", amount: 1000 }] },
  },
  {
    TransactionId: "txn-3",
    TransactionName: "Invoice",
    _etag: '"demo-etag-3"',
    RequestJSON: { type: "Invoice", action: "create" },
    ResponseJSON: { invoiceId: "INV-001" },
  },
  {
    TransactionId: "txn-4",
    TransactionName: "Payment",
    _etag: '"demo-etag-4"',
    RequestJSON: { type: "Payment", action: "process" },
    ResponseJSON: { paymentId: "PAY-001" },
  },
  {
    TransactionId: "txn-5",
    TransactionName: "Purchase Order",
    _etag: '"demo-etag-5"',
    RequestJSON: { type: "PO", action: "create" },
    ResponseJSON: { poId: "PO-001" },
  },
  {
    TransactionId: "txn-6",
    TransactionName: "Sales Order",
    _etag: '"demo-etag-6"',
    RequestJSON: { type: "SO", action: "create" },
    ResponseJSON: { soId: "SO-001" },
  },
  {
    TransactionId: "txn-7",
    TransactionName: "Vendor",
    _etag: '"demo-etag-7"',
    RequestJSON: { type: "Vendor", action: "create" },
    ResponseJSON: { vendorId: "VEN-001" },
  },
  {
    TransactionId: "txn-8",
    TransactionName: "Item Master",
    _etag: '"demo-etag-8"',
    RequestJSON: { type: "Item", action: "create" },
    ResponseJSON: { itemId: "ITEM-001" },
  },
  {
    TransactionId: "txn-9",
    TransactionName: "Journal Entry",
    _etag: '"demo-etag-9"',
    RequestJSON: { type: "Journal", action: "post" },
    ResponseJSON: { journalId: "JE-001" },
  },
  {
    TransactionId: "txn-10",
    TransactionName: "GL Account",
    _etag: '"demo-etag-10"',
    RequestJSON: { type: "GLAccount", action: "create" },
    ResponseJSON: { accountId: "1000" },
  },
  {
    TransactionId: "txn-11",
    TransactionName: "Budget",
    _etag: '"demo-etag-11"',
    RequestJSON: { type: "Budget", action: "create" },
    ResponseJSON: { budgetId: "BUD-001" },
  },
  {
    TransactionId: "txn-12",
    TransactionName: "Cash Receipt",
    _etag: '"demo-etag-12"',
    RequestJSON: { type: "CashReceipt", action: "record" },
    ResponseJSON: { receiptId: "CR-001" },
  },
  {
    TransactionId: "txn-13",
    TransactionName: "AP Voucher",
    _etag: '"demo-etag-13"',
    RequestJSON: { type: "APVoucher", action: "create" },
    ResponseJSON: { voucherId: "AP-001" },
  },
  {
    TransactionId: "txn-14",
    TransactionName: "Credit Memo",
    _etag: '"demo-etag-14"',
    RequestJSON: { type: "CreditMemo", action: "issue" },
    ResponseJSON: { memoId: "CM-001" },
  },
  {
    TransactionId: "txn-15",
    TransactionName: "Inventory Transfer",
    _etag: '"demo-etag-15"',
    RequestJSON: { type: "Transfer", action: "execute" },
    ResponseJSON: { transferId: "TRN-001" },
  },
  {
    TransactionId: "txn-16",
    TransactionName: "Fixed Asset",
    _etag: '"demo-etag-16"',
    RequestJSON: { type: "Asset", action: "register" },
    ResponseJSON: { assetId: "FA-001" },
  },
];

// ==================== TENANT API FUNCTIONS ====================

// User Story 1: Get all tenants
export async function getAllTenants(): Promise<Tenant[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...demoTenants];
  }

  try {
    console.log('🌐 Attempting to connect to BFS API...');
    
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      method: "GET",
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      // Intercept fetch errors (CORS, network) and throw custom error
      throw new Error('CORS_ERROR');
    });

    console.log('✅ Connected! Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`,
      );
    }

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    // Handle different response formats
    let tenants: Tenant[] = [];
    
    if (Array.isArray(data)) {
      tenants = data;
    } else if (data.data && Array.isArray(data.data.tenants)) {
      tenants = data.data.tenants;
    } else if (data.data && Array.isArray(data.data)) {
      tenants = data.data;
    } else if (Array.isArray(data.tenants)) {
      tenants = data.tenants;
    } else if (data.value && Array.isArray(data.value)) {
      tenants = data.value;
    }

    console.log('✅ Loaded', tenants.length, 'tenant(s) from API');
    return tenants;
  } catch (error: any) {
    // Don't log scary errors to console - just throw clean error
    if (error.message === 'CORS_ERROR') {
      throw new Error('CORS_BLOCKED');
    }
    throw error;
  }
}

// User Story 2: Create new tenant (POST TenantName, receive TenantID)
export async function createTenant(
  tenantName: string,
): Promise<Tenant> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTenant: Tenant = {
      TenantId: `tenant-${Date.now()}`,
      TenantName: tenantName,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    demoTenants.push(newTenant);
    return { ...newTenant };
  }

  try {
    // Generate a unique TenantId (client-side generation)
    // Format: tenant-<timestamp> (as per Postman collection)
    const tenantId = `tenant-${Date.now()}`;

    const response = await fetch(`${API_BASE_URL}/tenants`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        TenantId: tenantId,
        TenantName: tenantName,
      }),
    });

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message || "Failed to create tenant",
      );
    }

    const data: ApiResponse<Tenant> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating tenant:", error);
    throw error;
  }
}

// User Story 3: Delete tenant
export async function deleteTenant(
  tenantId: string,
  etag: string,
): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = demoTenants.findIndex(
      (t) => t.TenantId === tenantId,
    );
    if (index === -1) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    demoTenants.splice(index, 1);
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/tenants/${tenantId}`,
      {
        method: "DELETE",
        headers: getHeaders(etag),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message || "Failed to delete tenant",
      );
    }
  } catch (error) {
    console.error("Error deleting tenant:", error);
    throw error;
  }
}

// Update tenant (Edit functionality)
export async function updateTenant(
  tenantId: string,
  tenantName: string,
  etag: string,
): Promise<Tenant> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const tenant = demoTenants.find(
      (t) => t.TenantId === tenantId,
    );
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    tenant.TenantName = tenantName;
    tenant.UpdateTime = new Date().toISOString();
    tenant._etag = `"demo-etag-${Date.now()}"`;
    return { ...tenant };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/tenants/${tenantId}`,
      {
        method: "PUT",
        headers: getHeaders(etag),
        body: JSON.stringify({
          TenantId: tenantId,
          TenantName: tenantName,
        }),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message || "Failed to update tenant",
      );
    }

    const data: ApiResponse<Tenant> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating tenant:", error);
    throw error;
  }
}

// Get tenant by ID (for detail view)
export async function getTenantById(
  tenantId: string,
): Promise<Tenant> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const tenant = demoTenants.find(
      (t) => t.TenantId === tenantId,
    );
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    return { ...tenant };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/tenants/${tenantId}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message || "Failed to fetch tenant",
      );
    }

    const data: ApiResponse<Tenant> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
}

// ==================== TRANSACTION API FUNCTIONS ====================

// User Story 4: Get all transactions
export async function getAllTransactions(): Promise<
  Transaction[]
> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...demoTransactions];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message ||
          "Failed to fetch transactions",
      );
    }

    const data: ApiResponse<{ transactions: Transaction[] }> =
      await response.json();
    return data.data.transactions || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}

// User Story 5: Get transaction by ID
export async function getTransactionById(
  transactionId: string,
): Promise<Transaction> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const transaction = demoTransactions.find(
      (t) => t.TransactionId === transactionId,
    );
    if (!transaction) {
      throw new Error(
        `Transaction with ID ${transactionId} not found`,
      );
    }
    return { ...transaction };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message ||
          "Failed to fetch transaction",
      );
    }

    const data: ApiResponse<Transaction> =
      await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
}

// User Story 6: Create new transaction
export async function createTransaction(
  transactionName: string,
  requestJSON: any,
  responseJSON: any,
): Promise<Transaction> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTransaction: Transaction = {
      TransactionId: `txn-${Date.now()}`,
      TransactionName: transactionName,
      RequestJSON: requestJSON,
      ResponseJSON: responseJSON,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    demoTransactions.push(newTransaction);
    return { ...newTransaction };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          TransactionName: transactionName,
          RequestJSON: requestJSON,
          ResponseJSON: responseJSON,
        }),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message ||
          "Failed to create transaction",
      );
    }

    const data: ApiResponse<Transaction> =
      await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

// ==================== IMPORT HELPER FUNCTIONS ====================
// These functions allow importing bulk data in demo mode

// Import tenants from JSON (for TenantImportDialog)
export function importTenantsToDemo(tenants: Tenant[]): void {
  if (DEMO_MODE) {
    // Add imported tenants to demo data
    // Filter out duplicates by TenantId
    const existingIds = new Set(
      demoTenants.map((t) => t.TenantId),
    );
    const newTenants = tenants.filter(
      (t) => !existingIds.has(t.TenantId),
    );
    demoTenants.push(...newTenants);
  }
}