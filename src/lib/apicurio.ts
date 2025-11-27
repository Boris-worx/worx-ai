// Apicurio Registry API Functions for Data Capture Specification templates

const APICURIO_REGISTRY_URL = "https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io/apis/registry/v3";

// Cache for artifacts search results (avoid repeated API calls)
// Using localStorage for persistent cache + in-memory cache for speed
const CACHE_KEY = 'apicurio_artifacts_cache';
const CACHE_TIMESTAMP_KEY = 'apicurio_artifacts_timestamp';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes (was 5 minutes)

let artifactsCache: ApicurioSearchResponse | null = null;
let artifactsCacheTimestamp = 0;

// Initialize cache from localStorage on module load
function initializeCache() {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();
      
      // Check if cache is still valid
      if ((now - timestamp) < CACHE_DURATION_MS) {
        artifactsCache = JSON.parse(cachedData);
        artifactsCacheTimestamp = timestamp;
        console.log('📦 Loaded Apicurio artifacts from localStorage (age:', Math.round((now - timestamp) / 1000), 'seconds)');
      } else {
        // Cache expired, clear it
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to initialize Apicurio cache from localStorage:', error);
  }
}

// Initialize cache on module load
initializeCache();

// Clear the artifacts cache (useful for force refresh)
export function clearArtifactsCache() {
  artifactsCache = null;
  artifactsCacheTimestamp = 0;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage cache:', error);
  }
  console.log('📦 Apicurio artifacts cache cleared');
}

export interface ApicurioArtifact {
  artifactId: string;
  groupId: string;
  artifactType: string;
  name?: string;
  description?: string;
  createdOn?: string;
  modifiedOn?: string;
  version?: string;
}

export interface ApicurioSearchResponse {
  artifacts: ApicurioArtifact[];
  count: number;
}

