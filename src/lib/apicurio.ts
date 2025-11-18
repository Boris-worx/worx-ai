// Apicurio Registry API Functions for Data Capture Specification templates

const APICURIO_REGISTRY_URL = "https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io/apis/registry/v3";

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
  try {
    // Search all artifacts without name filter to get all available schemas
    const url = `${APICURIO_REGISTRY_URL}/search/artifacts`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Apicurio API returned ${response.status}`);
    }

    const data: ApicurioSearchResponse = await response.json();
    console.log(`📦 Loaded ${data.count} Apicurio artifacts from registry`);
    return data;
  } catch (error: any) {
    // Return mock data for development (CORS or network issues)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.log('📦 Using local Apicurio templates (4 available)');
      return getMockApicurioArtifacts();
    }
    
    console.error('❌ Error searching Apicurio artifacts:', error);
    throw error;
  }
}

// Mock data for development when CORS blocks the request
function getMockApicurioArtifacts(): ApicurioSearchResponse {
  return {
    artifacts: [
      {
        artifactId: "TxServices_SQLServer_QuoteDetails.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "TxServices_SQLServer_QuoteDetails.response",
        description: "Response schema for SQL Server TxServices QuoteDetails",
        createdOn: "2025-11-18T15:35:18Z",
        modifiedOn: "2025-11-18T15:35:18Z"
      },
      {
        artifactId: "TxServices_SQLServer_QuotePacks.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "TxServices_SQLServer_QuotePacks.response",
        description: "Response schema for SQL Server TxServices QuotePacks",
        createdOn: "2025-11-18T15:36:08Z",
        modifiedOn: "2025-11-18T15:36:08Z"
      },
      {
        artifactId: "TxServices_SQLServer_Quotes.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "TxServices_SQLServer_Quotes.response",
        description: "Response schema for SQL Server TxServices Quotes",
        createdOn: "2025-11-18T15:36:17Z",
        modifiedOn: "2025-11-18T15:36:17Z"
      },
      {
        artifactId: "TxServices_SQLServer_ReasonCodes.response",
        groupId: "paradigm.bidtools",
        artifactType: "JSON",
        name: "TxServices_SQLServer_ReasonCodes.response",
        description: "Response schema for SQL Server TxServices ReasonCodes",
        createdOn: "2025-11-18T15:36:25Z",
        modifiedOn: "2025-11-18T15:36:25Z"
      }
    ],
    count: 4
  };
}

// Get artifact content (schema) by groupId and artifactId
export async function getApicurioArtifact(groupId: string, artifactId: string): Promise<any> {
  try {
    const url = `${APICURIO_REGISTRY_URL}/groups/${encodeURIComponent(groupId)}/artifacts/${encodeURIComponent(artifactId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Apicurio API returned ${response.status}`);
    }

    const schema = await response.json();
    console.log('📦 Loaded schema from Apicurio Registry:', artifactId);
    return schema;
  } catch (error: any) {
    // Return mock schema for development (CORS or network issues)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.log('📦 Using local schema template:', extractArtifactName(artifactId));
      return getMockArtifactSchema(artifactId);
    }
    
    console.error('❌ Error fetching Apicurio artifact:', error);
    throw error;
  }
}

// Mock schema data for development
function getMockArtifactSchema(artifactId: string): any {
  // Generic schema based on artifact type
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
    console.error('❌ Error converting AVRO to JSON Schema:', error);
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
// e.g., "paradigm.bidtools.ppapdb_import.bfs.QuotePacks.Value" -> "QuotePacks"
// e.g., "TxServices_SQLServer_QuotePacks.response" -> "QuotePacks"
export function extractArtifactName(artifactId: string): string {
  // If it's a UUID, return as-is
  if (artifactId.match(/^[a-f0-9-]{36}$/i)) {
    return artifactId;
  }
  
  // Handle new format: "TxServices_SQLServer_QuotePacks.response"
  if (artifactId.includes('TxServices_SQLServer_')) {
    const match = artifactId.match(/TxServices_SQLServer_(\w+)/);
    if (match) return match[1];
  }
  
  // Handle old format: "paradigm.bidtools.ppapdb_import.bfs.QuotePacks.Value"
  const parts = artifactId.split('.');
  const withoutSuffix = artifactId.endsWith('.Value') ? parts.slice(0, -1) : parts;
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
  // If it's already a JSON Schema, enhance it with IRC metadata
  if (schema.type === 'object' || schema.properties) {
    return enhanceJsonSchemaWithIRCMetadata(schema);
  }
  
  // If it's AVRO, convert to JSON Schema
  if (artifactType === 'AVRO' && schema.type === 'record') {
    return convertAvroToJsonSchema(schema);
  }
  
  // Otherwise, return as-is wrapped in a JSON Schema structure
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