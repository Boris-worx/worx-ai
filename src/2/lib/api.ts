// API Configuration
// In development, use Vite proxy to avoid CORS issues
// In production, use direct API URL

// Detect development mode by checking if running on localhost
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '' ||
   window.location.port === '5173');

const API_BASE_URL = isDevelopment
  ? "/api"  // Use Vite proxy in development
  : "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0";

const AUTH_HEADER_KEY = "X-BFS-Auth";
const AUTH_HEADER_VALUE =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// Set to true to use demo mode (no real API calls)
// Set to false to use real BFS API
const DEMO_MODE = false; // Always use real BFS API

console.log('🔧 API Configuration:');
console.log('  Environment:', isDevelopment ? 'Development' : 'Production');
console.log('  Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
console.log('  Port:', typeof window !== 'undefined' ? window.location.port : 'N/A');
console.log('  API Base URL:', API_BASE_URL);
console.log('  Demo Mode:', DEMO_MODE);
console.log('  Should use proxy:', API_BASE_URL.startsWith('/api'));

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

// DataSource Interface
export interface DataSource {
  DataSourceId?: string;
  DatasourceId?: string;
  DataSourceName?: string;
  DatasourceName?: string;
  DatasourceType?: string | null;
  Type?: string;
  TenantId?: string;
  ConnectionString?: string;
  Description?: string;
  Status?: string;
  CreateTime?: string;
  UpdateTime?: string;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
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

// Helper function to safely fetch and parse JSON responses
async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  console.log(`🌐 Fetching: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    credentials: 'omit',
  }).catch((fetchError) => {
    console.error('❌ Network error:', fetchError);
    console.error('   URL:', url);
    console.error('   Using proxy:', url.startsWith('/api'));
    throw new Error('CORS_ERROR');
  });

  console.log(`📡 Response: ${response.status} ${response.statusText}`);
  console.log(`   Content-Type: ${response.headers.get('Content-Type')}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText.substring(0, 200));
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Check if response is HTML (error page) instead of JSON
  if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
    console.error('❌ Received HTML instead of JSON!');
    console.error('   Response preview:', responseText.substring(0, 200));
    console.error('   This means:');
    console.error('   1. Request may have bypassed Vite proxy');
    console.error('   2. Server returned an error page');
    console.error('   3. CORS is blocking the request');
    throw new Error('Server returned HTML instead of JSON. Ensure Vite dev server is running and proxy is configured.');
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    console.error('   Response preview:', responseText.substring(0, 200));
    throw new Error(`Failed to parse JSON response: ${parseError}`);
  }
}

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
    const url = `${API_BASE_URL}/tenants`;
    console.log('🚀 Fetching tenants from:', url);
    
    const data = await safeFetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

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

    console.log('Loaded', tenants.length, 'tenant(s) from API');
    return tenants;
  } catch (error: any) {
    // Don't log scary errors to console - just throw clean error
    if (error.message === 'CORS_ERROR') {
      throw new Error('CORS_BLOCKED');
    }
    throw error;
  }
}