// Search Apicurio artifacts by name pattern
export async function searchApicurioArtifacts(namePattern: string = 'Value'): Promise<ApicurioSearchResponse> {
  // Define 'now' before try block so it's accessible in catch
  const now = Date.now();
  
  try {
    // Check cache first
    if (artifactsCache && (now - artifactsCacheTimestamp) < CACHE_DURATION_MS) {
      console.log('📦 Using cached Apicurio artifacts (age:', Math.round((now - artifactsCacheTimestamp) / 1000), 'seconds)');
      return artifactsCache;
    }
    
    console.log('📦 Fetching fresh Apicurio artifacts from multiple groups...');
    
    // Fetch artifacts from multiple groups
    const groups = ['paradigm.bidtools', 'bfs.online'];
    const allArtifacts: ApicurioArtifact[] = [];
    let got403 = false;
    
    for (const group of groups) {
      try {
        const url = `${APICURIO_REGISTRY_URL}/groups/${group}/artifacts?limit=100`;
        console.log(`📦 Fetching from group: ${group}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        // Log CORS headers for debugging
        console.log(`📦 Response status (${group}):`, response.status);

        if (response.ok) {
          const groupData: ApicurioSearchResponse = await response.json();
          console.log(`📦 Loaded ${groupData.count} artifacts from ${group} group`);
          allArtifacts.push(...groupData.artifacts);
        } else if (response.status === 403) {
          console.log(`📦 Access forbidden (403) for group: ${group} - using local templates`);
          got403 = true;
          break; // Stop trying other groups on 403
        } else {
          console.log(`📦 Could not fetch from ${group} (status: ${response.status})`);
        }
      } catch (error) {
        // Silent handling - CORS is expected in browser environments
        // Just skip this group and continue
      }
    }

    // If we got 403 or no artifacts from any group, use mock data
    if (got403 || allArtifacts.length === 0) {
      console.log('📦 No artifacts loaded, using local Apicurio templates');
      const mockData = getMockApicurioArtifacts();
      
      // Cache mock data so subsequent opens are instant
      artifactsCache = mockData;
      artifactsCacheTimestamp = now;
      
      return mockData;
    }

    const data: ApicurioSearchResponse = {
      artifacts: allArtifacts,
      count: allArtifacts.length
    };
    console.log(`📦 Total artifacts loaded: ${data.count}`);
    
    // Update cache
    artifactsCache = data;
    artifactsCacheTimestamp = now;
    
    // Save to localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    } catch (error) {
      console.warn('Failed to save Apicurio cache to localStorage:', error);
    }
    
    return data;
  } catch (error: any) {
    // Return mock data for development (CORS or network issues)
    // Silently handle CORS - this is expected in some environments
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.log('📦 Using local Apicurio templates (18 available) - CORS blocked');
      const mockData = getMockApicurioArtifacts();
      
      // Cache mock data so subsequent opens are instant
      artifactsCache = mockData;
      artifactsCacheTimestamp = now;
      
      return mockData;
    }
    
    // Only log unexpected errors
    console.warn('⚠️ Apicurio Registry unavailable, using local templates');
    return getMockApicurioArtifacts();
  }
}

// Mock data for development when CORS blocks the request
function getMockApicurioArtifacts(): ApicurioSearchResponse {
  return {
    artifacts: [
      // CDC Format artifacts (version 1.0.0)
      {
        artifactId: "CDC_SQLServer_LineTypes",
        groupId: "paradigm.bidtools",
        artifactType: "AVRO",
        name: "LineTypes (CDC)",
        description: "CDC AVRO schema for LineTypes",
        createdOn: "2025-11-18T15:35:18Z",
        modifiedOn: "2025-11-18T15:35:18Z",
        version: "1.0.0"
      },
      {
        artifactId: "CDC_SQLServer_ServiceRequests",
        groupId: "paradigm.bidtools",
        artifactType: "AVRO",
        name: "ServiceRequests (CDC)",
        description: "CDC AVRO schema for ServiceRequests",
        createdOn: "2025-11-18T15:36:30Z",
        modifiedOn: "2025-11-18T15:36:30Z",
        version: "1.0.0"
      },
      {
        artifactId: "CDC_SQLServer_WorkflowCustomers",
        groupId: "paradigm.bidtools",
        artifactType: "AVRO",
        name: "WorkflowCustomers (CDC)",
        description: "CDC AVRO schema for WorkflowCustomers",
        createdOn: "2025-11-18T15:36:35Z",
        modifiedOn: "2025-11-18T15:36:35Z",
        version: "1.0.0"
      },
      // TxServices format artifacts (version 1.0.0)
      {
        artifactId: "TxServices_SQLServer_QuoteDetails.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "QuoteDetails",
        description: "JSON schema for QuoteDetails",
        createdOn: "2025-11-18T15:35:18Z",
        modifiedOn: "2025-11-18T15:35:18Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_SQLServer_QuotePacks.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "QuotePacks",
        description: "JSON schema for QuotePacks",
        createdOn: "2025-11-18T15:36:08Z",
        modifiedOn: "2025-11-18T15:36:08Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_SQLServer_Quotes.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "Quotes",
        description: "JSON schema for Quotes",
        createdOn: "2025-11-18T15:36:17Z",
        modifiedOn: "2025-11-18T15:36:17Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_SQLServer_ReasonCodes.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "ReasonCodes",
        description: "JSON schema for ReasonCodes",
        createdOn: "2025-11-18T15:36:25Z",
        modifiedOn: "2025-11-18T15:36:25Z",
        version: "1.0.0"
      },
      // bfs.online group artifacts (Informix schemas)
      {
        artifactId: "TxServices_Informix_loc1.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "loc1",
        description: "Response schema for Informix TxServices loc1",
        createdOn: "2025-11-24T16:31:35Z",
        modifiedOn: "2025-11-24T16:31:35Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_loc.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "loc",
        description: "Response schema for Informix TxServices loc",
        createdOn: "2025-11-24T16:28:04Z",
        modifiedOn: "2025-11-24T16:28:04Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_stcode.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "stcode",
        description: "Response schema for Informix TxServices stcode",
        createdOn: "2025-11-24T16:32:02Z",
        modifiedOn: "2025-11-24T16:32:02Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_inv.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "inv",
        description: "Response schema for Informix TxServices inv (Inventory)",
        createdOn: "2025-11-25T10:00:00Z",
        modifiedOn: "2025-11-25T10:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_inv1.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "inv1",
        description: "Response schema for Informix TxServices inv1 (Inventory variant 1)",
        createdOn: "2025-11-25T12:00:00Z",
        modifiedOn: "2025-11-25T12:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_inv2.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "inv2",
        description: "Response schema for Informix TxServices inv2 (Inventory variant 2)",
        createdOn: "2025-11-25T13:00:00Z",
        modifiedOn: "2025-11-25T13:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_inv3.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "inv3",
        description: "Response schema for Informix TxServices inv3 (Inventory variant 3)",
        createdOn: "2025-11-25T14:00:00Z",
        modifiedOn: "2025-11-25T14:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_invap.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "invap",
        description: "Response schema for Informix TxServices invap (Inventory AP)",
        createdOn: "2025-11-25T15:00:00Z",
        modifiedOn: "2025-11-25T15:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_invdes.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "invdes",
        description: "Response schema for Informix TxServices invdes (Inventory Descriptions)",
        createdOn: "2025-11-25T16:00:00Z",
        modifiedOn: "2025-11-25T16:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_invloc.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "invloc",
        description: "Response schema for Informix TxServices invloc (Inventory Location)",
        createdOn: "2025-11-25T17:00:00Z",
        modifiedOn: "2025-11-25T17:00:00Z",
        version: "1.0.0"
      },
      {
        artifactId: "TxServices_Informix_keyi.response",
        groupId: "bfs.online",
        artifactType: "JSON",
        name: "keyi",
        description: "Response schema for Informix TxServices keyi (Keyword Inventory)",
        createdOn: "2025-11-25T18:00:00Z",
        modifiedOn: "2025-11-25T18:00:00Z",
        version: "1.0.0"
      }
    ],
    count: 18
  };
}

// Get artifact content (schema) by groupId and artifactId
export async function getApicurioArtifact(groupId: string, artifactId: string, version?: string): Promise<any> {
  try {
    // Use version if provided (for CDC artifacts: 1.0.0), otherwise use 'latest'
    const versionPath = version || 'latest';
    const url = `${APICURIO_REGISTRY_URL}/groups/${encodeURIComponent(groupId)}/artifacts/${encodeURIComponent(artifactId)}/versions/${versionPath}/content`;
    
    console.log('📦 Fetching artifact from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Handle 403 Forbidden specifically - this is expected in browser environments
      if (response.status === 403) {
        console.log('📦 Access forbidden (using local template):', extractArtifactName(artifactId));
        return getMockArtifactSchema(artifactId);
      }
      
      console.error('❌ Apicurio API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error body:', errorText);
      throw new Error(`Apicurio API returned ${response.status}: ${errorText}`);
    }

    const schema = await response.json();
    console.log('📦 Loaded schema from Apicurio Registry:', artifactId);
    console.log('📦 Schema keys:', Object.keys(schema).join(', '));
    return schema;
  } catch (error: any) {
    // Return mock schema for development (CORS or network issues)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.log('📦 Using local schema template:', extractArtifactName(artifactId));
      return getMockArtifactSchema(artifactId);
    }
    
    // If error message contains "403" or "Forbidden", return mock data
    if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
      console.log('📦 Using local schema template (403):', extractArtifactName(artifactId));
      return getMockArtifactSchema(artifactId);
    }
    
    console.error('❌ Error fetching Apicurio artifact:', error);
    throw error;
  }
}

// Mock schema data for development
function getMockArtifactSchema(artifactId: string): any {
  // CDC Format schemas (Debezium Envelope)
  if (artifactId === 'CDC_SQLServer_LineTypes') {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "ENVELOPE",
      "type": "object",
      "properties": {
        "before": {
          "anyOf": [null, { "type": "object", "properties": {} }]
        },
        "after": {
          "anyOf": [
            {
              "title": "VALUE",
              "type": "object",
              "properties": {
                "LineTypeId": { "type": "integer" },
                "LineTypeCode": { "type": "string" },
                "Description": { "type": "string" },
                "ColorCode": { "type": ["string", "null"] },
                "SortOrder": { "type": "integer" },
                "SkuType": { "type": "integer" },
                "CategoryRequired": { "type": "integer" },
                "ManualCostRequired": { "type": "integer" },
                "ManualPriceRequired": { "type": "integer" },
                "IsNotesAllowed": { "type": "boolean" },
                "DefaultSku": { "type": ["string", "null"] },
                "DefaultDescription": { "type": ["string", "null"] },
                "DefaultCategory": { "type": ["string", "null"] },
                "DefaultQuantity": { "type": ["integer", "null"] },
                "ErpOrderLineType": { "type": ["string", "null"] },
                "ERP": { "type": "string" },
                "IsActive": { "type": "boolean" },
                "IsSkuTypeDefault": { "type": "boolean" },
                "EnforceQuantityOfOne": { "type": "boolean" },
                "IsInstallOnly": { "type": "boolean" }
              },
              "required": [
                "LineTypeId",
                "LineTypeCode",
                "Description",
                "SortOrder",
                "SkuType",
                "CategoryRequired",
                "ManualCostRequired",
                "ManualPriceRequired",
                "ERP",
                "IsActive"
              ]
            },
            null
          ]
        }
      }
    };
  } else if (artifactId === 'CDC_SQLServer_WorkflowCustomers') {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "ENVELOPE",
      "type": "object",
      "properties": {
        "before": {
          "anyOf": [null, { "type": "object", "properties": {} }]
        },
        "after": {
          "anyOf": [
            {
              "title": "VALUE",
              "type": "object",
              "properties": {
                "WorkflowCustomerId": { "type": "integer" },
                "OnlineAlphaCode": { "type": "string" },
                "CustomerName": { "type": "string" },
                "CreatedBy": { "type": ["string", "null"] },
                "CreatedDate": { "type": "string", "format": "date-time" },
                "LastModifiedBy": { "type": ["string", "null"] },
                "LastModifiedDate": { "type": ["string", "null"], "format": "date-time" },
                "CustomerErpSystem": { "type": ["string", "null"] },
                "DefaultWorkFlowMarketId": { "type": ["integer", "null"] },
                "DefaultWorkflowLocationId": { "type": ["integer", "null"] },
                "DefaultSalesRepResourceId": { "type": ["integer", "null"] },
                "GeoOverrideDefaultWorkFlowMarketId": { "type": ["integer", "null"] },
                "AccountType": { "type": ["string", "null"] }
              },
              "required": [
                "WorkflowCustomerId",
                "OnlineAlphaCode",
                "CustomerName",
                "CreatedDate"
              ]
            },
            null
          ]
        }
      }
    };
  } else if (artifactId === 'CDC_SQLServer_ServiceRequests') {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "ENVELOPE",
      "type": "object",
      "properties": {
        "before": {
          "anyOf": [null, { "type": "object", "properties": {} }]
        },
        "after": {
          "anyOf": [
            {
              "title": "VALUE",
              "type": "object",
              "properties": {
                "ServiceRequestId": { "type": "integer" },
                "RequestNumber": { "type": "string" },
                "CustomerId": { "type": "integer" },
                "RequestDate": { "type": "string", "format": "date-time" },
                "Status": { "type": "string" },
                "Priority": { "type": ["string", "null"] },
                "AssignedTo": { "type": ["string", "null"] },
                "Description": { "type": ["string", "null"] },
                "Resolution": { "type": ["string", "null"] },
                "CreatedBy": { "type": "string" },
                "CreatedDate": { "type": "string", "format": "date-time" },
                "LastModifiedBy": { "type": ["string", "null"] },
                "LastModifiedDate": { "type": ["string", "null"], "format": "date-time" }
              },
              "required": [
                "ServiceRequestId",
                "RequestNumber",
                "CustomerId",
                "RequestDate",
                "Status",
                "CreatedBy",
                "CreatedDate"
              ]
            },
            null
          ]
        }
      }
    };
  }
  
  // TxServices format artifacts
  if (artifactId.includes('QuotePacks')) {
    return {
      type: 'object',
      properties: {
        QuotePackId: { type: 'string', description: 'Quote Pack ID' },
        QuoteId: { type: 'string', description: 'Quote ID' },
        PackName: { type: 'string', description: 'Pack Name' },
        PackDescription: { type: ['string', 'null'], description: 'Pack Description' },
        TotalAmount: { type: 'number', description: 'Total Amount' },
        Status: { type: 'string', description: 'Status' },
        CreatedDate: { type: 'string', format: 'date-time', description: 'Created Date' },
        ModifiedDate: { type: ['string', 'null'], format: 'date-time', description: 'Modified Date' }
      },
      required: ['QuotePackId', 'QuoteId', 'PackName']
    };
  } else if (artifactId.includes('QuoteDetails')) {
    return {
      type: 'object',
      properties: {
        QuoteDetailId: { type: 'string', description: 'Quote Detail ID' },
        QuoteId: { type: 'string', description: 'Quote ID' },
        LineNumber: { type: 'number', description: 'Line Number' },
        ProductId: { type: 'string', description: 'Product ID' },
        Quantity: { type: 'number', description: 'Quantity' },
        UnitPrice: { type: 'number', description: 'Unit Price' },
        TotalPrice: { type: 'number', description: 'Total Price' },
        Description: { type: ['string', 'null'], description: 'Description' }
      },
      required: ['QuoteDetailId', 'QuoteId', 'LineNumber']
    };
  } else if (artifactId.includes('Quotes')) {
    return {
      type: 'object',
      properties: {
        QuoteId: { type: 'string', description: 'Quote ID' },
        CustomerId: { type: 'string', description: 'Customer ID' },
        QuoteNumber: { type: 'string', description: 'Quote Number' },
        QuoteDate: { type: 'string', format: 'date-time', description: 'Quote Date' },
        ExpirationDate: { type: ['string', 'null'], format: 'date-time', description: 'Expiration Date' },
        Status: { type: 'string', description: 'Status' },
        TotalAmount: { type: 'number', description: 'Total Amount' },
        Notes: { type: ['string', 'null'], description: 'Notes' }
      },
      required: ['QuoteId', 'CustomerId', 'QuoteNumber']
    };
  } else if (artifactId.includes('ReasonCodes')) {
    return {
      type: 'object',
      properties: {
        ReasonCodeId: { type: 'string', description: 'Reason Code ID' },
        Code: { type: 'string', description: 'Code' },
        Description: { type: 'string', description: 'Description' },
        Category: { type: ['string', 'null'], description: 'Category' },
        IsActive: { type: 'boolean', description: 'Is Active' }
      },
      required: ['ReasonCodeId', 'Code', 'Description']
    };
  }
  
  // Informix TxServices schemas (nested structure with TxnType + Txn.properties)
  if (artifactId.includes('loc1')) {
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "loccd": { "type": ["string", "null"] },
            "faxno": { "type": ["string", "null"] },
            "phone": { "type": ["string", "null"] },
            "defpt": { "type": ["string", "null"] },
            "defso": { "type": ["string", "null"] },
            "timezone": { "type": ["integer", "null"] },
            "mfgsite": { "type": ["string", "null"] },
            "labcst": { "type": ["string", "null"], "contentEncoding": "base64" },
            "comid": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "loccd" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('loc.')) {
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "loccd": { "type": ["string", "null"] },
            "lname": { "type": ["string", "null"] },
            "addr": { "type": ["string", "null"] },
            "city": { "type": ["string", "null"] },
            "state": { "type": ["string", "null"] },
            "zip": { "type": ["string", "null"] },
            "phone": { "type": ["string", "null"] },
            "faxno": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "loccd" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('stcode')) {
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "stcode": { "type": ["string", "null"] },
            "incode": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "incode" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('keyi')) {
    // keyi - Keyword Inventory schema with 2 fields (composite key: word + invid)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "word": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" },
                      "sourcePrimaryKeyFields": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": ["word", "invid"]
                        }
                      }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('invloc')) {
    // invloc - Inventory Location schema with 40 fields (composite key: loccd + invid + locstat + category)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "loccd": { "type": ["string", "null"] },
            "category": { "type": ["string", "null"] },
            "ustype": { "type": ["string", "null"] },
            "uncst": { "type": ["string", "null"], "contentEncoding": "base64" },
            "rplmtd": { "type": ["string", "null"] },
            "linept": { "type": ["string", "null"], "contentEncoding": "base64" },
            "orderpt": { "type": ["string", "null"], "contentEncoding": "base64" },
            "orderqty": { "type": ["string", "null"], "contentEncoding": "base64" },
            "mvclass": { "type": ["string", "null"] },
            "cstmtdid": { "type": ["string", "null"] },
            "subloccd": { "type": ["string", "null"] },
            "commcd": { "type": ["string", "null"] },
            "quhnd": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qucomm": { "type": ["string", "null"], "contentEncoding": "base64" },
            "quhold": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qupick": { "type": ["string", "null"], "contentEncoding": "base64" },
            "quwip": { "type": ["string", "null"], "contentEncoding": "base64" },
            "quord": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qualloc": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qutrfout": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qutrfin": { "type": ["string", "null"], "contentEncoding": "base64" },
            "qucost": { "type": ["string", "null"], "contentEncoding": "base64" },
            "estdt": { "type": ["integer", "null"] },
            "lcycdt": { "type": ["integer", "null"] },
            "lsaldt": { "type": ["integer", "null"] },
            "lrecdt": { "type": ["integer", "null"] },
            "frzstat": { "type": ["string", "null"] },
            "frzexpdt": { "type": ["integer", "null"] },
            "safety": { "type": ["string", "null"], "contentEncoding": "base64" },
            "oqtype": { "type": ["string", "null"] },
            "buyerid": { "type": ["string", "null"] },
            "saleusrt": { "type": ["string", "null"], "contentEncoding": "base64" },
            "trnsusrt": { "type": ["string", "null"], "contentEncoding": "base64" },
            "locstat": { "type": ["string", "null"] },
            "stdcst": { "type": ["string", "null"], "contentEncoding": "base64" },
            "stdcstdt": { "type": ["integer", "null"] },
            "nstdcst": { "type": ["string", "null"], "contentEncoding": "base64" },
            "routid": { "type": ["string", "null"] },
            "reorder": { "type": ["string", "null"], "contentEncoding": "base64" },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" },
                      "sourcePrimaryKeyFields": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": ["loccd", "invid", "locstat", "category"]
                        }
                      }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('invdes')) {
    // invdes - Inventory Descriptions schema with 6 fields (composite key: dsline + invid + prtpo)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "dsline": { "type": ["integer", "null"] },
            "des": { "type": ["string", "null"] },
            "prtso": { "type": ["string", "null"] },
            "prtin": { "type": ["string", "null"] },
            "prtpo": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" },
                      "sourcePrimaryKeyFields": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": ["dsline", "invid", "prtpo"]
                        }
                      }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('invap')) {
    // invap - Inventory AP schema with 13 fields (Accounts Payable/Vendor information)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "apnum": { "type": ["string", "null"] },
            "apinid": { "type": ["string", "null"] },
            "unms": { "type": ["string", "null"] },
            "prunms": { "type": ["string", "null"] },
            "ldays": { "type": ["integer", "null"] },
            "apucst": { "type": ["string", "null"], "contentEncoding": "base64" },
            "defddpo": { "type": ["string", "null"] },
            "upccode1": { "type": ["string", "null"] },
            "upccode2": { "type": ["string", "null"] },
            "cstclsscd": { "type": ["string", "null"] },
            "rvcycle": { "type": ["integer", "null"] },
            "rcunms": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" },
                      "sourcePrimaryKeyFields": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": ["invid", "apnum"]
                        }
                      }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('inv3')) {
    // inv3 - minimal schema with only 2 fields (invid and item_class)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "item_class": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('inv2')) {
    // inv2 - schema with 13 fields (classification codes and values)
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "nclsscd1": { "type": ["string", "null"] },
            "nclsscd2": { "type": ["string", "null"] },
            "nclsscd5": { "type": ["string", "null"] },
            "c8value1": { "type": ["string", "null"] },
            "c8value2": { "type": ["string", "null"] },
            "c8value3": { "type": ["string", "null"] },
            "c16value1": { "type": ["string", "null"] },
            "c16value2": { "type": ["string", "null"] },
            "c16value3": { "type": ["string", "null"] },
            "dec2value1": { "type": ["string", "null"], "contentEncoding": "base64" },
            "dec2value2": { "type": ["string", "null"], "contentEncoding": "base64" },
            "dec2value3": { "type": ["string", "null"], "contentEncoding": "base64" },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('inv1')) {
    // inv1 - simplified schema with only 4 fields
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "entby": { "type": ["string", "null"] },
            "entdte": { "type": ["integer", "null"] },
            "enttime": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  } else if (artifactId.includes('inv')) {
    // inv - full schema with 27 fields
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "TxnType": {
          "type": "string"
        },
        "Txn": {
          "type": "object",
          "properties": {
            "invid": { "type": ["string", "null"] },
            "invdes": { "type": ["string", "null"] },
            "ivstat": { "type": ["string", "null"] },
            "clsscd1": { "type": ["string", "null"] },
            "clsscd2": { "type": ["string", "null"] },
            "clsscd3": { "type": ["string", "null"] },
            "clsscd4": { "type": ["string", "null"] },
            "clsscd5": { "type": ["string", "null"] },
            "prclsscd": { "type": ["string", "null"] },
            "unms": { "type": ["string", "null"] },
            "factor": { "type": ["string", "null"], "contentEncoding": "base64" },
            "stdpkg": { "type": ["string", "null"] },
            "disqty": { "type": ["string", "null"] },
            "bomtype": { "type": ["string", "null"] },
            "buyerid": { "type": ["string", "null"] },
            "apnum": { "type": ["string", "null"] },
            "loccd": { "type": ["string", "null"] },
            "invwt": { "type": ["string", "null"], "contentEncoding": "base64" },
            "unprc": { "type": ["string", "null"], "contentEncoding": "base64" },
            "nunprc": { "type": ["string", "null"], "contentEncoding": "base64" },
            "estdt": { "type": ["integer", "null"] },
            "lactdt": { "type": ["integer", "null"] },
            "upccode1": { "type": ["string", "null"] },
            "upccode2": { "type": ["string", "null"] },
            "gltabid": { "type": ["string", "null"] },
            "cstunms": { "type": ["string", "null"] },
            "prcunms": { "type": ["string", "null"] },
            "metaData": {
              "type": "object",
              "properties": {
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sourceDatabase": { "type": "string" },
                      "sourceTable": { "type": "string" },
                      "sourceCreateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceUpdateTime": { "type": ["string", "null"], "format": "date-time" },
                      "sourceEtag": { "type": ["string", "null"] },
                      "eventType": { "type": "string" },
                      "correlationId": { "type": "string" },
                      "sourcePrimaryKeyField": { "type": "string", "const": "invid" },
                      "sourcePrimaryKeyFields": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": ["clsscd2", "invid", "ivstat"]
                        }
                      }
                    }
                  }
                }
              }
            },
            "createTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            },
            "updateTime": {
              "anyOf": [
                { "type": "string", "format": "date-time" },
                { "type": "null" }
              ]
            }
          }
        }
      }
    };
  }
  
  // Default generic schema
  return {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Record ID' },
      name: { type: 'string', description: 'Name' },
      description: { type: ['string', 'null'], description: 'Description' },
      createdDate: { type: 'string', format: 'date-time', description: 'Created Date' }
    },
    required: ['id']
  };
}

// Convert AVRO schema to JSON Schema format for Data Capture Spec
export function convertAvroToJsonSchema(avroSchema: any): any {
  try {
    // AVRO schema structure:
    // {
    //   "type": "record",
    //   "name": "QuotePacks",
    //   "namespace": "paradigm.bidtools.ppapdb_import.bfs",
    //   "fields": [...]
    // }
    
    if (avroSchema.type !== 'record' || !Array.isArray(avroSchema.fields)) {
      throw new Error('Invalid AVRO schema format');
    }

    const jsonSchema: any = {
      schemaVersion: 1,
      type: 'object',
      title: avroSchema.name || 'Schema',
      description: avroSchema.doc || `Generated from AVRO schema: ${avroSchema.namespace}.${avroSchema.name}`,
      properties: {},
      required: []
    };

    // Convert AVRO fields to JSON Schema properties
    avroSchema.fields.forEach((field: any) => {
      const fieldName = field.name;
      const fieldType = field.type;
      
      // Handle union types (e.g., ["null", "string"])
      let jsonType: string;
      let nullable = false;
      
      if (Array.isArray(fieldType)) {
        // Union type - find non-null type
        const nonNullTypes = fieldType.filter((t: any) => t !== 'null');
        nullable = fieldType.includes('null');
        jsonType = mapAvroTypeToJson(nonNullTypes[0]);
      } else {
        jsonType = mapAvroTypeToJson(fieldType);
      }

      jsonSchema.properties[fieldName] = {
        type: nullable ? [jsonType, 'null'] : jsonType,
        description: field.doc || ''
      };

      // Add to required if not nullable
      if (!nullable) {
        jsonSchema.required.push(fieldName);
      }
    });

    // Add standard IRC metadata structure
    jsonSchema.properties.id = {
      type: 'string',
      description: 'Document ID'
    };
    jsonSchema.properties.partitionKey = {
      type: 'string',
      description: 'Container partition key'
    };
    jsonSchema.properties.metaData = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceDatabase: { type: 'string' },
              sourceTable: { type: 'string' },
              sourcePrimaryKeyField: { type: 'string' },
              sourceCreateTime: { type: ['string', 'null'], format: 'date-time' },
              sourceUpdateTime: { type: ['string', 'null'], format: 'date-time' },
              sourceEtag: { type: ['string', 'null'] }
            }
          }
        }
      }
    };
    jsonSchema.properties.createTime = {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'Populated by txservices'
    };
    jsonSchema.properties.updateTime = {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'Populated by txservices'
    };

    if (!jsonSchema.required.includes('id')) {
      jsonSchema.required.push('id');
    }
    jsonSchema.unevaluatedProperties = true;

    return jsonSchema;
  } catch (error) {
    console.error(' Error converting AVRO to JSON Schema:', error);
    throw error;
  }
}

// Helper: Map AVRO type to JSON Schema type
function mapAvroTypeToJson(avroType: any): string {
  if (typeof avroType === 'string') {
    switch (avroType) {
      case 'string': return 'string';
      case 'int':
      case 'long':
      case 'float':
      case 'double': return 'number';
      case 'boolean': return 'boolean';
      case 'bytes': return 'string';
      default: return 'string';
    }
  } else if (typeof avroType === 'object') {
    if (avroType.type === 'array') return 'array';
    if (avroType.type === 'record') return 'object';
    if (avroType.type === 'map') return 'object';
  }
  return 'string';
}

// Extract readable name from artifactId
// e.g., "TxServices_SQLServer_QuotePacks.response" -> "QuotePacks"
// e.g., "CDC_SQLServer_LineTypes" -> "LineTypes"
export function extractArtifactName(artifactId: string): string {
  // If it's a UUID, return as-is
  if (artifactId.match(/^[a-f0-9-]{36}$/i)) {
    return artifactId;
  }
  
  // Handle CDC format: "CDC_SQLServer_LineTypes" -> "LineTypes"
  if (artifactId.includes('CDC_SQLServer_')) {
    const match = artifactId.match(/CDC_SQLServer_([\w]+)/);
    if (match) return match[1];
  }
  
  // Handle TxServices format: "TxServices_SQLServer_QuotePacks.response" -> "QuotePacks"
  if (artifactId.includes('TxServices_SQLServer_')) {
    const match = artifactId.match(/TxServices_SQLServer_([\w]+)/);
    if (match) return match[1];
  }
  
  // Handle TxServices Informix format: "TxServices_Informix_loc1.response" -> "loc1"
  if (artifactId.includes('TxServices_Informix_')) {
    const match = artifactId.match(/TxServices_Informix_([\w]+)/);
    if (match) return match[1];
  }
  
  // Handle old format: "paradigm.bidtools.ppapdb_import.bfs.QuotePacks.Value" -> "QuotePacks"
  const parts = artifactId.split('.');
  const withoutSuffix = artifactId.endsWith('.Value') || artifactId.endsWith('.response') 
    ? parts.slice(0, -1) 
    : parts;
  return withoutSuffix[withoutSuffix.length - 1] || artifactId;
}

// Get display name for artifact (prefer name field, fallback to artifactId)
export function getArtifactDisplayName(artifact: ApicurioArtifact): string {
  if (artifact.name) {
    return artifact.name;
  }
  return extractArtifactName(artifact.artifactId);
}

// Process schema - handle both JSON Schema and AVRO formats
export function processSchema(schema: any, artifactType: string): any {
  console.log('📦 Processing schema, artifactType:', artifactType);
  console.log('📦 Full schema:', JSON.stringify(schema, null, 2));
  
  // Handle CDC JSON Schema format (Debezium-style)
  // Structure: { properties: { after: { anyOf: [{ properties: {...} }, null] } } }
  if (schema.properties && schema.properties.after) {
    console.log('📦 Detected "properties.after" field - checking for CDC pattern');
    const afterField = schema.properties.after;
    
    // Check for anyOf pattern (union with null)
    if (afterField.anyOf && Array.isArray(afterField.anyOf)) {
      console.log('📦 Found "anyOf" pattern, extracting non-null schema');
      // Find the non-null schema
      const valueSchema = afterField.anyOf.find((s: any) => s && s.type === 'object' && s.properties);
      if (valueSchema) {
        const fieldNames = Object.keys(valueSchema.properties || {});
        console.log('📦 ✅ Detected CDC JSON Schema, extracting fields from "after.anyOf" record');
        console.log('📦 Found fields:', fieldNames);
        console.log('📦 Required fields:', valueSchema.required || []);
        
        // Extract properties from the CDC "after" field
        const cdcProperties = valueSchema.properties || {};
        const cdcRequired = valueSchema.required || [];
        
        // Create enhanced schema with CDC fields + IRC metadata
        return enhanceJsonSchemaWithIRCMetadata({
          schemaVersion: 1,
          type: 'object',
          title: valueSchema.title || schema.title || 'Schema',
          description: valueSchema.description || schema.description || 'Generated from CDC JSON Schema',
          properties: cdcProperties,
          required: cdcRequired
        });
      }
    }
    
    // Check for direct properties (no anyOf)
    if (afterField.properties) {
      const fieldNames = Object.keys(afterField.properties || {});
      console.log('📦 ✅ Detected CDC JSON Schema (direct), extracting fields from "after.properties"');
      console.log('📦 Found fields:', fieldNames);
      
      return enhanceJsonSchemaWithIRCMetadata({
        schemaVersion: 1,
        type: 'object',
        title: afterField.title || schema.title || 'Schema',
        description: afterField.description || schema.description || 'Generated from CDC JSON Schema',
        properties: afterField.properties,
        required: afterField.required || []
      });
    }
  }
  
  // Handle CDC AVRO format
  // These have structure like { type: "record", fields: [{ name: "after", type: { type: "record", fields: [...] } }] }
  if (artifactType === 'AVRO' && schema.type === 'record' && Array.isArray(schema.fields)) {
    console.log('📦 AVRO schema detected, checking for CDC pattern...');
    console.log('📦 Top-level fields:', schema.fields.map((f: any) => f.name).join(', '));
    
    // Check if this is a CDC schema (has 'after' field with nested record)
    const afterField = schema.fields.find((f: any) => f.name === 'after');
    if (afterField && afterField.type && Array.isArray(afterField.type)) {
      // Union type - find the record type
      const recordType = afterField.type.find((t: any) => t && typeof t === 'object' && t.type === 'record');
      if (recordType && Array.isArray(recordType.fields)) {
        const fieldNames = recordType.fields.map((f: any) => f.name);
        console.log('📦 ✅ Detected CDC AVRO schema (union type), extracting fields from "after" record');
        console.log('📦 After fields:', fieldNames);
        // Use the nested record schema instead
        return convertAvroToJsonSchema(recordType);
      }
    } else if (afterField && afterField.type && typeof afterField.type === 'object' && afterField.type.type === 'record') {
      // Direct record type (not union)
      const fieldNames = afterField.type.fields.map((f: any) => f.name);
      console.log('📦 ✅ Detected CDC AVRO schema (direct type), extracting fields from "after" record');
      console.log('📦 After fields:', fieldNames);
      return convertAvroToJsonSchema(afterField.type);
    }
    
    // Not a CDC schema, process normally
    console.log('📦 Not a CDC schema, processing as regular AVRO schema');
    return convertAvroToJsonSchema(schema);
  }
  
  // If it's already a JSON Schema, check if it needs enhancement
  if (schema.type === 'object' || schema.properties) {
    console.log('📦 JSON Schema detected');
    const fieldNames = Object.keys(schema.properties || {});
    console.log('📦 Found fields:', fieldNames);
    
    // If schema has TxnType and Txn structure (BFS Online CDC format), return as-is
    // This format already includes metaData with const/enum values that we must preserve
    if (schema.properties?.TxnType && schema.properties?.Txn) {
      console.log('📦 Detected BFS Online CDC format (TxnType + Txn), preserving structure as-is');
      return schema;
    }
    
    // Otherwise, enhance with IRC metadata
    console.log('📦 Enhancing with IRC metadata');
    return enhanceJsonSchemaWithIRCMetadata(schema);
  }
  
  // If it's AVRO, convert to JSON Schema
  if (artifactType === 'AVRO' && schema.type === 'record') {
    console.log('📦 AVRO schema detected, converting to JSON Schema');
    return convertAvroToJsonSchema(schema);
  }
  
  // Otherwise, return as-is wrapped in a JSON Schema structure
  console.log('📦 Unknown schema format, wrapping in JSON Schema structure');
  return enhanceJsonSchemaWithIRCMetadata(schema);
}

// Enhance existing JSON Schema with IRC metadata fields
function enhanceJsonSchemaWithIRCMetadata(jsonSchema: any): any {
  const enhanced = { ...jsonSchema };
  
  // Ensure we have the required structure
  if (!enhanced.properties) {
    enhanced.properties = {};
  }
  if (!enhanced.required) {
    enhanced.required = [];
  }
  
  // Add standard IRC fields if not present
  if (!enhanced.properties.id) {
    enhanced.properties.id = {
      type: 'string',
      description: 'Document ID'
    };
  }
  
  if (!enhanced.properties.partitionKey) {
    enhanced.properties.partitionKey = {
      type: 'string',
      description: 'Container partition key'
    };
  }
  
  // Only add metaData if it doesn't exist
  // If it exists, preserve it completely (don't overwrite const values, enum values, etc.)
  if (!enhanced.properties.metaData) {
    enhanced.properties.metaData = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceDatabase: { type: 'string' },
              sourceTable: { type: 'string' },
              sourcePrimaryKeyField: { type: 'string' },
              sourceCreateTime: { type: ['string', 'null'], format: 'date-time' },
              sourceUpdateTime: { type: ['string', 'null'], format: 'date-time' },
              sourceEtag: { type: ['string', 'null'] }
            }
          }
        }
      }
    };
  }
  
  if (!enhanced.properties.createTime) {
    enhanced.properties.createTime = {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'Populated by txservices'
    };
  }
  
  if (!enhanced.properties.updateTime) {
    enhanced.properties.updateTime = {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'Populated by txservices'
    };
  }
  
  // Ensure 'id' is in required fields
  if (!enhanced.required.includes('id')) {
    enhanced.required.push('id');
  }
  
  // Add schemaVersion and unevaluatedProperties if not present
  if (!enhanced.schemaVersion) {
    enhanced.schemaVersion = 1;
  }
  if (!enhanced.unevaluatedProperties) {
    enhanced.unevaluatedProperties = true;
  }
  
  return enhanced;
}