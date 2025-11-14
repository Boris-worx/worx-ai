// Utility functions for working with Apicurio Registry artifacts

import { ApicurioArtifact } from './api';

/**
 * Get all artifacts (not just JSON) from Apicurio for a data source
 * This includes AVRO, JSON, PROTOBUF, etc.
 */
export function getAllArtifactsForDataSource(
  dataSourceName: string,
  allArtifacts: ApicurioArtifact[]
): ApicurioArtifact[] {
  // Group mappings
  const groupIdMap: Record<string, string> = {
    'BFS': 'bfs.online',
    'BFS.online': 'bfs.online',
    'bfs.online': 'bfs.online',
    'Bidtools': 'paradigm.mybldr.bidtools',
    'BIDTOOLS': 'paradigm.mybldr.bidtools',
    'bidtools': 'paradigm.mybldr.bidtools',
    'TxServices': 'paradigm.txservices',
    'Quotes': 'paradigm.txservices.quotes',
    'Customers': 'paradigm.txservices.customers',
  };

  const targetGroupId = groupIdMap[dataSourceName];
  
  if (!targetGroupId) {
    // Try fuzzy match
    return allArtifacts.filter(artifact => 
      artifact.groupId?.toLowerCase().includes(dataSourceName.toLowerCase()) ||
      dataSourceName.toLowerCase().includes(artifact.groupId?.toLowerCase() || '')
    );
  }

  return allArtifacts.filter(artifact => artifact.groupId === targetGroupId);
}

/**
 * Extract a human-readable name from an artifact ID
 * Examples:
 *   "bfs.QuoteDetails.json" -> "QuoteDetails"
 *   "bidtools.Quotes-key" -> "Quotes"
 *   "bfs.ServiceRequests" -> "ServiceRequests"
 */
export function extractArtifactName(artifactId: string): string {
  return artifactId
    .replace(/^(bfs|bidtools|paradigm)\./i, '') // Remove prefix
    .replace(/\.(json|avro|proto)$/i, '')       // Remove extension
    .replace(/-key$/i, '')                       // Remove -key suffix
    .replace(/[-_]/g, ' ')                       // Replace dashes/underscores with spaces
    .trim();
}

/**
 * Get artifact type icon/emoji
 */
export function getArtifactTypeIcon(type: string): string {
  switch (type.toUpperCase()) {
    case 'JSON':
      return '📄';
    case 'AVRO':
      return '🔷';
    case 'PROTOBUF':
    case 'PROTO':
      return '📦';
    default:
      return '📋';
  }
}

/**
 * Get artifact type color for badges
 */
export function getArtifactTypeColor(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type.toUpperCase()) {
    case 'JSON':
      return 'default';
    case 'AVRO':
      return 'secondary';
    case 'PROTOBUF':
    case 'PROTO':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Check if artifact is a key schema (Debezium convention)
 */
export function isKeySchema(artifactId: string): boolean {
  return artifactId.toLowerCase().endsWith('-key');
}

/**
 * Check if artifact is a value schema
 */
export function isValueSchema(artifactId: string): boolean {
  return !isKeySchema(artifactId);
}

/**
 * Group artifacts by entity name (pairing keys and values)
 * Example: "bidtools.Quotes-key" and "bfs.Quotes" both map to "Quotes"
 */
export function groupArtifactsByEntity(artifacts: ApicurioArtifact[]): Map<string, ApicurioArtifact[]> {
  const groups = new Map<string, ApicurioArtifact[]>();
  
  artifacts.forEach(artifact => {
    const entityName = extractArtifactName(artifact.id);
    
    if (!groups.has(entityName)) {
      groups.set(entityName, []);
    }
    
    groups.get(entityName)!.push(artifact);
  });
  
  return groups;
}
