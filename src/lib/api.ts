// API Configuration
const API_BASE_URL =
  "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0";
const AUTH_HEADER_KEY = "X-BFS-Auth";
const AUTH_HEADER_VALUE =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// Apicurio Registry Configuration
const APICURIO_REGISTRY_URL = "http://apicurio.52.158.160.62.nip.io/apis/registry/v2";

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

// Data Capture Specification Interface
export interface DataCaptureSpec {
  dataCaptureSpecId?: string;
  dataCaptureSpecName: string;
  tenantId: string;
  dataSourceId: string;
  isActive: boolean;
  version: number;
  profile: string;
  sourcePrimaryKeyField: string;
  partitionKeyField: string;
  partitionKeyValue: string;
  allowedFilters: string[];
  requiredFields: string[];
  containerSchema: any; // JSON Schema for Cosmos DB container
  CreateTime?: string | null;
  UpdateTime?: string | null;
  createdBy?: string | null;
  notes?: string | null;
  updateTime?: string;
  createTime?: string;
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
    console.log('Attempting to connect to BFS API...');
    
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      method: "GET",
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
      // Intercept fetch errors (CORS, network) and throw custom error
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
        // Silently return empty for parse errors (likely unsupported types)
        return {
          transactions: [],
          continuationToken: null,
          hasMore: false
        };
      }
      
      // Check if it's "Unsupported TxnType" or "No Cosmos container configured" - treat as empty result, not error
      if (errorData.status?.message === 'Unsupported TxnType' || 
          errorData.status?.message === 'Unsupported txn_type' ||
          errorData.status?.message?.includes('No Cosmos container configured') ||
          response.status === 400) {
        // Silently return empty array for unsupported types - no console logs
        return {
          transactions: [],
          continuationToken: null,
          hasMore: false
        };
      }
      
      // Only log errors for non-400 status codes (real errors)
      if (response.status !== 400) {
        console.error('Error response body:', errorText);
      }
      throw new Error(errorData.status?.message || `API returned ${response.status}`);
    }

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);
    
    // Extract continuation token from response (check various possible locations)
    let nextToken: string | null = null;
    if (responseData.continuationToken) {
      nextToken = responseData.continuationToken;
    } else if (responseData.data?.continuationToken) {
      nextToken = responseData.data.continuationToken;
    } else if (responseData.data?.ContinuationToken) {
      nextToken = responseData.data.ContinuationToken;
    }
    
    // Handle BFS API response format: { status: {...}, data: { TxnType: "...", Txns: [...] } }
    let txns: Transaction[] = [];
    
    if (responseData.status && responseData.data) {
      // BFS API returns: data.Txns array
      if (responseData.data.Txns && Array.isArray(responseData.data.Txns)) {
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
      }
      // Fallback: data is array directly
      else if (Array.isArray(responseData.data)) {
        txns = responseData.data;
      }
    }
    // Direct array format
    else if (Array.isArray(responseData)) {
      txns = responseData;
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
      console.log(`Attempting to fetch data sources for tenant ${tenantId} from BFS API...`);
    } else {
      console.log('Attempting to fetch all data sources from BFS API...');
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }).catch((fetchError) => {
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
  tenantId?: string,
): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  try {
    // Build URL with optional TenantId query parameter
    let url = `${API_BASE_URL}/datasources/${encodeURIComponent(dataSourceId)}`;
    if (tenantId) {
      url += `?TenantId=${encodeURIComponent(tenantId)}`;
    }
    
    console.log('🗑️ DELETE Data Source Request:');
    console.log('  DataSourceId:', dataSourceId);
    console.log('  TenantId:', tenantId || 'undefined');
    console.log('  URL:', url);
    console.log('  ETag:', etag);
    console.log('  Method: DELETE');

    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(etag),
    });

    console.log('📥 DELETE Response:');
    console.log('  Status:', response.status, response.statusText);
    console.log('  OK:', response.ok);

    if (!response.ok) {
      // If data source not found (404), treat it as already deleted
      if (response.status === 404) {
        console.log('⚠️ Data source not found (404) - treating as already deleted');
        return;
      }
      
      const errorText = await response.text();
      console.error('❌ DELETE Error response:', errorText);
      
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
    
    // Try to read response body if any
    const responseText = await response.text();
    if (responseText) {
      console.log('✅ DELETE Response body:', responseText);
    } else {
      console.log('✅ Data source deleted successfully (no response body)');
    }
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
  tenantId?: string,
): Promise<DataSource> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const dataSource: DataSource = {
      DatasourceId: dataSourceId,
      DatasourceName: dataSourceName,
      Type: type,
      ConnectionString: connectionString,
      Description: description,
      TenantId: tenantId,
      UpdateTime: new Date().toISOString(),
      _etag: `\"demo-etag-${Date.now()}\"`,
    };
    return { ...dataSource };
  }

  try {
    const requestBody: any = {
      DatasourceName: dataSourceName,
    };
    
    // Only include optional fields if they are provided
    if (type !== undefined) {
      requestBody.Type = type;
    }
    if (connectionString !== undefined) {
      requestBody.ConnectionString = connectionString;
    }
    if (description !== undefined) {
      requestBody.Description = description;
    }
    if (tenantId !== undefined) {
      requestBody.TenantId = tenantId;
    }

    console.log('📝 PUT Data Source Request:');
    console.log('  DataSourceId:', dataSourceId);
    console.log('  URL:', `${API_BASE_URL}/datasources/${encodeURIComponent(dataSourceId)}`);
    console.log('  ETag:', etag);
    console.log('  Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `${API_BASE_URL}/datasources/${encodeURIComponent(dataSourceId)}`,
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
      `${API_BASE_URL}/datasources/${encodeURIComponent(dataSourceId)}`,
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

// ==================== DATA CAPTURE SPECIFICATION API FUNCTIONS ====================

// Get Data Capture Specifications (optionally filtered by tenantId and dataSourceId)
export async function getDataCaptureSpecs(
  tenantId?: string,
  dataSourceId?: string
): Promise<DataCaptureSpec[]> {
  try {
    let url = `${API_BASE_URL}/data-capture-specs`;
    
    // Build filters if provided
    if (tenantId || dataSourceId) {
      const filters: any = {};
      if (tenantId) filters.TenantId = tenantId;
      if (dataSourceId) filters.dataSourceId = dataSourceId;
      
      const filtersParam = encodeURIComponent(JSON.stringify(filters));
      url += `?Filters=${filtersParam}`;
    }

    console.log('🔍 GET Data Capture Specs Request:');
    console.log('  URL:', url);
    console.log('  TenantId:', tenantId || 'none');
    console.log('  DataSourceId:', dataSourceId || 'none');

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData: ApiResponse<any> = await response.json();
      throw new Error(errorData.status?.message || "Failed to fetch data capture specs");
    }

    const data: ApiResponse<{ DataCaptureSpecs: DataCaptureSpec[] }> = await response.json();
    console.log('✅ Fetched data capture specs:', data.data.DataCaptureSpecs.length);
    return data.data.DataCaptureSpecs || [];
  } catch (error) {
    console.error("Error fetching data capture specs:", error);
    throw error;
  }
}

// Create Data Capture Specification
export async function createDataCaptureSpec(
  spec: Omit<DataCaptureSpec, 'dataCaptureSpecId' | '_etag' | '_rid' | '_ts' | '_self' | '_attachments' | 'createTime' | 'updateTime'>
): Promise<DataCaptureSpec> {
  try {
    console.log('➕ POST Data Capture Spec Request:');
    console.log('  URL:', `${API_BASE_URL}/data-capture-specs`);
    console.log('  Spec:', spec);

    const response = await fetch(`${API_BASE_URL}/data-capture-specs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(spec),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      let errorData: ApiResponse<any>;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Failed to create data capture spec: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData.status?.message || "Failed to create data capture spec");
    }

    const responseText = await response.text();
    console.log('✅ Success response:', responseText);
    
    const data: ApiResponse<{ DataCaptureSpec: DataCaptureSpec }> = JSON.parse(responseText);
    console.log("Created data capture spec:", data.data.DataCaptureSpec);
    return data.data.DataCaptureSpec;
  } catch (error) {
    console.error("Error creating data capture spec:", error);
    throw error;
  }
}

// Update Data Capture Specification
export async function updateDataCaptureSpec(
  specId: string,
  spec: Partial<DataCaptureSpec>,
  etag: string
): Promise<DataCaptureSpec> {
  try {
    console.log('📝 PUT Data Capture Spec Request:');
    console.log('  SpecId:', specId);
    console.log('  URL:', `${API_BASE_URL}/data-capture-specs/${specId}`);
    console.log('  ETag:', etag);
    console.log('  Updates:', spec);

    const response = await fetch(`${API_BASE_URL}/data-capture-specs/${encodeURIComponent(specId)}`, {
      method: "PUT",
      headers: getHeaders(etag),
      body: JSON.stringify(spec),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      let errorData: ApiResponse<any>;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Failed to update data capture spec: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData.status?.message || "Failed to update data capture spec");
    }

    const responseText = await response.text();
    console.log('✅ Success response:', responseText);
    
    const data: ApiResponse<{ DataCaptureSpec: DataCaptureSpec }> = JSON.parse(responseText);
    console.log("Updated data capture spec:", data.data.DataCaptureSpec);
    return data.data.DataCaptureSpec;
  } catch (error) {
    console.error("Error updating data capture spec:", error);
    throw error;
  }
}

// Delete Data Capture Specification
export async function deleteDataCaptureSpec(
  specId: string,
  etag: string
): Promise<void> {
  try {
    console.log('🗑️ DELETE Data Capture Spec Request:');
    console.log('  SpecId:', specId);
    console.log('  URL:', `${API_BASE_URL}/data-capture-specs/${specId}`);
    console.log('  ETag:', etag);

    const response = await fetch(`${API_BASE_URL}/data-capture-specs/${encodeURIComponent(specId)}`, {
      method: "DELETE",
      headers: getHeaders(etag),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      let errorData: ApiResponse<any>;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Failed to delete data capture spec: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData.status?.message || "Failed to delete data capture spec");
    }

    console.log('✅ Data capture spec deleted successfully');
  } catch (error) {
    console.error("Error deleting data capture spec:", error);
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

// ==================== APICURIO REGISTRY API FUNCTIONS ====================

// Apicurio Group Interface
export interface ApicurioGroup {
  id: string;
  description?: string;
  createdOn?: string;
  modifiedOn?: string;
  artifactsType?: string;
}

// Apicurio Groups List Response
export interface ApicurioGroupsList {
  groups: ApicurioGroup[];
  count: number;
}

// Apicurio Artifact Interface
export interface ApicurioArtifact {
  id: string;
  type: string; // AVRO, JSON, PROTOBUF, etc.
  state?: string;
  version?: string;
  createdOn?: string;
  modifiedOn?: string;
  description?: string;
  labels?: string[];
  groupId?: string; // Added to track which group this artifact belongs to
}

// Apicurio Artifacts List Response
export interface ApicurioArtifactsList {
  artifacts: ApicurioArtifact[];
  count: number;
}

// Apicurio Schema Content (for JSON schemas)
export interface ApicurioSchemaContent {
  [key: string]: any; // JSON Schema content
}

// Feature flag: Use mock data to avoid CORS errors
// Set to true to skip real Apicurio API calls and use mock data immediately
const USE_MOCK_APICURIO = true;

// Get all groups from Apicurio Registry
export async function getApicurioGroups(): Promise<ApicurioGroupsList> {
  // Use mock data if feature flag is enabled (avoids CORS errors completely)
  if (USE_MOCK_APICURIO) {
    console.log('📋 Using mock Apicurio groups (CORS avoidance mode enabled)');
    return {
      count: 3,
      groups: [
        { id: 'bfs.online', description: 'BFS Online Platform', createdOn: '', modifiedOn: '' },
        { id: 'paradigm.mybldr.bidtools', description: 'Bidtools Application', createdOn: '', modifiedOn: '' },
        { id: 'paradigm.txservices.quotes', description: 'Transaction Services - Quotes', createdOn: '', modifiedOn: '' }
      ]
    };
  }
  
  try {
    console.log('📡 Fetching all Apicurio groups...');
    
    const response = await fetch(`${APICURIO_REGISTRY_URL}/groups`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch groups: ${response.status}`, errorText);
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
    }

    const data: ApicurioGroupsList = await response.json();
    console.log(`✅ Found ${data.count} groups in Apicurio Registry`);
    
    return data;
  } catch (error) {
    console.error("⚠️ Error fetching Apicurio groups (CORS issue?):", error);
    
    // Fallback to mock data for known groups
    console.log('🔄 Using fallback mock data for Apicurio groups');
    return {
      count: 3,
      groups: [
        { id: 'bfs.online', description: 'BFS Online Platform', createdOn: '', modifiedOn: '' },
        { id: 'paradigm.mybldr.bidtools', description: 'Bidtools Application', createdOn: '', modifiedOn: '' },
        { id: 'paradigm.txservices.quotes', description: 'Transaction Services - Quotes', createdOn: '', modifiedOn: '' }
      ]
    };
  }
}