// User Story 2: Create new tenant (POST TenantId and TenantName)
export async function createTenant(
  tenantId: string,
  tenantName: string,
): Promise<Tenant> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTenant: Tenant = {
      TenantId: tenantId,
      TenantName: tenantName,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    demoTenants.push(newTenant);
    return { ...newTenant };
  }

  try {
    // Use the manually provided TenantId
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
      const rawSchemas = responseData.data.Txns;
      
      // Transform schemas: extract data from Transaction wrapper if needed
      schemas = rawSchemas.map((rawSchema: any) => {
        try {
          // If wrapped in Transaction format (has TxnId, TxnType, Txn)
          if (rawSchema.TxnId && rawSchema.Txn) {
            return {
              ...rawSchema.Txn,
              id: rawSchema.TxnId, // Use full TxnId (e.g., "ModelSchema:Location:1")
              CreateTime: rawSchema.CreateTime || rawSchema.Txn.CreateTime,
              UpdateTime: rawSchema.UpdateTime || rawSchema.Txn.UpdateTime,
              _etag: rawSchema._etag,
              _rid: rawSchema._rid,
              _ts: rawSchema._ts,
              _self: rawSchema._self,
              _attachments: rawSchema._attachments,
            };
          }
          // If already in ModelSchema format, ensure id exists
          return {
            ...rawSchema,
            id: rawSchema.id || `${rawSchema.model}:${rawSchema.version}`,
          };
        } catch (transformError) {
          console.error('⚠️ Error transforming schema:', transformError, rawSchema);
          // Return a fallback schema object
          return {
            id: 'error',
            model: 'Error',
            version: 0,
            state: 'error',
            semver: '0.0.0',
            jsonSchema: {},
            CreateTime: new Date().toISOString(),
            UpdateTime: new Date().toISOString(),
          };
        }
      }).filter(s => s.id !== 'error'); // Filter out error schemas
      
      if (schemas.length > 0) {
        console.log(`✅ ModelSchema API enabled! Loaded ${schemas.length} global schema(s):`);
        schemas.forEach(s => {
          try {
            console.log(`   📋 ${s.model || 'N/A'} v${s.version || 'N/A'} (${s.semver || 'N/A'}) - ${s.state || 'N/A'} [ID: ${s.id || 'N/A'}]`);
          } catch (logError) {
            console.log(`   ⚠️ Error logging schema:`, s);
          }
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
      const rawSchemas = responseData.data.Txns;
      
      // Transform schemas: extract data from Transaction wrapper if needed
      schemas = rawSchemas.map((rawSchema: any) => {
        // If wrapped in Transaction format (has TxnId, TxnType, Txn)
        if (rawSchema.TxnId && rawSchema.Txn) {
          return {
            ...rawSchema.Txn,
            id: rawSchema.TxnId, // Use full TxnId (e.g., "ModelSchema:Location:1")
            CreateTime: rawSchema.CreateTime || rawSchema.Txn.CreateTime,
            UpdateTime: rawSchema.UpdateTime || rawSchema.Txn.UpdateTime,
            _etag: rawSchema._etag,
            _rid: rawSchema._rid,
            _ts: rawSchema._ts,
            _self: rawSchema._self,
            _attachments: rawSchema._attachments,
          };
        }
        // If already in ModelSchema format, ensure id exists
        return {
          ...rawSchema,
          id: rawSchema.id || `${rawSchema.model}:${rawSchema.version}`,
        };
      });
      
      if (schemas.length > 0) {
        console.log(`✅ Loaded ${schemas.length} schema(s) for tenant ${tenantId}:`);
        schemas.forEach(s => {
          console.log(`   📋 ${s.model} v${s.version} (${s.semver}) - ${s.state} [ID: ${s.id}]`);
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
      const rawSchemas = responseData.data.Txns;
      
      // Transform schemas: extract data from Transaction wrapper if needed
      schemas = rawSchemas.map((rawSchema: any) => {
        // If wrapped in Transaction format (has TxnId, TxnType, Txn)
        if (rawSchema.TxnId && rawSchema.Txn) {
          return {
            ...rawSchema.Txn,
            id: rawSchema.TxnId, // Use full TxnId
            CreateTime: rawSchema.CreateTime || rawSchema.Txn.CreateTime,
            UpdateTime: rawSchema.UpdateTime || rawSchema.Txn.UpdateTime,
            _etag: rawSchema._etag,
            _rid: rawSchema._rid,
            _ts: rawSchema._ts,
            _self: rawSchema._self,
            _attachments: rawSchema._attachments,
          };
        }
        // If already in ModelSchema format, ensure id exists
        return {
          ...rawSchema,
          id: rawSchema.id || `${rawSchema.model}:${rawSchema.version}`,
        };
      });
      
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
  'Quote',
  'QuoteDetails',
  'QuotePack',
  'QuotePackOrder',
  'ReasonCode',
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

// Pagination response interface
export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  continuationToken: string | null;
  hasMore: boolean;
}

// User Story 4: Get transactions by type (API requires TxnType parameter)
// Now supports pagination with continuation token
export async function getTransactionsByType(
  txnType: string, 
  continuationToken?: string
): Promise<PaginatedTransactionsResponse> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      transactions: demoTransactions.filter(t => t.TxnType === txnType),
      continuationToken: null,
      hasMore: false
    };
  }

  try {
    let url = `${API_BASE_URL}/txns?TxnType=${encodeURIComponent(txnType)}`;
    
    // Add continuation token if provided
    if (continuationToken) {
      url += `&continuationToken=${encodeURIComponent(continuationToken)}`;
    }
    
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
      
      // Check if it's "Unsupported TxnType" or "No Cosmos container configured" - treat as empty result, not error
      if (errorData.status?.message === 'Unsupported TxnType' || 
          errorData.status?.message === 'Unsupported txn_type' ||
          errorData.status?.message?.includes('No Cosmos container configured')) {
        // Silently return empty array for unsupported types - no console logs
        return {
          transactions: [],
          continuationToken: null,
          hasMore: false
        };
      }
      
      console.error('Error response body:', errorText);
      throw new Error(errorData.status?.message || `API returned ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Response body (raw, first 2000 chars):', responseText.substring(0, 2000));
    
    const responseData = JSON.parse(responseText);
    console.log('Parsed response type:', typeof responseData);
    console.log('Is array?', Array.isArray(responseData));
    console.log('Response keys:', Object.keys(responseData));
    
    // Extract continuation token from response (check various possible locations)
    let nextToken: string | null = null;
    if (responseData.continuationToken) {
      nextToken = responseData.continuationToken;
    } else if (responseData.data?.continuationToken) {
      nextToken = responseData.data.continuationToken;
    } else if (responseData.data?.ContinuationToken) {
      nextToken = responseData.data.ContinuationToken;
    }
    
    if (nextToken) {
      console.log('📄 Found continuation token, more data available');
    }
    
    // Handle BFS API response format: { status: {...}, data: { TxnType: "...", Txns: [...] } }
    let txns: Transaction[] = [];
    
    if (responseData.status && responseData.data) {
      console.log('Format: { status, data }');
      console.log('  status:', responseData.status);
      console.log('  data keys:', Object.keys(responseData.data));
      
      // BFS API returns: data.Txns array
      if (responseData.data.Txns && Array.isArray(responseData.data.Txns)) {
        console.log('Found data.Txns array with', responseData.data.Txns.length, 'items');
        const rawTxns = responseData.data.Txns;
        const returnedTxnType = responseData.data.TxnType || txnType;
        
        // Transform each raw transaction to our Transaction format
        txns = rawTxns.map((rawTxn: any) => {
          // Get the entity ID from the transaction based on type
          let entityId = rawTxn.id;
          
          // Check for type-specific ID fields
          if (!entityId) {
            if (rawTxn.CustomerId) entityId = rawTxn.CustomerId;
            else if (rawTxn.LocationId) entityId = rawTxn.LocationId;
            else if (rawTxn.quoteId) entityId = rawTxn.quoteId;
            else if (rawTxn.reasonCodeId) entityId = rawTxn.reasonCodeId;
            else if (rawTxn.InvoiceId) entityId = rawTxn.InvoiceId;
            else entityId = `txn-${Date.now()}`;
          }
          
          // Store the full TxnId in format "TxnType:EntityId" for API compatibility
          const fullTxnId = `${returnedTxnType}:${entityId}`;
          
          return {
            TxnId: fullTxnId,
            TxnType: returnedTxnType,
            Txn: rawTxn,
            CreateTime: rawTxn.createTime || rawTxn.CreateTime,
            UpdateTime: rawTxn.updateTime || rawTxn.UpdateTime,
            _etag: rawTxn._etag,
            _rid: rawTxn._rid,
            _ts: rawTxn._ts,
            _self: rawTxn._self,
            _attachments: rawTxn._attachments,
          };
        });
        
        console.log(`Transformed ${txns.length} transactions to internal format`);
      }
      // Fallback: data is array directly
      else if (Array.isArray(responseData.data)) {
        console.log('data is array directly');
        txns = responseData.data;
      }
      else {
        console.log('  data structure:', responseData.data);
      }
    }
    // Direct array format
    else if (Array.isArray(responseData)) {
      console.log('Format: Direct array');
      txns = responseData;
    }

    console.log(`Final result: ${txns.length} transaction(s) for type: ${txnType}`);
    if (txns.length > 0) {
      console.log('First transaction:', txns[0]);
    }
    
    return {
      transactions: txns,
      continuationToken: nextToken,
      hasMore: nextToken !== null
    };
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
    
    console.log('POST Transaction Request:');
    console.log('  URL:', url);
    console.log('  Headers:', headers);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Response received:');
    console.log('  Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to create transaction");
    }

    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    const data: ApiResponse<Transaction> = JSON.parse(responseText);
    console.log('Created transaction:', data.data);
    
    return data.data;
  } catch (error) {
    console.error("createTransaction error:", error);
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
    console.log('PUT Transaction Request:');
    console.log('  TxnId:', txnId);
    console.log('  URL:', `${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`);
    console.log('  ETag:', etag);
    
    const response = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`, {
      method: "PUT",
      headers: getHeaders(etag),
      body: JSON.stringify({
        TxnType: txnType,
        Txn: txnData,
      }),
    }).catch((fetchError) => {
      console.error('Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to update transaction");
    }

    const responseText = await response.text();
    console.log('Updated successfully');
    
    const data: ApiResponse<Transaction> = JSON.parse(responseText);
    return data.data;
  } catch (error) {
    console.error("updateTransaction error:", error);
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
    console.log('DELETE Transaction Request:');
    console.log('  TxnId:', txnId);
    console.log('  URL:', `${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`);
    console.log('  ETag:', etag);
    
    const response = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`, {
      method: "DELETE",
      headers: getHeaders(etag),
    }).catch((fetchError) => {
      console.error('Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to delete transaction");
    }

    console.log('Deleted successfully');
  } catch (error) {
    console.error("deleteTransaction error:", error);
    throw error;
  }
}

// ==================== DATA SOURCE API FUNCTIONS ====================

// Get all data sources (optionally filtered by TenantId)
export async function getAllDataSources(tenantId?: string): Promise<DataSource[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [];
  }

  try {
    // Build URL with optional TenantId filter
    let url = `${API_BASE_URL}/datasources`;
    
    if (tenantId) {
      // Add filter for TenantId as per API format: ?Filters={"TenantId":"BFS"}
      const filters = JSON.stringify({ TenantId: tenantId });
      url += `?Filters=${encodeURIComponent(filters)}`;
      console.log(`🚀 Attempting to fetch data sources for tenant ${tenantId}...`);
    } else {
      console.log('🚀 Attempting to fetch all data sources...');
    }
    
    console.log('   Full URL:', url);
    console.log('   Is localhost?', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
    console.log('   Using proxy?', url.startsWith('/api'));
    
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      console.error('❌ Fetch failed:', fetchError);
      console.error('   URL was:', url);
      console.error('   This is a', url.startsWith('/api') ? 'PROXY request (should work!)' : 'DIRECT request (CORS will block)');
      throw new Error('CORS_ERROR');
    });

    console.log('Connected! Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`,
      );
    }

    const responseText = await response.text();
    console.log('📦 Raw response (first 1000 chars):', responseText.substring(0, 1000));
    const data = JSON.parse(responseText);
    console.log('📋 Response structure:', {
      isArray: Array.isArray(data),
      keys: Object.keys(data),
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : null,
    });

    // Handle different response formats
    let dataSources: DataSource[] = [];
    
    if (Array.isArray(data)) {
      console.log('✅ Format: Direct array');
      dataSources = data;
    } else if (data.data && Array.isArray(data.data.datasources)) {
      console.log('✅ Format: data.datasources array');
      dataSources = data.data.datasources;
    } else if (data.data && Array.isArray(data.data)) {
      console.log('✅ Format: data array');
      dataSources = data.data;
    } else if (Array.isArray(data.datasources)) {
      console.log('✅ Format: datasources array');
      dataSources = data.datasources;
    } else if (data.value && Array.isArray(data.value)) {
      console.log('✅ Format: value array');
      dataSources = data.value;
    } else if (data.status && data.data && Array.isArray(data.data.DataSources)) {
      console.log('✅ Format: status.data.DataSources (BFS API format)');
      dataSources = data.data.DataSources;
    } else {
      console.log('⚠️ Unknown response format, returning empty array');
    }

    console.log('Loaded', dataSources.length, 'data source(s) from API');
    
    if (dataSources.length > 0) {
      console.log('🎯 First data source:', dataSources[0]);
      console.log('🔑 All fields in first data source:', Object.keys(dataSources[0]));
      
      // Analyze all unique fields across all data sources
      const allFields = new Set<string>();
      dataSources.forEach(ds => {
        Object.keys(ds).forEach(key => allFields.add(key));
      });
      console.log('📋 All unique fields across all data sources:', Array.from(allFields).sort());
      
      // Show field value examples
      const fieldExamples: Record<string, any> = {};
      Array.from(allFields).forEach(field => {
        const example = dataSources.find(ds => ds[field as keyof DataSource] !== null && ds[field as keyof DataSource] !== undefined);
        if (example) {
          fieldExamples[field] = example[field as keyof DataSource];
        }
      });
      console.log('💡 Field value examples:', fieldExamples);
    } else {
      console.log('⚠️ No data sources returned from API');
    }
    
    return dataSources;
  } catch (error: any) {
    if (error.message === 'CORS_ERROR') {
      throw new Error('CORS_BLOCKED');
    }
    throw error;
  }
}

// Create new data source
export async function createDataSource(
  dataSourceName: string,
  tenantId?: string
): Promise<DataSource> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newDataSource: DataSource = {
      DatasourceId: `datasource_${Date.now()}`,
      DatasourceName: dataSourceName,
      TenantId: tenantId,
      Status: 'Active',
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `\"demo-etag-${Date.now()}\"`,
    };
    return { ...newDataSource };
  }

  try {
    // API generates DatasourceId automatically, so we only send DatasourceName and TenantId
    const requestBody: any = {
      DatasourceName: dataSourceName,
    };
    
    // Add TenantId if provided
    if (tenantId) {
      requestBody.TenantId = tenantId;
    }

    console.log('📤 POST Data Source Request:');
    console.log('  URL:', `${API_BASE_URL}/datasources`);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/datasources`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      throw new Error(
        errorData.status?.message || "Failed to create data source",
      );
    }

    const responseText = await response.text();
    console.log('✅ Success response:', responseText);
    
    const data: ApiResponse<DataSource> = JSON.parse(responseText);
    console.log("Created data source:", data.data);
    return data.data;
  } catch (error) {
    console.error("Error creating data source:", error);
    throw error;
  }
}

// Delete data source
export async function deleteDataSource(
  dataSourceId: string,
  etag: string,
): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  try {
    console.log('🗑️ DELETE Data Source Request:');
    console.log('  DataSourceId:', dataSourceId);
    console.log('  URL:', `${API_BASE_URL}/datasources/${dataSourceId}`);
    console.log('  ETag:', etag);

    const response = await fetch(
      `${API_BASE_URL}/datasources/${dataSourceId}`,
      {
        method: "DELETE",
        headers: getHeaders(etag),
      },
    );

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      throw new Error(
        errorData.status?.message || "Failed to delete data source",
      );
    }
    
    console.log('✅ Data source deleted successfully');
  } catch (error) {
    console.error("Error deleting data source:", error);
    throw error;
  }
}

// Update data source
export async function updateDataSource(
  dataSourceId: string,
  dataSourceName: string,
  etag: string,
  type?: string,
  connectionString?: string,
  description?: string,
): Promise<DataSource> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const dataSource: DataSource = {
      DatasourceId: dataSourceId,
      DatasourceName: dataSourceName,
      Type: type,
      ConnectionString: connectionString,
      Description: description,
      UpdateTime: new Date().toISOString(),
      _etag: `\"demo-etag-${Date.now()}\"`,
    };
    return { ...dataSource };
  }

  try {
    const requestBody = {
      DatasourceId: dataSourceId,
      DatasourceName: dataSourceName,
      Type: type,
      ConnectionString: connectionString,
      Description: description,
    };

    console.log('📝 PUT Data Source Request:');
    console.log('  DataSourceId:', dataSourceId);
    console.log('  URL:', `${API_BASE_URL}/datasources/${dataSourceId}`);
    console.log('  ETag:', etag);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `${API_BASE_URL}/datasources/${dataSourceId}`,
      {
        method: "PUT",
        headers: getHeaders(etag),
        body: JSON.stringify(requestBody),
      },
    );

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      throw new Error(
        errorData.status?.message || "Failed to update data source",
      );
    }

    const responseText = await response.text();
    console.log('✅ Success response:', responseText);
    
    const data: ApiResponse<DataSource> = JSON.parse(responseText);
    console.log("Updated data source:", data.data);
    return data.data;
  } catch (error) {
    console.error("Error updating data source:", error);
    throw error;
  }
}

