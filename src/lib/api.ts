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

// Transaction Interface - matches real API structure
export interface Transaction {
  TxnId?: string;
  TxnType: string;
  Txn: any; // Can be Customer, Invoice, etc - varies by type
  CreateTime?: string;
  UpdateTime?: string;
  _etag?: string;
  _rid?: string;
  _ts?: number;
  _self?: string;
  _attachments?: string;
}

// Model Schema Interface (from TxnType=ModelSchema)
export interface ModelSchema {
  id: string;
  model: string;
  version: number;
  state: string;
  semver: string;
  jsonSchema: any; // JSON Schema object (draft-2020-12)
  CreateTime: string;
  UpdateTime: string;
  _etag?: string;
  _rid?: string;
  _ts?: number;
  _self?: string;
  _attachments?: string;
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

// Demo transactions with proper structure
let demoTransactions: Transaction[] = [];

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

// Get all global Model Schemas (not tenant-specific)
export async function getAllModelSchemas(): Promise<ModelSchema[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return demo schema for Location
    return [
      {
        id: "Location:1",
        model: "Location",
        version: 1,
        state: "active",
        semver: "1.0.0",
        jsonSchema: {
          "$id": "https://yourco/schemas/Location/1",
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": "Location",
          "type": "object",
          "required": ["LocationId", "Name"],
          "properties": {
            "LocationId": { "type": "string" },
            "Name": { "type": "string" }
          }
        },
        CreateTime: new Date().toISOString(),
        UpdateTime: new Date().toISOString()
      }
    ];
  }

  try {
    const url = `${API_BASE_URL}/txns?TxnType=ModelSchema`;
    const headers = getHeaders();
    
    console.log('🔍 Fetching global ModelSchema from BFS API');
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      throw new Error('CORS_ERROR');
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      // Check if it's "Unsupported TxnType" - treat as empty result, not error
      if (errorData.status?.message === 'Unsupported TxnType' || errorData.status?.message === 'Unsupported txn_type') {
        console.log(`ℹ️ ModelSchema not supported by API yet`);
        return [];
      }
      
      throw new Error(errorData.status?.message || `API returned ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📦 Raw response (first 500 chars):', responseText.substring(0, 500));
    
    const responseData = JSON.parse(responseText);
    
    // Handle BFS API response format: { status: {...}, data: { TxnType: "ModelSchema", Txns: [...] } }
    let schemas: ModelSchema[] = [];
    
    if (responseData.status && responseData.data && responseData.data.Txns) {
      schemas = responseData.data.Txns;
      if (schemas.length > 0) {
        console.log(`✅ ModelSchema API enabled! Loaded ${schemas.length} global schema(s):`);
        schemas.forEach(s => {
          console.log(`   📋 ${s.model} v${s.version} (${s.semver}) - ${s.state}`);
        });
      } else {
        console.log('ℹ️ ModelSchema API is enabled but returned 0 schemas');
      }
    }
    
    return schemas;
  } catch (error: any) {
    if (error.message === 'CORS_ERROR') {
      console.log(`⚠️ CORS error fetching global model schemas`);
      return [];
    }
    console.error(`❌ Error fetching global model schemas:`, error);
    return [];
  }
}

// Get Model Schemas for a specific tenant
export async function getModelSchemasForTenant(tenantId: string): Promise<ModelSchema[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return demo schema for Location
    return [
      {
        id: "Location:1",
        model: "Location",
        version: 1,
        state: "active",
        semver: "1.0.0",
        jsonSchema: {
          "$id": "https://yourco/schemas/Location/1",
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": "Location",
          "type": "object",
          "required": ["LocationId", "Name"],
          "properties": {
            "LocationId": { "type": "string" },
            "Name": { "type": "string" }
          }
        },
        CreateTime: new Date().toISOString(),
        UpdateTime: new Date().toISOString()
      }
    ];
  }

  try {
    // Try tenant-specific endpoint first
    const url = `${API_BASE_URL}/tenants/${encodeURIComponent(tenantId)}/txns?TxnType=ModelSchema`;
    const headers = getHeaders();
    
    console.log(`🔍 Fetching ModelSchema for tenant: ${tenantId}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      throw new Error('CORS_ERROR');
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If tenant-specific endpoint doesn't work, try global endpoint with TenantId
        console.log(`ℹ️ Tenant-specific endpoint not found, trying global endpoint`);
        return getModelSchemasByTenantGlobal(tenantId);
      }
      
      // Check if it's "Unsupported TxnType" - treat as empty result, not error
      if (errorData.status?.message === 'Unsupported TxnType' || errorData.status?.message === 'Unsupported txn_type') {
        console.log(`ℹ️ ModelSchema not supported for tenant ${tenantId}`);
        return [];
      }
      
      throw new Error(errorData.status?.message || `API returned ${response.status}`);
    }

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);
    
    // Handle BFS API response format: { status: {...}, data: { TxnType: "ModelSchema", Txns: [...] } }
    let schemas: ModelSchema[] = [];
    
    if (responseData.status && responseData.data && responseData.data.Txns) {
      schemas = responseData.data.Txns;
      if (schemas.length > 0) {
        console.log(`✅ Loaded ${schemas.length} schema(s) for tenant ${tenantId}:`);
        schemas.forEach(s => {
          console.log(`   📋 ${s.model} v${s.version} (${s.semver}) - ${s.state}`);
        });
      }
    }
    
    return schemas;
  } catch (error: any) {
    if (error.message === 'CORS_ERROR') {
      console.log(`⚠️ CORS error fetching model schemas for tenant ${tenantId}`);
      return [];
    }
    console.error(`❌ Error fetching model schemas for tenant ${tenantId}:`, error);
    return [];
  }
}

