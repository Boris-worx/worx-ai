import { useState, useEffect, useCallback } from 'react';
import { getAllTenants, loadTransactionTypes, Tenant } from './api';
import { searchApicurioArtifacts, ApicurioArtifact } from './apicurio';

export interface PreloadState {
  isPreloading: boolean;
  progress: number;
  currentTask: string;
  error: string | null;
  isComplete: boolean;
}

export interface PreloadedData {
  tenants: Tenant[];
  apicurioArtifacts: ApicurioArtifact[];
  transactionTypes: string[];
}

export function useDataPreloader() {
  const [state, setState] = useState<PreloadState>({
    isPreloading: true,
    progress: 0,
    currentTask: '',
    error: null,
    isComplete: false,
  });

  const [data, setData] = useState<PreloadedData>({
    tenants: [],
    apicurioArtifacts: [],
    transactionTypes: [],
  });

  const preloadData = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        currentTask: 'Loading essential data...',
        progress: 10,
      }));

      // Load all data in PARALLEL instead of sequentially
      const [tenantsResult, transactionTypesResult, apicurioResult] = await Promise.allSettled([
        getAllTenants(),
        loadTransactionTypes(),
        searchApicurioArtifacts('Value').catch(err => {
          console.warn('⚠️ Failed to preload Apicurio artifacts:', err);
          return { artifacts: [], count: 0 };
        }),
      ]);

      // Process tenants
      let sortedTenants: Tenant[] = [];
      if (tenantsResult.status === 'fulfilled') {
        sortedTenants = [...tenantsResult.value].sort((a, b) => {
          const dateA = a.CreateTime ? new Date(a.CreateTime).getTime() : 0;
          const dateB = b.CreateTime ? new Date(b.CreateTime).getTime() : 0;
          return dateB - dateA;
        });
      }

      setState(prev => ({
        ...prev,
        progress: 70,
      }));

      // Process transaction types
      const transactionTypes = transactionTypesResult.status === 'fulfilled' 
        ? transactionTypesResult.value 
        : [];

      // Process Apicurio artifacts
      const apicurioArtifacts = apicurioResult.status === 'fulfilled' 
        ? apicurioResult.value.artifacts 
        : [];

      if (apicurioResult.status === 'fulfilled') {
        console.log(`✅ Preloaded ${apicurioResult.value.count} Apicurio artifacts`);
      }

      // Complete
      setData({
        tenants: sortedTenants,
        apicurioArtifacts,
        transactionTypes,
      });

      setState({
        isPreloading: false,
        progress: 100,
        currentTask: 'Ready',
        error: null,
        isComplete: true,
      });

      console.log('✅ Data preload complete (parallel loading)');
    } catch (error: any) {
      console.error('❌ Preload error:', error);
      
      // Don't block the app if preload fails
      setState({
        isPreloading: false,
        progress: 100,
        currentTask: 'Ready (with errors)',
        error: error.message || 'Failed to preload data',
        isComplete: true,
      });
    }
  }, []);

  useEffect(() => {
    preloadData();
  }, [preloadData]);

  return {
    state,
    data,
    retry: preloadData,
  };
}
