/**
 * Centralized data cache for instant loading
 * Data is cached at module level and shared across all components
 */

import { Tenant, Transaction, DataSource, Application, TransactionSpecification } from './api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  // Cache TTL (time to live)
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes
  
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Specific cache keys
  tenantsKey = () => 'tenants';
  transactionTypesKey = () => 'transactionTypes';
  transactionsKey = (type: string, tenantId: string) => `transactions:${type}:${tenantId}`;
  dataSourcesKey = (tenantId: string) => `dataSources:${tenantId}`;
  applicationsKey = (tenantId: string) => `applications:${tenantId}`;
  transactionSpecsKey = (appId: string, tenantId: string) => `transactionSpecs:${appId}:${tenantId}`;
  modelSchemasKey = () => 'modelSchemas';
}

export const dataCache = new DataCache();

// Invalidate cache when user changes (for security)
export function invalidateUserSpecificCache() {
  dataCache.clear();
}

// Invalidate cache for a specific tenant
export function invalidateTenantCache(tenantId: string) {
  dataCache.invalidatePattern(new RegExp(`:${tenantId}$`));
}
