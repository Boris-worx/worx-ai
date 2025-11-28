// Apicurio Registry API Functions for Data Capture Specification templates
// NO MOCK DATA - Only real data from Apicurio Registry

const APICURIO_REGISTRY_URL = "https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io/apis/registry/v3";

// Only these two groups are used - hardcoded for fallback when 403
const KNOWN_GROUPS = [
  { id: 'paradigm.bidtools2', description: 'Bid Tools Templates' },
  { id: 'bfs.online', description: 'BFS Online Templates' },
];

// Cache for artifacts search results (avoid repeated API calls)
// Using localStorage for persistent cache + in-memory cache for speed
const CACHE_KEY = 'apicurio_artifacts_cache';
const CACHE_TIMESTAMP_KEY = 'apicurio_artifacts_timestamp';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

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

export interface ApicurioGroup {
  id: string;
  description?: string;
  createdOn?: string;
  modifiedOn?: string;
}

export interface ApicurioVersion {
  version: string;
  createdOn?: string;
  modifiedOn?: string;
  state?: string;
}

// ==================== DYNAMIC API FUNCTIONS ====================

// Get all groups from Apicurio Registry
export async function getApicurioGroups(): Promise<ApicurioGroup[]> {
  try {
    const url = `${APICURIO_REGISTRY_URL}/groups`;
    console.log('📦 Fetching all groups from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.log('📦 Access forbidden to groups list (using hardcoded groups)');
        // Return only known groups when API is blocked
        return KNOWN_GROUPS;
      }
      throw new Error(`Failed to fetch groups: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Fetched groups:', data.groups?.length || 0);
    
    // Filter to only return our two known groups even if API returns more
    const groups = data.groups || [];
    const filteredGroups = groups.filter((g: ApicurioGroup) => 
      KNOWN_GROUPS.some(kg => kg.id === g.id)
    );
    
    console.log('📦 Filtered to known groups:', filteredGroups.length);
    return filteredGroups.length > 0 ? filteredGroups : KNOWN_GROUPS;
  } catch (error) {
    console.error('❌ Error fetching Apicurio groups:', error);
    // Return only known groups on error
    return KNOWN_GROUPS;
  }
}

// Get all artifacts from a specific group
export async function getGroupArtifacts(groupId: string): Promise<ApicurioArtifact[]> {
  try {
    const url = `${APICURIO_REGISTRY_URL}/groups/${encodeURIComponent(groupId)}/artifacts?limit=100`;
    console.log(`📦 Fetching artifacts from group ${groupId}:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`📦 Access forbidden to group ${groupId}`);
        return [];
      }
      if (response.status === 404) {
        console.warn(`📦 Group ${groupId} not found`);
        return [];
      }
      throw new Error(`Failed to fetch artifacts for group ${groupId}: ${response.status}`);
    }

    const data = await response.json();
    const artifacts = data.artifacts || [];
    
    // Add groupId to each artifact
    const artifactsWithGroup = artifacts.map((artifact: any) => ({
      ...artifact,
      groupId: groupId,
    }));
    
    console.log(`📦 Fetched ${artifactsWithGroup.length} artifacts from group ${groupId}`);
    return artifactsWithGroup;
  } catch (error) {
    console.error(`❌ Error fetching artifacts for group ${groupId}:`, error);
    return [];
  }
}

