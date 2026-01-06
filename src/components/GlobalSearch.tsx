import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { GlobalSearchResults } from './GlobalSearchResults';
import { GlobalSearchDetail } from './GlobalSearchDetail';
import {
  MOCK_TENANTS,
  MOCK_DATA_SOURCES,
  MOCK_TRANSACTIONS,
  MOCK_APPLICATIONS,
  MOCK_TRANSACTION_TYPE_MODELS,
  MOCK_DATA_BY_TYPE,
} from '../lib/mockData';

export interface SearchResult {
  id: string;
  type: 'tenant' | 'datasource' | 'transaction' | 'application' | 'model' | 'dataplane';
  title: string;
  subtitle: string;
  data: any;
  dataPlaneType?: string; // For dataplane items, store the type (Customer, Quote, etc.)
}

export function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search Tenants
    MOCK_TENANTS.forEach((tenant) => {
      const matches =
        tenant.TenantId.toLowerCase().includes(query) ||
        tenant.TenantName.toLowerCase().includes(query) ||
        tenant.Description?.toLowerCase().includes(query);

      if (matches) {
        searchResults.push({
          id: tenant.TenantId,
          type: 'tenant',
          title: tenant.TenantName,
          subtitle: `Tenant ID: ${tenant.TenantId}`,
          data: tenant,
        });
      }
    });

    // Search Data Sources
    MOCK_DATA_SOURCES.forEach((ds) => {
      const matches =
        ds.DatasourceId.toLowerCase().includes(query) ||
        ds.DatasourceName.toLowerCase().includes(query) ||
        ds.DatasourceType.toLowerCase().includes(query) ||
        ds.Description?.toLowerCase().includes(query);

      if (matches) {
        searchResults.push({
          id: ds.DatasourceId,
          type: 'datasource',
          title: ds.DatasourceName,
          subtitle: `Type: ${ds.DatasourceType} • ID: ${ds.DatasourceId}`,
          data: ds,
        });
      }
    });

    // Search Transactions
    MOCK_TRANSACTIONS.forEach((txn) => {
      const txnData = JSON.stringify(txn.Txn).toLowerCase();
      const matches =
        txn.TxnId.toLowerCase().includes(query) ||
        txn.TxnType.toLowerCase().includes(query) ||
        txnData.includes(query);

      if (matches) {
        // Try to get a meaningful title from transaction data
        const txnObj = txn.Txn as any;
        const title =
          txnObj.CustomerName ||
          txnObj.InvoiceNumber ||
          txnObj.OrderNumber ||
          txnObj.QuoteNumber ||
          txnObj.ProductName ||
          txnObj.LocationName ||
          txnObj.TrackingNumber ||
          `${txn.TxnType} Transaction`;

        searchResults.push({
          id: txn.TxnId,
          type: 'transaction',
          title: title,
          subtitle: `Type: ${txn.TxnType} • ID: ${txn.TxnId}`,
          data: txn,
        });
      }
    });

    // Search Applications
    MOCK_APPLICATIONS.forEach((app) => {
      const matches =
        app.id.toLowerCase().includes(query) ||
        app.ApplicationName.toLowerCase().includes(query) ||
        app.Description?.toLowerCase().includes(query) ||
        app.Version.toLowerCase().includes(query);

      if (matches) {
        searchResults.push({
          id: app.id,
          type: 'application',
          title: app.ApplicationName,
          subtitle: `Version: ${app.Version} • Status: ${app.Status}`,
          data: app,
        });
      }
    });

    // Search Transaction Type Models
    MOCK_TRANSACTION_TYPE_MODELS.forEach((model) => {
      const matches =
        model.id.toLowerCase().includes(query) ||
        model.TransactionType.toLowerCase().includes(query) ||
        model.ModelName.toLowerCase().includes(query);

      if (matches) {
        searchResults.push({
          id: model.id,
          type: 'model',
          title: model.ModelName,
          subtitle: `Type: ${model.TransactionType} • ID: ${model.id}`,
          data: model,
        });
      }
    });

    // Search Data Plane data (Customer, Location, Quote, etc.)
    Object.keys(MOCK_DATA_BY_TYPE).forEach((type) => {
      const items = MOCK_DATA_BY_TYPE[type];
      let foundCount = 0;
      
      // Limit results per type for performance
      const maxPerType = 10;
      
      for (const item of items) {
        if (foundCount >= maxPerType) break;
        
        // Search in all string fields
        const itemStr = JSON.stringify(item).toLowerCase();
        
        if (itemStr.includes(query)) {
          // Get a meaningful title
          const title = item.name || item['quote Id'] || item.id || `${type} Item`;
          const subtitle = item.arnum2 
            ? `Type: ${type} • ID: ${item.arnum2}`
            : `Type: ${type} • ID: ${item.id}`;
          
          searchResults.push({
            id: `${type}-${item.ID || item.id}`,
            type: 'dataplane',
            title: String(title),
            subtitle: subtitle,
            data: item,
            dataPlaneType: type,
          });
          
          foundCount++;
        }
      }
    });

    // Limit results to 50
    setResults(searchResults.slice(0, 50));
    setShowResults(true);
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult) => {
    setSelectedItem(result);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <>
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search across all data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) {
                setShowResults(true);
              }
            }}
            className="pl-10 pr-10 h-10 bg-[rgb(241,243,255)] dark:bg-gray-800 border-0 focus:ring-2 focus:ring-[rgb(101,121,255)]"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <GlobalSearchResults results={results} onSelect={handleSelectResult} />
        )}

        {/* No Results */}
        {showResults && searchQuery.trim().length >= 2 && results.length === 0 && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {/* Detail Popup */}
      {selectedItem && (
        <GlobalSearchDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}