// Get data source by ID
export async function getDataSourceById(
  dataSourceId: string,
): Promise<DataSource> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error(`Data source with ID ${dataSourceId} not found`);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/datasources/${dataSourceId}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(
        errorData.status?.message || "Failed to fetch data source",
      );
    }

    const data: ApiResponse<DataSource> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching data source:", error);
    throw error;
  }
}

// ==================== MODEL SCHEMA API FUNCTIONS ====================

// Get Model Schema by ID
export async function getModelSchemaById(schemaId: string): Promise<ModelSchema> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error(`Model Schema with ID ${schemaId} not found`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(schemaId)}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(errorData.status?.message || "Failed to fetch model schema");
    }

    const data: ApiResponse<ModelSchema> = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching model schema:", error);
    throw error;
  }
}

// Create Model Schema
export async function createModelSchema(schemaData: {
  model: string;
  version: number;
  state: string;
  semver: string;
  jsonSchema: any;
}): Promise<ModelSchema> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newSchema: ModelSchema = {
      id: `${schemaData.model}:${schemaData.version}`,
      model: schemaData.model,
      version: schemaData.version,
      state: schemaData.state,
      semver: schemaData.semver,
      jsonSchema: schemaData.jsonSchema,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    return { ...newSchema };
  }

  try {
    const url = `${API_BASE_URL}/txns`;
    const headers = getHeaders();
    const requestBody = {
      TxnType: "ModelSchema",
      Txn: schemaData,
    };
    
    console.log('📤 POST Model Schema Request:');
    console.log('  URL:', url);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to create model schema");
    }

    const responseText = await response.text();
    console.log('✅ Success response:', responseText);
    
    const data: ApiResponse<ModelSchema> = JSON.parse(responseText);
    console.log('Created model schema:', data.data);
    
    return data.data;
  } catch (error) {
    console.error("createModelSchema error:", error);
    throw error;
  }
}

