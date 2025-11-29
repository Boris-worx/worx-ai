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

const PRELOAD_TASKS = [
  { id: 'tenants', label: 'Loading tenants...', weight: 30 },
  { id: 'transactionTypes', label: 'Loading transaction types...', weight: 30 },
  { id: 'apicurio', label: 'Loading Apicurio schemas...', weight: 40 },
];

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
    let accumulatedProgress = 0;

    try {
      // Task 1: Load tenants
      setState(prev => ({
        ...prev,
        currentTask: PRELOAD_TASKS[0].label,
        progress: 0,
      }));

      const tenants = await getAllTenants();
      
      // Sort by CreateTime descending (newest first)
      const sortedTenants = [...tenants].sort((a, b) => {
        const dateA = a.CreateTime ? new Date(a.CreateTime).getTime() : 0;
        const dateB = b.CreateTime ? new Date(b.CreateTime).getTime() : 0;
        return dateB - dateA;
      });

      accumulatedProgress += PRELOAD_TASKS[0].weight;
      setState(prev => ({
        ...prev,
        progress: accumulatedProgress,
      }));

      // Task 2: Load transaction types
      setState(prev => ({
        ...prev,
        currentTask: PRELOAD_TASKS[1].label,
      }));

      const transactionTypes = await loadTransactionTypes();
      
      accumulatedProgress += PRELOAD_TASKS[1].weight;
      setState(prev => ({
        ...prev,
        progress: accumulatedProgress,
      }));

      // Task 3: Load Apicurio artifacts
      setState(prev => ({
        ...prev,
        currentTask: PRELOAD_TASKS[2].label,
      }));

      let apicurioArtifacts: ApicurioArtifact[] = [];
      try {
        const response = await searchApicurioArtifacts('Value');
        apicurioArtifacts = response.artifacts;
        console.log(`✅ Preloaded ${response.count} Apicurio artifacts`);
      } catch (error) {
        console.warn('⚠️ Failed to preload Apicurio artifacts, will use fallback:', error);
        // Don't fail the entire preload if Apicurio fails
      }

      accumulatedProgress += PRELOAD_TASKS[2].weight;

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

      console.log('✅ Data preload complete');
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