// Get all artifacts from a specific group
export async function getApicurioArtifacts(groupId: string): Promise<ApicurioArtifactsList> {
  // Use mock data if feature flag is enabled (avoids CORS errors completely)
  if (USE_MOCK_APICURIO) {
    if (groupId === 'bfs.online') {
      console.log(`📋 Using mock artifacts for group: ${groupId} (CORS avoidance mode)`);
      return {
        count: 10,
        artifacts: [
          // AVRO schemas for BFS.online
          { id: 'bfs.online.inv', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.inv1', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.inv2', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.prod', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.quote', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.quotedetail', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.servicerequest', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.customer', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.linetype', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.reasoncode', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId }
        ]
      };
    }
    
    if (groupId === 'paradigm.mybldr.bidtools') {
      console.log(`📋 Using mock artifacts for group: ${groupId} (CORS avoidance mode)`);
      return {
        count: 16,
        artifacts: [
          // JSON Schema
          { id: 'bfs.QuoteDetails.json', type: 'JSON', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          
          // AVRO Key Schemas
          { id: 'bidtools.LineTypes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuoteDetails-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuotePackOrder-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuotePacks-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.Quotes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.ReasonCodes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.ServiceRequests-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          
          // AVRO Value Schemas
          { id: 'bfs.ServiceRequests', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuoteDetails', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.WorkflowCustomers', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.LineTypes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuotePackOrder', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuotePacks', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.Quotes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.ReasonCodes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId }
        ]
      };
    }
    
    // For other groups, return empty
    console.log(`📋 No mock artifacts available for group: ${groupId}`);
    return {
      count: 0,
      artifacts: []
    };
  }
  
  try {
    console.log(`📡 Fetching Apicurio artifacts from group: ${groupId}`);
    
    const response = await fetch(`${APICURIO_REGISTRY_URL}/groups/${groupId}/artifacts`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch artifacts: ${response.status}`, errorText);
      throw new Error(`Failed to fetch artifacts from group ${groupId}: ${response.status} ${response.statusText}`);
    }

    const data: ApicurioArtifactsList = await response.json();
    console.log(`✅ Found ${data.count} artifacts in group "${groupId}"`);
    
    return data;
  } catch (error) {
    console.error("⚠️ Error fetching Apicurio artifacts (CORS issue?):", error);
    
    // Fallback to mock data for bfs.online group
    if (groupId === 'bfs.online') {
      console.log('🔄 Using fallback mock data for bfs.online artifacts');
      return {
        count: 10,
        artifacts: [
          // AVRO schemas for BFS.online
          { id: 'bfs.online.inv', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.inv1', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.inv2', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.prod', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.quote', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.quotedetail', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.servicerequest', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.customer', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.linetype', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.online.reasoncode', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId }
        ]
      };
    }
    
    // Fallback to mock data for paradigm.mybldr.bidtools group
    if (groupId === 'paradigm.mybldr.bidtools') {
      console.log('🔄 Using fallback mock data for paradigm.mybldr.bidtools artifacts');
      return {
        count: 16,
        artifacts: [
          // JSON Schema
          { id: 'bfs.QuoteDetails.json', type: 'JSON', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          
          // AVRO Key Schemas
          { id: 'bidtools.LineTypes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuoteDetails-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuotePackOrder-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.QuotePacks-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.Quotes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.ReasonCodes-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bidtools.ServiceRequests-key', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          
          // AVRO Value Schemas
          { id: 'bfs.ServiceRequests', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuoteDetails', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.WorkflowCustomers', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.LineTypes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuotePackOrder', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.QuotePacks', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.Quotes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId },
          { id: 'bfs.ReasonCodes', type: 'AVRO', state: 'ENABLED', createdOn: '', modifiedOn: '', groupId }
        ]
      };
    }
    
    // For other groups, return empty
    console.log(`🔄 No fallback data available for group: ${groupId}`);
    return {
      count: 0,
      artifacts: []
    };
  }
}

// Get artifact content (schema) by groupId and artifactId
export async function getApicurioArtifactContent(
  groupId: string, 
  artifactId: string
): Promise<ApicurioSchemaContent> {
  // Use mock data if feature flag is enabled (avoids CORS errors completely)
  if (USE_MOCK_APICURIO) {
    if (artifactId === 'bfs.QuoteDetails.json') {
      console.log(`📋 Using mock schema for: ${artifactId} (CORS avoidance mode)`);
      return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QuoteDetails",
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the quote detail"
          },
          "quoteId": {
            "type": "string",
            "description": "Reference to parent quote"
          },
          "partitionKey": {
            "type": "string",
            "description": "Partition key for Cosmos DB"
          },
          "lineNumber": {
            "type": "integer",
            "description": "Line number in the quote"
          },
          "productId": {
            "type": "string",
            "description": "Product identifier"
          },
          "productName": {
            "type": "string",
            "description": "Product name"
          },
          "quantity": {
            "type": "number",
            "description": "Quantity ordered"
          },
          "unitPrice": {
            "type": "number",
            "description": "Price per unit"
          },
          "totalPrice": {
            "type": "number",
            "description": "Total price for this line"
          },
          "description": {
            "type": "string",
            "description": "Line item description"
          },
          "createdDate": {
            "type": "string",
            "format": "date-time",
            "description": "Creation timestamp"
          },
          "modifiedDate": {
            "type": "string",
            "format": "date-time",
            "description": "Last modification timestamp"
          }
        },
        "required": ["id", "quoteId", "partitionKey", "lineNumber"]
      };
    }
    
    // Mock AVRO schemas for bfs.online group
    if (groupId === 'bfs.online') {
      console.log(`📋 Using mock AVRO schema for: ${artifactId} (CORS avoidance mode)`);
      
      if (artifactId === 'bfs.online.quotedetail') {
        return {
          "type": "record",
          "name": "QuoteDetail",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique identifier for the quote detail"},
            {"name": "quoteId", "type": "string", "doc": "Reference to parent quote"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "lineNumber", "type": "int", "doc": "Line number in the quote"},
            {"name": "productId", "type": ["null", "string"], "default": null, "doc": "Product identifier"},
            {"name": "productName", "type": ["null", "string"], "default": null, "doc": "Product name"},
            {"name": "quantity", "type": ["null", "double"], "default": null, "doc": "Quantity ordered"},
            {"name": "unitPrice", "type": ["null", "double"], "default": null, "doc": "Price per unit"},
            {"name": "totalPrice", "type": ["null", "double"], "default": null, "doc": "Total price for this line"},
            {"name": "description", "type": ["null", "string"], "default": null, "doc": "Line item description"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.quote') {
        return {
          "type": "record",
          "name": "Quote",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique quote identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "customerId", "type": ["null", "string"], "default": null, "doc": "Customer identifier"},
            {"name": "quoteNumber", "type": ["null", "string"], "default": null, "doc": "Quote number"},
            {"name": "status", "type": ["null", "string"], "default": null, "doc": "Quote status"},
            {"name": "totalAmount", "type": ["null", "double"], "default": null, "doc": "Total quote amount"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.customer') {
        return {
          "type": "record",
          "name": "Customer",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique customer identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "customerName", "type": ["null", "string"], "default": null, "doc": "Customer name"},
            {"name": "email", "type": ["null", "string"], "default": null, "doc": "Customer email"},
            {"name": "phone", "type": ["null", "string"], "default": null, "doc": "Customer phone"},
            {"name": "address", "type": ["null", "string"], "default": null, "doc": "Customer address"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.servicerequest') {
        return {
          "type": "record",
          "name": "ServiceRequest",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique service request identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "customerId", "type": ["null", "string"], "default": null, "doc": "Customer identifier"},
            {"name": "requestType", "type": ["null", "string"], "default": null, "doc": "Type of service request"},
            {"name": "status", "type": ["null", "string"], "default": null, "doc": "Request status"},
            {"name": "description", "type": ["null", "string"], "default": null, "doc": "Request description"},
            {"name": "priority", "type": ["null", "string"], "default": null, "doc": "Request priority"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.inv' || artifactId === 'bfs.online.inv1' || artifactId === 'bfs.online.inv2') {
        return {
          "type": "record",
          "name": "Invoice",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique invoice identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "invoiceNumber", "type": ["null", "string"], "default": null, "doc": "Invoice number"},
            {"name": "customerId", "type": ["null", "string"], "default": null, "doc": "Customer identifier"},
            {"name": "amount", "type": ["null", "double"], "default": null, "doc": "Invoice amount"},
            {"name": "status", "type": ["null", "string"], "default": null, "doc": "Invoice status"},
            {"name": "dueDate", "type": ["null", "string"], "default": null, "doc": "Payment due date"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.prod') {
        return {
          "type": "record",
          "name": "Product",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique product identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "productName", "type": ["null", "string"], "default": null, "doc": "Product name"},
            {"name": "description", "type": ["null", "string"], "default": null, "doc": "Product description"},
            {"name": "price", "type": ["null", "double"], "default": null, "doc": "Product price"},
            {"name": "category", "type": ["null", "string"], "default": null, "doc": "Product category"},
            {"name": "sku", "type": ["null", "string"], "default": null, "doc": "Stock keeping unit"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.linetype') {
        return {
          "type": "record",
          "name": "LineType",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique line type identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "typeName", "type": ["null", "string"], "default": null, "doc": "Line type name"},
            {"name": "description", "type": ["null", "string"], "default": null, "doc": "Line type description"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
      
      if (artifactId === 'bfs.online.reasoncode') {
        return {
          "type": "record",
          "name": "ReasonCode",
          "namespace": "bfs.online",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique reason code identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
            {"name": "code", "type": ["null", "string"], "default": null, "doc": "Reason code"},
            {"name": "description", "type": ["null", "string"], "default": null, "doc": "Reason code description"},
            {"name": "category", "type": ["null", "string"], "default": null, "doc": "Reason code category"},
            {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
            {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
          ]
        };
      }
    }
    
    // Mock AVRO schemas for paradigm.mybldr.bidtools group
    if (groupId === 'paradigm.mybldr.bidtools') {
      console.log(`📋 Using mock AVRO schema for: ${artifactId} (CORS avoidance mode)`);
      
      // AVRO Value Schemas
      if (artifactId === 'bfs.QuoteDetails') {
        return {
          "type": "record",
          "name": "QuoteDetails",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique identifier"},
            {"name": "quoteId", "type": "string", "doc": "Reference to parent quote"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "lineNumber", "type": "int", "doc": "Line number"},
            {"name": "productId", "type": ["null", "string"], "default": null},
            {"name": "quantity", "type": ["null", "double"], "default": null},
            {"name": "unitPrice", "type": ["null", "double"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.ServiceRequests') {
        return {
          "type": "record",
          "name": "ServiceRequests",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique service request identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "customerId", "type": ["null", "string"], "default": null},
            {"name": "requestType", "type": ["null", "string"], "default": null},
            {"name": "status", "type": ["null", "string"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.WorkflowCustomers') {
        return {
          "type": "record",
          "name": "WorkflowCustomers",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique customer identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "customerName", "type": ["null", "string"], "default": null},
            {"name": "email", "type": ["null", "string"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.LineTypes') {
        return {
          "type": "record",
          "name": "LineTypes",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique line type identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "typeName", "type": ["null", "string"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.QuotePackOrder') {
        return {
          "type": "record",
          "name": "QuotePackOrder",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "orderNumber", "type": ["null", "int"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.QuotePacks') {
        return {
          "type": "record",
          "name": "QuotePacks",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique pack identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "packName", "type": ["null", "string"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.Quotes') {
        return {
          "type": "record",
          "name": "Quotes",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique quote identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "quoteNumber", "type": ["null", "string"], "default": null},
            {"name": "totalAmount", "type": ["null", "double"], "default": null}
          ]
        };
      }
      
      if (artifactId === 'bfs.ReasonCodes') {
        return {
          "type": "record",
          "name": "ReasonCodes",
          "namespace": "bfs",
          "fields": [
            {"name": "id", "type": "string", "doc": "Unique reason code identifier"},
            {"name": "partitionKey", "type": "string", "doc": "Partition key"},
            {"name": "code", "type": ["null", "string"], "default": null}
          ]
        };
      }
      
      // AVRO Key Schemas
      if (artifactId === 'bidtools.LineTypes-key') {
        return {
          "type": "record",
          "name": "LineTypesKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.QuoteDetails-key') {
        return {
          "type": "record",
          "name": "QuoteDetailsKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.QuotePackOrder-key') {
        return {
          "type": "record",
          "name": "QuotePackOrderKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.QuotePacks-key') {
        return {
          "type": "record",
          "name": "QuotePacksKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.Quotes-key') {
        return {
          "type": "record",
          "name": "QuotesKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.ReasonCodes-key') {
        return {
          "type": "record",
          "name": "ReasonCodesKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
      
      if (artifactId === 'bidtools.ServiceRequests-key') {
        return {
          "type": "record",
          "name": "ServiceRequestsKey",
          "namespace": "bidtools",
          "fields": [
            {"name": "id", "type": "string", "doc": "Key identifier"}
          ]
        };
      }
    }
    
    throw new Error(`No mock data available for artifact: ${artifactId}`);
  }
  
  try {
    console.log(`📡 Fetching Apicurio artifact: ${groupId}/${artifactId}`);
    
    const response = await fetch(
      `${APICURIO_REGISTRY_URL}/groups/${groupId}/artifacts/${artifactId}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch artifact content: ${response.status}`, errorText);
      throw new Error(`Failed to fetch artifact ${artifactId} from group ${groupId}: ${response.status} ${response.statusText}`);
    }

    const data: ApicurioSchemaContent = await response.json();
    console.log(`✅ Fetched schema for ${artifactId}`, data);
    
    return data;
  } catch (error) {
    console.error("⚠️ Error fetching Apicurio artifact content (CORS issue?):", error);
    
    // Fallback to mock schema for bfs.QuoteDetails.json
    if (artifactId === 'bfs.QuoteDetails.json') {
      console.log('🔄 Using fallback mock schema for bfs.QuoteDetails.json');
      return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QuoteDetails",
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the quote detail"
          },
          "quoteId": {
            "type": "string",
            "description": "Reference to parent quote"
          },
          "partitionKey": {
            "type": "string",
            "description": "Partition key for Cosmos DB"
          },
          "lineNumber": {
            "type": "integer",
            "description": "Line number in the quote"
          },
          "productId": {
            "type": "string",
            "description": "Product identifier"
          },
          "productName": {
            "type": "string",
            "description": "Product name"
          },
          "quantity": {
            "type": "number",
            "description": "Quantity ordered"
          },
          "unitPrice": {
            "type": "number",
            "description": "Price per unit"
          },
          "totalPrice": {
            "type": "number",
            "description": "Total price for this line"
          },
          "description": {
            "type": "string",
            "description": "Line item description"
          },
          "createdDate": {
            "type": "string",
            "format": "date-time",
            "description": "Creation timestamp"
          },
          "modifiedDate": {
            "type": "string",
            "format": "date-time",
            "description": "Last modification timestamp"
          }
        },
        "required": ["id", "quoteId", "partitionKey", "lineNumber"]
      };
    }
    
    // Fallback for bfs.online AVRO schemas
    if (groupId === 'bfs.online' && artifactId === 'bfs.online.quotedetail') {
      console.log('🔄 Using fallback AVRO schema for bfs.online.quotedetail');
      return {
        "type": "record",
        "name": "QuoteDetail",
        "namespace": "bfs.online",
        "fields": [
          {"name": "id", "type": "string", "doc": "Unique identifier for the quote detail"},
          {"name": "quoteId", "type": "string", "doc": "Reference to parent quote"},
          {"name": "partitionKey", "type": "string", "doc": "Partition key for Cosmos DB"},
          {"name": "lineNumber", "type": "int", "doc": "Line number in the quote"},
          {"name": "productId", "type": ["null", "string"], "default": null, "doc": "Product identifier"},
          {"name": "productName", "type": ["null", "string"], "default": null, "doc": "Product name"},
          {"name": "quantity", "type": ["null", "double"], "default": null, "doc": "Quantity ordered"},
          {"name": "unitPrice", "type": ["null", "double"], "default": null, "doc": "Price per unit"},
          {"name": "totalPrice", "type": ["null", "double"], "default": null, "doc": "Total price for this line"},
          {"name": "description", "type": ["null", "string"], "default": null, "doc": "Line item description"},
          {"name": "createdDate", "type": ["null", "string"], "default": null, "doc": "Creation timestamp"},
          {"name": "modifiedDate", "type": ["null", "string"], "default": null, "doc": "Last modification timestamp"}
        ]
      };
    }
    
    // Fallback for paradigm.mybldr.bidtools AVRO schemas
    if (groupId === 'paradigm.mybldr.bidtools' && artifactId === 'bfs.QuoteDetails') {
      console.log('🔄 Using fallback AVRO schema for bfs.QuoteDetails');
      return {
        "type": "record",
        "name": "QuoteDetails",
        "namespace": "bfs",
        "fields": [
          {"name": "id", "type": "string", "doc": "Unique identifier"},
          {"name": "quoteId", "type": "string", "doc": "Reference to parent quote"},
          {"name": "partitionKey", "type": "string", "doc": "Partition key"},
          {"name": "lineNumber", "type": "int", "doc": "Line number"},
          {"name": "productId", "type": ["null", "string"], "default": null},
          {"name": "quantity", "type": ["null", "double"], "default": null},
          {"name": "unitPrice", "type": ["null", "double"], "default": null}
        ]
      };
    }
    
    // For other artifacts, throw error
    throw new Error(`No fallback data available for artifact: ${artifactId}`);
  }
}

// Get all Data Source Specifications from all groups in Apicurio Registry
// Returns artifacts with their group information
export async function getAllDataSourceSpecifications(): Promise<ApicurioArtifact[]> {
  try {
    console.log('📡 Discovering all Data Source Specifications from Apicurio...');
    
    // Get all groups
    const groupsList = await getApicurioGroups();
    
    const allArtifacts: ApicurioArtifact[] = [];
    
    // Fetch artifacts from each group
    for (const group of groupsList.groups) {
      try {
        const artifactsList = await getApicurioArtifacts(group.id);
        
        // Add groupId to each artifact for tracking
        const artifactsWithGroup = artifactsList.artifacts.map(artifact => ({
          ...artifact,
          groupId: group.id
        }));
        
        allArtifacts.push(...artifactsWithGroup);
        
        console.log(`  ✅ Group "${group.id}": ${artifactsList.count} artifacts (${artifactsWithGroup.filter(a => a.type === 'JSON').length} JSON)`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to fetch artifacts from group "${group.id}":`, error);
        // Continue with other groups
      }
    }
    
    console.log(`✅ Total discovered: ${allArtifacts.length} artifacts from ${groupsList.count} groups`);
    
    return allArtifacts;
  } catch (error) {
    console.error('Error discovering Data Source Specifications:', error);
    // Return empty array on error rather than throwing - allows UI to handle gracefully
    return [];
  }
}

// Get JSON schemas from Apicurio Registry for a specific data source
// Maps data source names to Apicurio group IDs
export async function getJsonSchemasForDataSource(dataSourceName: string): Promise<ApicurioArtifact[]> {
  try {
    // Updated map with correct group mappings based on Apicurio Registry structure
    const groupIdMap: Record<string, string> = {
      'BFS': 'bfs.online', // BFS schemas in bfs.online group
      'BFS.online': 'bfs.online', // BFS.online AVRO schemas in dedicated group
      'bfs.online': 'bfs.online', // BFS.online AVRO schemas in dedicated group
      'Bidtools': 'paradigm.mybldr.bidtools',
      'BIDTOOLS': 'paradigm.mybldr.bidtools',
      'bidtools': 'paradigm.mybldr.bidtools',
      'TxServices': 'paradigm.txservices',
      'Quotes': 'paradigm.txservices.quotes',
      'Customers': 'paradigm.txservices.customers',
    };

    // Try direct mapping first
    let groupId = groupIdMap[dataSourceName];
    
    // If no direct mapping, try to find group dynamically
    if (!groupId) {
      console.log(`📡 No direct mapping for "${dataSourceName}", searching all groups...`);
      
      try {
        const allGroups = await getApicurioGroups();
        
        // Try to find a matching group by name
        const matchingGroup = allGroups.groups.find(g => 
          g.id.toLowerCase().includes(dataSourceName.toLowerCase()) ||
          dataSourceName.toLowerCase().includes(g.id.toLowerCase())
        );
        
        if (matchingGroup) {
          groupId = matchingGroup.id;
          console.log(`  ✅ Found matching group: ${groupId}`);
        }
      } catch (error) {
        console.warn('Failed to search for matching group:', error);
      }
    }
    
    if (!groupId) {
      console.log(`ℹ️ No Apicurio group mapping found for data source: ${dataSourceName} - skipping schema discovery`);
      return [];
    }

    const artifactsList = await getApicurioArtifacts(groupId);
    
    // Include both JSON and AVRO schemas (not just JSON), add groupId to each
    const schemas = artifactsList.artifacts
      .filter(artifact => artifact.type === 'JSON' || artifact.type === 'AVRO')
      .map(artifact => ({ ...artifact, groupId }));
    
    console.log(`✅ Found ${schemas.length} schemas (JSON + AVRO) for ${dataSourceName} in group ${groupId}:`, 
      schemas.map(s => `${s.id} (${s.type})`).join(', '));
    
    return schemas;
  } catch (error) {
    console.error(`Error fetching JSON schemas for ${dataSourceName}:`, error);
    // Return empty array on error rather than throwing - allows UI to handle gracefully
    return [];
  }
}

// Create or update an artifact in Apicurio Registry
export async function createApicurioArtifact(
  groupId: string,
  artifactId: string,
  content: any,
  contentType: string = "application/json"
): Promise<void> {
  try {
    console.log(`📡 Creating/Updating Apicurio artifact: ${groupId}/${artifactId}`);
    
    const response = await fetch(
      `${APICURIO_REGISTRY_URL}/groups/${groupId}/artifacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "X-Registry-ArtifactId": artifactId,
        },
        body: JSON.stringify(content),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create artifact: ${response.status}`, errorText);
      throw new Error(`Failed to create artifact ${artifactId}: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ Successfully created/updated artifact ${artifactId}`);
  } catch (error) {
    console.error("Error creating Apicurio artifact:", error);
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