// Update Model Schema
export async function updateModelSchema(
  schemaId: string,
  schemaData: {
    model: string;
    version: number;
    state: string;
    semver: string;
    jsonSchema: any;
  },
  etag: string,
): Promise<ModelSchema> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updatedSchema: ModelSchema = {
      id: schemaId,
      model: schemaData.model,
      version: schemaData.version,
      state: schemaData.state,
      semver: schemaData.semver,
      jsonSchema: schemaData.jsonSchema,
      CreateTime: new Date().toISOString(),
      UpdateTime: new Date().toISOString(),
      _etag: `"demo-etag-${Date.now()}"`,
    };
    return { ...updatedSchema };
  }

  try {
    // Extract the id without ModelSchema prefix for Txn object
    // schemaId could be "ModelSchema:Location:1" or just "Location:1"
    let idWithoutPrefix = schemaId;
    if (schemaId.startsWith('ModelSchema:')) {
      idWithoutPrefix = schemaId.substring('ModelSchema:'.length); // "Location:1"
    }
    
    // Construct the full TxnId with ModelSchema prefix for the URL
    const txnId = schemaId.startsWith('ModelSchema:') ? schemaId : `ModelSchema:${schemaId}`;
    
    // API expects id inside Txn object WITHOUT the ModelSchema prefix
    // Since model and version are now read-only during edit, the id should remain the same
    const txnDataWithId = {
      ...schemaData,
      id: idWithoutPrefix, // Use the id without ModelSchema prefix (e.g., "Location:1")
    };
    
    console.log('📝 PUT Model Schema Request:');
    console.log('  Original SchemaId:', schemaId);
    console.log('  TxnId for URL:', txnId);
    console.log('  ID for Txn object:', idWithoutPrefix);
    console.log('  URL:', `${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`);
    console.log('  ETag:', etag);
    console.log('  Body:', JSON.stringify({ TxnType: "ModelSchema", Txn: txnDataWithId }, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`, {
      method: "PUT",
      headers: getHeaders(etag),
      body: JSON.stringify({
        TxnType: "ModelSchema",
        Txn: txnDataWithId,
      }),
    }).catch((fetchError) => {
      console.error('Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.status?.message || "Failed to update model schema");
    }

    const responseText = await response.text();
    console.log('✅ Model schema updated successfully');
    console.log('📦 Response body:', responseText.substring(0, 500));
    
    const data: ApiResponse<ModelSchema> = JSON.parse(responseText);
    return data.data;
  } catch (error) {
    console.error("updateModelSchema error:", error);
    throw error;
  }
}

// Delete Model Schema
export async function deleteModelSchema(schemaId: string, etag: string): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  try {
    // Construct the full TxnId with ModelSchema prefix if not already present
    const txnId = schemaId.startsWith('ModelSchema:') ? schemaId : `ModelSchema:${schemaId}`;
    
    // Use same pattern as deleteTransaction - no query params
    const url = `${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`;
    
    console.log('🗑️ DELETE Model Schema Request:');
    console.log('  SchemaId:', schemaId);
    console.log('  TxnId:', txnId);
    console.log('  URL:', url);
    console.log('  ETag:', etag);
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(etag),
    }).catch((fetchError) => {
      console.error('Fetch error:', fetchError);
      throw new Error('Network error or CORS issue');
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        console.error('❌ Error response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      // If "Unsupported TxnType", API doesn't support DELETE for ModelSchema
      // Try soft delete by updating state to "deleted"
      if (errorData.status?.message === 'Unsupported TxnType' || 
          errorData.status?.message === 'Unsupported txn_type') {
        console.log('ℹ️ Hard delete not supported (expected), trying soft delete (state: "deleted")');
        
        // First, fetch the current schema to get its data
        try {
          console.log('📥 Fetching current schema data for soft delete...');
          const getCurrentResponse = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`, {
            method: "GET",
            headers: getHeaders(),
          });
          
          if (!getCurrentResponse.ok) {
            const getErrorText = await getCurrentResponse.text();
            console.error('❌ Failed to fetch current schema:', getErrorText);
            throw new Error('Failed to fetch current schema for soft delete');
          }
          
          const currentData = await getCurrentResponse.json();
          console.log('📦 Current schema data:', currentData);
          
          // Check if data exists
          if (!currentData.data || !currentData.data.Txn) {
            console.error('❌ Invalid response format:', currentData);
            throw new Error('Invalid response format when fetching current schema');
          }
          
          const currentSchema = currentData.data.Txn;
          
          // IMPORTANT: API validates that id MUST match "{model}:{version}"
          // Construct id from current schema's model and version
          const constructedId = `${currentSchema.model}:${currentSchema.version}`;
          
          // Update with state: "deleted"
          const updatedSchema = {
            ...currentSchema,
            id: constructedId, // Construct id from model:version
            state: "deleted",
          };
          
          console.log('📝 Soft delete: updating state to "deleted"');
          console.log('  Constructed ID:', constructedId, `(from model="${currentSchema.model}" and version=${currentSchema.version})`);
          
          const updateResponse = await fetch(`${API_BASE_URL}/txns/${encodeURIComponent(txnId)}`, {
            method: "PUT",
            headers: getHeaders(etag),
            body: JSON.stringify({
              TxnType: "ModelSchema",
              Txn: updatedSchema,
            }),
          });
          
          if (!updateResponse.ok) {
            const updateErrorText = await updateResponse.text();
            console.error('❌ Soft delete failed:', updateErrorText);
            
            // Try to parse error for better message
            try {
              const updateErrorData = JSON.parse(updateErrorText);
              throw new Error(updateErrorData.status?.message || 'Failed to soft delete model schema');
            } catch (parseError) {
              throw new Error(`Failed to soft delete model schema: ${updateErrorText}`);
            }
          }
          
          const updateResult = await updateResponse.json();
          console.log('✅ Model schema soft deleted (state: "deleted"):', updateResult);
          return;
        } catch (softDeleteError: any) {
          console.error('❌ Soft delete error:', softDeleteError);
          // Re-throw with more context
          throw new Error(`Soft delete failed: ${softDeleteError.message || softDeleteError}`);
        }
      }
      
      // For other errors, log and throw
      console.error('❌ Error response:', errorText);
      throw new Error(errorData.status?.message || "Failed to delete model schema");
    }

    console.log('✅ Model schema deleted successfully (hard delete)');
  } catch (error: any) {
    console.error("deleteModelSchema error:", error);
    // Ensure error message is clear
    const errorMessage = error.message || String(error);
    throw new Error(errorMessage);
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