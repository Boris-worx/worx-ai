import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { 
  Building2, 
  Receipt, 
  Database, 
  FileJson, 
  ListIcon,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Tenant, 
  DataSource, 
  getDataCaptureSpecs,
  getAllDataCaptureSpecs,
  loadTransactionTypes,
  getTransactionsByType,
  TRANSACTION_TYPES_INFO 
} from '../lib/api';

interface DashboardViewProps {
  tenants: Tenant[];
  dataSources: DataSource[];
  activeTenantId: string;
  isLoadingTenants: boolean;
  isLoadingDataSources: boolean;
  userRole: string;
}

interface TransactionTypeCount {
  type: string;
  count: number;
}

interface DataCaptureSpec {
  DataSourceId?: string;
  DatasourceId?: string;
  DataCaptureSpecId?: string;
  DataCaptureSpecName?: string;
  [key: string]: any;
}

const COLORS = ['#60a5fa', '#93c5fd', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];

export function DashboardView({
  tenants,
  dataSources,
  activeTenantId,
  isLoadingTenants,
  isLoadingDataSources,
  userRole,
}: DashboardViewProps) {
  const [transactionTypeCounts, setTransactionTypeCounts] = useState<TransactionTypeCount[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [dataCaptureSpecsCount, setDataCaptureSpecsCount] = useState<number>(0);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(true);
  const [allDataCaptureSpecs, setAllDataCaptureSpecs] = useState<DataCaptureSpec[]>([]);

  // Load transaction type counts from Data Plane
  useEffect(() => {
    const loadTransactionCounts = async () => {
      setIsLoadingTransactions(true);
      console.log('📊 [Dashboard] Loading transaction counts for tenant:', activeTenantId);
      try {
        // Get list of transaction types using API function
        const types = await loadTransactionTypes();
        console.log('✅ [Dashboard] Loaded transaction types:', types.length, types);
        
        // Load counts for each type using getTransactionsByType API
        const countsPromises = types.map(async (type: string) => {
          try {
            const result = await getTransactionsByType(
              type,
              undefined, // no continuation token
              activeTenantId === 'global' ? undefined : activeTenantId
            );
            
            const count = result.totalCount || result.transactions.length;
            console.log(`📊 [Dashboard] Type ${type}: ${count} transactions`);
            return { type, count };
          } catch (error: any) {
            // Silently handle errors for unsupported types
            if (error.message === 'CORS_ERROR') {
              console.log(`ℹ️ [Dashboard] Type ${type} skipped (CORS/unsupported)`);
            } else {
              console.warn(`⚠️ [Dashboard] Error loading count for ${type}:`, error.message);
            }
            return { type, count: 0 };
          }
        });

        const counts = await Promise.all(countsPromises);
        console.log('✅ [Dashboard] Transaction counts loaded:', counts);
        setTransactionTypeCounts(counts);
        setTotalTransactions(counts.reduce((sum, item) => sum + item.count, 0));
      } catch (error) {
        console.error('❌ [Dashboard] Error loading transaction counts:', error);
        setTransactionTypeCounts([]);
        setTotalTransactions(0);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    loadTransactionCounts();
  }, [activeTenantId]);

  // Load Data Capture Specifications count
  useEffect(() => {
    const loadDataCaptureSpecs = async () => {
      setIsLoadingSpecs(true);
      console.log('📊 [Dashboard] Loading data capture specs for tenant:', activeTenantId);
      try {
        // Use API function to get specs with proper tenant filtering
        const specs = await (activeTenantId === 'global' ? getAllDataCaptureSpecs() : getDataCaptureSpecs(activeTenantId));
        console.log('✅ [Dashboard] Data capture specs loaded:', specs.length, specs);
        console.log('🔍 [Dashboard] Sample spec:', specs[0]);
        console.log('🔍 [Dashboard] All spec DataSourceIds:', specs.map(s => s.DatasourceId || s.DataSourceId));
        setDataCaptureSpecsCount(specs.length);
        setAllDataCaptureSpecs(specs);
      } catch (error) {
        console.error('❌ [Dashboard] Error loading data capture specs:', error);
        setDataCaptureSpecsCount(0);
        setAllDataCaptureSpecs([]);
      } finally {
        setIsLoadingSpecs(false);
      }
    };

    loadDataCaptureSpecs();
  }, [activeTenantId]);

  // Filter data sources by tenant
  const filteredDataSources = dataSources.filter(
    ds => activeTenantId === 'global' || ds.TenantId === activeTenantId
  );

  // Debug: Log data sources state
  useEffect(() => {
    console.log('📊 [Dashboard] Data Sources state:', {
      totalDataSources: dataSources.length,
      filteredDataSources: filteredDataSources.length,
      activeTenantId,
      isLoadingDataSources,
      sampleDataSource: dataSources[0]
    });
  }, [dataSources, filteredDataSources, activeTenantId, isLoadingDataSources]);

  // Prepare chart data
  const chartData = transactionTypeCounts
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 types

  // Prepare pie chart data - group by Data Source
  const pieData = useMemo(() => {
    // Group transaction counts by Data Source
    const dataSourceGroups = new Map<string, number>();
    
    // Iterate through all transaction types and sum counts by dataSourceId
    TRANSACTION_TYPES_INFO.forEach(typeInfo => {
      const typeCount = transactionTypeCounts.find(tc => tc.type === typeInfo.name);
      const count = typeCount?.count || 0;
      
      if (count > 0) {
        const currentTotal = dataSourceGroups.get(typeInfo.dataSourceId) || 0;
        dataSourceGroups.set(typeInfo.dataSourceId, currentTotal + count);
      }
    });
    
    // Find data source names
    const getDataSourceName = (id: string): string => {
      const ds = filteredDataSources.find(d => (d.DatasourceId || d.DataSourceId) === id);
      return ds?.DatasourceName || ds?.DataSourceName || id;
    };
    
    // Convert to array and sort by count
    const result = Array.from(dataSourceGroups.entries())
      .map(([dataSourceId, count]) => ({
        name: getDataSourceName(dataSourceId),
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
    
    console.log('📊 [Dashboard] Pie Chart Data (grouped by Data Source):', result);
    
    return result;
  }, [transactionTypeCounts, filteredDataSources]);

  // Prepare area chart data - cumulative distribution
  const areaData = useMemo(() => {
    // Sort transaction types by count descending
    const sortedTypes = transactionTypeCounts
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
    
    // Create data points with cumulative values
    let cumulative = 0;
    const result = sortedTypes.map((item, index) => {
      cumulative += item.count;
      return {
        name: item.type.length > 15 ? item.type.substring(0, 15) + '...' : item.type,
        fullName: item.type,
        count: item.count,
        cumulative: cumulative,
        index: index + 1
      };
    });
    
    console.log('📊 [Dashboard] Area Chart Data:', result);
    return result;
  }, [transactionTypeCounts]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tenants Card */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700   hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tenants</p>
              {isLoadingTenants ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <h3 className="text-3xl text-gray-900 dark:text-gray-100">
                  {formatNumber(tenants.length)}
                </h3>
              )}
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
        </Card>

        {/* Data Sources Card */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700   hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Sources</p>
              {isLoadingDataSources ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <h3 className="text-3xl text-gray-900 dark:text-gray-100">
                  {formatNumber(filteredDataSources.length)}
                </h3>
              )}
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
        </Card>

        {/* Transaction Types Card */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700   hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Types</p>
              {isLoadingTransactions ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <h3 className="text-3xl text-gray-900 dark:text-gray-100">
                  {formatNumber(transactionTypeCounts.length)}
                </h3>
              )}
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
        </Card>

        {/* Data Plane Card (renamed from Transactions) */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700   hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Plane</p>
              {isLoadingTransactions ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <h3 className="text-3xl text-gray-900 dark:text-gray-100">
                  {formatNumber(totalTransactions)}
                </h3>
              )}
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Top Transaction Types */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700  ">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
            <h3 className="text-lg text-gray-900 dark:text-gray-100">Top Transaction Types</h3>
          </div>
          {isLoadingTransactions ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No transaction data available
            </div>
          )}
        </Card>

        {/* Area Chart - Transaction Distribution */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700  ">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
            <h3 className="text-lg text-gray-900 dark:text-gray-100">Transaction Distribution</h3>
          </div>
          {isLoadingTransactions ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [formatNumber(value), 'Transactions'];
                    if (name === 'cumulative') return [formatNumber(value), 'Cumulative'];
                    return [formatNumber(value), name];
                  }}
                  labelFormatter={(label) => {
                    const point = areaData.find(d => d.name === label);
                    return point?.fullName || label;
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No transaction data available
            </div>
          )}
        </Card>
      </div>

      {/* Data Sources */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          <h3 className="text-lg text-gray-900 dark:text-gray-100">Data Sources Overview</h3>
        </div>
        {isLoadingDataSources || isLoadingTransactions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[88px]" />
            ))}
          </div>
        ) : filteredDataSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDataSources.slice(0, 8).map((ds) => {
              // Use the correct field names from API (DatasourceName, DatasourceId, DatasourceType)
              const dataSourceId = ds.DatasourceId || ds.DataSourceId || '';
              const name = ds.DatasourceName || ds.DataSourceName || dataSourceId || 'Unknown';
              
              // Get transaction types for this data source from TRANSACTION_TYPES_INFO
              const typesForDataSource = TRANSACTION_TYPES_INFO.filter(typeInfo => 
                typeInfo.dataSourceId === dataSourceId
              );
              
              // Calculate total transaction count for this data source
              const totalCount = typesForDataSource.reduce((sum, typeInfo) => {
                const typeCount = transactionTypeCounts.find(tc => tc.type === typeInfo.name);
                return sum + (typeCount?.count || 0);
              }, 0);
              
              console.log(`🔍 [Dashboard] Data Source "${name}" (ID: ${dataSourceId}): ${totalCount} transactions from ${typesForDataSource.length} types`);
              
              return (
                <Card key={dataSourceId} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700   hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={name}>{name}</p>
                      <h3 className="text-2xl text-gray-900 dark:text-gray-100">
                        {formatNumber(totalCount)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500">transactions</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg flex-shrink-0">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No data sources available
          </div>
        )}
      </div>
    </div>
  );
}