/**
 * Cached API wrappers for instant data access
 * Falls back to cache while fetching fresh data in background
 */

import { dataCache } from './dataCache';
import {
  getAllTenants,
  loadTransactionTypes,
  getTransactionsByType,
  getAllDataSources,
  getApplications,
  getTransactionSpecifications,
  getAllModelSchemas,
  Tenant,
  Transaction,
  DataSource,
  Application,
  TransactionSpecification,
  ModelSchema,
} from './api';

/**
 * Cached wrapper for getAllTenants
 * Returns cached data instantly, refreshes in background
 */
export async function getCachedTenants(forceRefresh = false): Promise<Tenant[]> {
  const cacheKey = dataCache.tenantsKey();
  
  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cached = dataCache.get<Tenant[]>(cacheKey);
    if (cached) {
      console.log('📦 Using cached tenants');
      // Refresh in background
      getAllTenants().then(data => {
        dataCache.set(cacheKey, data);
      }).catch(console.error);
      return cached;
    }
  }
  
  // Fetch fresh data
  const data = await getAllTenants();
  dataCache.set(cacheKey, data);
  return data;
}

/**
 * Cached wrapper for loadTransactionTypes
 */
export async function getCachedTransactionTypes(forceRefresh = false): Promise<string[]> {
  const cacheKey = dataCache.transactionTypesKey();
  
  if (!forceRefresh) {
    const cached = dataCache.get<string[]>(cacheKey);
    if (cached) {
      console.log('📦 Using cached transaction types');
      loadTransactionTypes().then(data => {
        dataCache.set(cacheKey, data);
      }).catch(console.error);
      return cached;
    }
  }
  
  const data = await loadTransactionTypes();
  dataCache.set(cacheKey, data);
  return data;
}

/**
 * Cached wrapper for getTransactionsByType
 */
export async function getCachedTransactions(
  txnType: string,
  tenantId: string,
  forceRefresh = false
): Promise<Transaction[]> {
  const cacheKey = dataCache.transactionsKey(txnType, tenantId);
  
  if (!forceRefresh) {
    const cached = dataCache.get<Transaction[]>(cacheKey);
    if (cached) {
      console.log(`📦 Using cached transactions for ${txnType}`);
      getTransactionsByType(txnType, tenantId === 'global' ? undefined : tenantId).then(response => {
        dataCache.set(cacheKey, response.data);
      }).catch(console.error);
      return cached;
    }
  }
  
  const response = await getTransactionsByType(txnType, tenantId === 'global' ? undefined : tenantId);
  dataCache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Cached wrapper for getAllDataSources
 */
export async function getCachedDataSources(
  tenantId: string,
  forceRefresh = false
): Promise<DataSource[]> {
  const cacheKey = dataCache.dataSourcesKey(tenantId);
  
  if (!forceRefresh) {
    const cached = dataCache.get<DataSource[]>(cacheKey);
    if (cached) {
      console.log(`📦 Using cached data sources for ${tenantId}`);
      getAllDataSources(tenantId === 'global' ? undefined : tenantId).then(data => {
        dataCache.set(cacheKey, data);
      }).catch(console.error);
      return cached;
    }
  }
  
  const data = await getAllDataSources(tenantId === 'global' ? undefined : tenantId);
  dataCache.set(cacheKey, data);
  return data;
}

/**
 * Cached wrapper for getApplications
 */
export async function getCachedApplications(
  tenantId: string,
  forceRefresh = false
): Promise<Application[]> {
  const cacheKey = dataCache.applicationsKey(tenantId);
  
  if (!forceRefresh) {
    const cached = dataCache.get<Application[]>(cacheKey);
    if (cached) {
      console.log(`📦 Using cached applications for ${tenantId}`);
      getApplications(tenantId === 'global' ? undefined : tenantId).then(data => {
        dataCache.set(cacheKey, data);
      }).catch(console.error);
      return cached;
    }
  }
  
  const data = await getApplications(tenantId === 'global' ? undefined : tenantId);
  dataCache.set(cacheKey, data);
  return data;
}

/**
 * Cached wrapper for getTransactionSpecifications
 */
export async function getCachedTransactionSpecs(
  appId: string,
  tenantId: string,
  forceRefresh = false
): Promise<TransactionSpecification[]> {
  const cacheKey = dataCache.transactionSpecsKey(appId, tenantId);
  
  if (!forceRefresh) {
    const cached = dataCache.get<TransactionSpecification[]>(cacheKey);
    if (cached) {
      console.log(`📦 Using cached specs for ${appId}`);
      getTransactionSpecifications(appId, tenantId === 'global' ? undefined : tenantId).then(data => {
        dataCache.set(cacheKey, data);
      }).catch(console.error);
      return cached;
    }
  }
  
  const data = await getTransactionSpecifications(appId, tenantId === 'global' ? undefined : tenantId);
  dataCache.set(cacheKey, data);
  return data;
}

/**
 * Cached wrapper for getAllModelSchemas
 */
export async function getCachedModelSchemas(forceRefresh = false): Promise<ModelSchema[]> {
  const cacheKey = dataCache.modelSchemasKey();
  
  if (!forceRefresh) {
    const cached = dataCache.get<ModelSchema[]>(cacheKey);
    if (cached) {
      console.log('📦 Using cached model schemas');
      getAllModelSchemas().then(data => {
        dataCache.set(cacheKey, data.filter(s => s && s.state !== 'deleted'));
      }).catch(console.error);
      return cached;
    }
  }
  
  const data = await getAllModelSchemas();
  const filtered = data.filter(s => s && s.state !== 'deleted');
  dataCache.set(cacheKey, filtered);
  return filtered;
}

/**
 * Invalidate all caches (use after mutations)
 */
export function invalidateAllCaches() {
  dataCache.clear();
}

/**
 * Invalidate specific cache
 */
export function invalidateCache(type: 'tenants' | 'transactionTypes' | 'modelSchemas') {
  switch (type) {
    case 'tenants':
      dataCache.invalidate(dataCache.tenantsKey());
      break;
    case 'transactionTypes':
      dataCache.invalidate(dataCache.transactionTypesKey());
      break;
    case 'modelSchemas':
      dataCache.invalidate(dataCache.modelSchemasKey());
      break;
  }
}