// Try global endpoint with TenantId parameter
async function getModelSchemasByTenantGlobal(tenantId: string): Promise<ModelSchema[]> {
  try {
    const url = `${API_BASE_URL}/txns?TxnType=ModelSchema&TenantId=${encodeURIComponent(tenantId)}`;
    const headers = getHeaders();
    
    console.log(`🔍 Trying global endpoint with TenantId parameter`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        return [];
      }
      
      // Silently return empty for unsupported types
      if (errorData.status?.message === 'Unsupported TxnType' || errorData.status?.message === 'Unsupported txn_type') {
        return [];
      }
      
      return [];
    }

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);
    
    let schemas: ModelSchema[] = [];
    
    if (responseData.status && responseData.data && responseData.data.Txns) {
      schemas = responseData.data.Txns;
      if (schemas.length > 0) {
        console.log(`✅ Loaded ${schemas.length} schema(s) from global endpoint for tenant ${tenantId}`);
      }
    }
    
    return schemas;
  } catch (error: any) {
    return [];
  }
}

// ==================== TRANSACTION API FUNCTIONS ====================

// Transaction types available in the system
export const TRANSACTION_TYPES = [
  'Customer',
  'Customer Aging',
  'Location',
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
] as const;

// User Story 4: Get transactions by type (API requires TxnType parameter)
export async function getTransactionsByType(txnType: string): Promise<Transaction[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return demoTransactions.filter(t => t.TxnType === txnType);
  }

  try {
    const url = `${API_BASE_URL}/txns?TxnType=${encodeURIComponent(txnType)}`;
    const headers = getHeaders();
    
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      // Silently handle CORS errors - they're expected for unsupported transaction types
      throw new Error('CORS_ERROR');
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      // Check if it's "Unsupported TxnType" - treat as empty result, not error
      if (errorData.status?.message === 'Unsupported TxnType' || errorData.status?.message === 'Unsupported txn_type') {
        // Silently return empty array for unsupported types - no console logs
        return []; 
      }
      
      console.error('❌ Error response body:', errorText);
      throw new Error(errorData.status?.message || `API returned ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📦 Response body (raw, first 2000 chars):', responseText.substring(0, 2000));
    
    const responseData = JSON.parse(responseText);
    console.log('📊 Parsed response type:', typeof responseData);
    console.log('📊 Is array?', Array.isArray(responseData));
    console.log('📊 Response keys:', Object.keys(responseData));
    console.log('📊 Full parsed response:', responseData);
    
    // Handle BFS API response format: { status: {...}, data: { TxnType: "...", Txns: [...] } }
    let txns: Transaction[] = [];
    
    if (responseData.status && responseData.data) {
      console.log('✅ Format: { status, data }');
      console.log('  status:', responseData.status);
      console.log('  data keys:', Object.keys(responseData.data));
      
      // BFS API returns: data.Txns array
      if (responseData.data.Txns && Array.isArray(responseData.data.Txns)) {
        console.log('✅ Found data.Txns array with', responseData.data.Txns.length, 'items');
        const rawTxns = responseData.data.Txns;
        const returnedTxnType = responseData.data.TxnType || txnType;
        
        // Transform each raw transaction to our Transaction format
        txns = rawTxns.map((rawTxn: any) => ({
          TxnId: rawTxn.id || rawTxn.CustomerId || rawTxn.InvoiceId || `txn-${Date.now()}`,
          TxnType: returnedTxnType,
          Txn: rawTxn,
          CreateTime: rawTxn.CreateTime,
          UpdateTime: rawTxn.UpdateTime,
          _etag: rawTxn._etag,
          _rid: rawTxn._rid,
          _ts: rawTxn._ts,
          _self: rawTxn._self,
          _attachments: rawTxn._attachments,
        }));
        
        console.log(`✅ Transformed ${txns.length} transactions to internal format`);
      }
      // Fallback: data is array directly
      else if (Array.isArray(responseData.data)) {
        console.log('✅ data is array directly');
        txns = responseData.data;
      }
      else {
        console.log('  data structure:', responseData.data);
      }
    }
    // Direct array format
    else if (Array.isArray(responseData)) {
      console.log('✅ Format: Direct array');
      txns = responseData;
    }

    console.log(`📊 Final result: ${txns.length} transaction(s) for type: ${txnType}`);
    if (txns.length > 0) {
      console.log('📋 First transaction:', txns[0]);
    }
    return txns;
  } catch (error: any) {
    // Silently handle CORS errors
    if (error.message === 'CORS_ERROR') {
      throw new Error('CORS_BLOCKED');
    }
    throw error;
  }
}

// Get all transactions across all types (fetches each type separately)
export async function getAllTransactions(): Promise<Transaction[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...demoTransactions];
  }

  // API requires TxnType parameter, so we need to fetch for each type
  // For now, return empty array and let user select specific types
  return [];
}

// User Story 5: Get transaction by ID
export async function getTransactionById(txnId: string): Promise<Transaction> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const transaction = demoTransactions.find((t) => t.TxnId === txnId);
    if (!transaction) {
      throw new Error(`Transaction with ID ${txnId} not found`);
    }
    return { ...transaction };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/txns/${txnId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(errorData.status?.message || "Failed to fetch transaction");
    }

    const data: ApiResponse<Transaction> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
}

// User Story 6: Create new transaction
export async function createTransaction(
  txnType: string,
  txnData: any,
): Promise<Transaction> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTransaction: Transaction = {
      TxnId: `txn-${Date.now()}`,
      TxnType: txnType,
      Txn: txnData,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    demoTransactions.push(newTransaction);
    return { ...newTransaction };
  }

  try {
    const url = `${API_BASE_URL}/txns`;
    const headers = getHeaders();
    const requestBody = {
      TxnType: txnType,
      Txn: txnData,
    };
    
    console.log('🌐 POST Transaction Request:');
    console.log('  URL:', url);
    console.log('  Headers:', headers);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Response received:');
    console.log('  Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to create transaction");
    }

    const responseText = await response.text();
    console.log('📦 Response body:', responseText);
    
    const data: ApiResponse<Transaction> = JSON.parse(responseText);
    console.log('✅ Created transaction:', data.data);
    
    return data.data;
  } catch (error) {
    console.error("❌ createTransaction error:", error);
    throw error;
  }
}

// Update transaction (Edit functionality)
export async function updateTransaction(
  txnId: string,
  txnType: string,
  txnData: any,
  etag: string,
): Promise<Transaction> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const transaction = demoTransactions.find((t) => t.TxnId === txnId);
    if (!transaction) {
      throw new Error(`Transaction with ID ${txnId} not found`);
    }
    transaction.TxnType = txnType;
    transaction.Txn = txnData;
    transaction.UpdateTime = new Date().toISOString();
    transaction._etag = `"demo-etag-${Date.now()}"`;
    return { ...transaction };
  }

  try {
    console.log('🌐 PUT Transaction Request:');
    console.log('  URL:', `${API_BASE_URL}/txns/${txnId}`);
    console.log('  ETag:', etag);
    
    const response = await fetch(`${API_BASE_URL}/txns/${txnId}`, {
      method: "PUT",
      headers: getHeaders(etag),
      body: JSON.stringify({
        TxnType: txnType,
        Txn: txnData,
      }),
    }).catch((fetchError) => {
      console.error('❌ Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('📡 Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to update transaction");
    }

    const responseText = await response.text();
    console.log('✅ Updated successfully');
    
    const data: ApiResponse<Transaction> = JSON.parse(responseText);
    return data.data;
  } catch (error) {
    console.error("❌ updateTransaction error:", error);
    throw error;
  }
}

// Delete transaction
export async function deleteTransaction(
  txnId: string,
  etag: string,
): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = demoTransactions.findIndex((t) => t.TxnId === txnId);
    if (index === -1) {
      throw new Error(`Transaction with ID ${txnId} not found`);
    }
    demoTransactions.splice(index, 1);
    return;
  }

  try {
    console.log('🌐 DELETE Transaction Request:');
    console.log('  URL:', `${API_BASE_URL}/txns/${txnId}`);
    console.log('  ETag:', etag);
    
    const response = await fetch(`${API_BASE_URL}/txns/${txnId}`, {
      method: "DELETE",
      headers: getHeaders(etag),
    }).catch((fetchError) => {
      console.error('❌ Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('📡 Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to delete transaction");
    }

    console.log('✅ Deleted successfully');
  } catch (error) {
    console.error("❌ deleteTransaction error:", error);
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