// Get all versions of a specific artifact
export async function getArtifactVersions(groupId: string, artifactId: string): Promise<ApicurioVersion[]> {
  try {
    const url = `${APICURIO_REGISTRY_URL}/groups/${encodeURIComponent(groupId)}/artifacts/${encodeURIComponent(artifactId)}/versions`;
    console.log(`📦 Fetching versions for ${artifactId}:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`📦 Access forbidden to versions for ${artifactId}`);
        return [];
      }
      if (response.status === 404) {
        console.warn(`📦 Versions not found for ${artifactId}`);
        return [];
      }
      throw new Error(`Failed to fetch versions: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Fetched ${data.versions?.length || 0} versions for ${artifactId}`);
    return data.versions || [];
  } catch (error) {
    console.error(`❌ Error fetching versions for ${artifactId}:`, error);
    return [];
  }
}

// Get the latest version from a list of versions
export function getLatestVersion(versions: ApicurioVersion[]): string | null {
  if (!versions || versions.length === 0) {
    return null;
  }
  
  // Sort versions by creation date (most recent first)
  const sorted = [...versions].sort((a, b) => {
    if (!a.createdOn || !b.createdOn) return 0;
    return new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime();
  });
  
  return sorted[0]?.version || null;
}

// Get friendly display name for a group ID
export function getGroupDisplayName(groupId: string): string {
  const group = KNOWN_GROUPS.find(g => g.id === groupId);
  return group?.description || groupId;
}

// Get default version for a group (fallback when API doesn't return versions)
export function getDefaultVersionForGroup(groupId: string): string {
  // Known version patterns by group
  const defaultVersions: Record<string, string> = {
    'paradigm.bidtools2': '1',
    'bfs.online': '1.0.0',
  };
  
  return defaultVersions[groupId] || '1.0.0'; // Default to 1.0.0 for unknown groups
}

// ==================== END DYNAMIC API FUNCTIONS ====================

// Search Apicurio artifacts - ONLY REAL DATA FROM API
export async function searchApicurioArtifacts(namePattern: string = 'Value'): Promise<ApicurioSearchResponse> {
  const now = Date.now();
  
  try {
    // Check cache first
    if (artifactsCache && (now - artifactsCacheTimestamp) < CACHE_DURATION_MS) {
      console.log('📦 Using cached Apicurio artifacts (age:', Math.round((now - artifactsCacheTimestamp) / 1000), 'seconds)');
      return artifactsCache;
    }
    
    console.log('📦 🎯 DYNAMIC: Fetching groups and artifacts from Apicurio Registry...');
    
    // STEP 1: Get all groups dynamically (only our two known groups)
    const groups = await getApicurioGroups();
    console.log(`📦 🎯 Found ${groups.length} groups:`, groups.map(g => g.id).join(', '));
    
    // STEP 2: Fetch artifacts from all groups
    const allArtifacts: ApicurioArtifact[] = [];
    
    for (const group of groups) {
      try {
        const artifacts = await getGroupArtifacts(group.id);
        
        if (artifacts.length > 0) {
          console.log(`📦 ✅ Loaded ${artifacts.length} artifacts from ${group.id}`);
          allArtifacts.push(...artifacts);
        } else {
          console.log(`📦 ⚠️ No artifacts from ${group.id} (may be 403 or empty)`);
        }
      } catch (error) {
        console.warn(`📦 ⚠️ Error fetching from ${group.id}:`, error);
        // Continue with other groups
      }
    }

    // If no artifacts from any group, throw error
    if (allArtifacts.length === 0) {
      throw new Error('No artifacts available from Apicurio Registry. Please check API access.');
    }

    const data: ApicurioSearchResponse = {
      artifacts: allArtifacts,
      count: allArtifacts.length
    };
    console.log(`📦 ✅ Total artifacts loaded: ${data.count} from ${groups.length} groups`);
    
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
    console.error('❌ Apicurio Registry error:', error);
    
    // If we have cached data, use it even if expired
    if (artifactsCache) {
      console.log('📦 Using expired cache data due to API error');
      return artifactsCache;
    }
    
    // No cache available - return empty result
    console.error('❌ No artifacts available and no cache. Apicurio Registry is unavailable.');
    return {
      artifacts: [],
      count: 0
    };
  }
}

// Get artifact content (schema) by groupId and artifactId - ONLY REAL DATA
export async function getApicurioArtifact(groupId: string, artifactId: string, version?: string): Promise<any> {
  try {
    let versionPath: string;
    
    // STEP 1: If version not provided, fetch it dynamically from API
    if (!version) {
      console.log(`📦 🎯 DYNAMIC: Fetching versions for ${artifactId}...`);
      const versions = await getArtifactVersions(groupId, artifactId);
      
      if (versions.length > 0) {
        const latestVersion = getLatestVersion(versions);
        if (latestVersion) {
          versionPath = latestVersion;
          console.log(`📦 ✅ Using latest version from API: ${versionPath}`);
        } else {
          // No valid version found, use group-specific default
          versionPath = getDefaultVersionForGroup(groupId);
          console.log(`📦 ⚠️ No version in API response, using default for ${groupId}: ${versionPath}`);
        }
      } else {
        // Versions API returned empty array - use group-specific default
        versionPath = getDefaultVersionForGroup(groupId);
        console.log(`📦 ⚠️ Versions API returned empty, using default for ${groupId}: ${versionPath}`);
      }
    } else {
      versionPath = version;
      console.log(`📦 ℹ️ Using provided version: ${versionPath}`);
    }
    
    // STEP 2: Fetch artifact content with the determined version
    const url = `${APICURIO_REGISTRY_URL}/groups/${encodeURIComponent(groupId)}/artifacts/${encodeURIComponent(artifactId)}/versions/${versionPath}/content`;
    
    console.log('📦 🎯 Fetching artifact from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Apicurio API error ${response.status}:`, errorText);
      throw new Error(`Failed to fetch artifact ${artifactId}: ${response.status} - ${errorText}`);
    }

    const schema = await response.json();
    console.log('📦 ✅ Loaded schema from Apicurio Registry:', artifactId);
    console.log('📦 Schema keys:', Object.keys(schema).join(', '));
    return schema;
  } catch (error: any) {
    console.error('❌ Error fetching Apicurio artifact:', error);
    throw error;
  }
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

// Export Apicurio configuration for testing
export function getApicurioConfig() {
  return {
    baseUrl: 'https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io',
    apiUrl: APICURIO_REGISTRY_URL,
    groups: KNOWN_GROUPS.map(g => g.id)
  };
}
