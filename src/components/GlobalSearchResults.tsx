import { SearchResult } from './GlobalSearch';
import { Building2, Database, Receipt, Briefcase, FileCode, Table } from 'lucide-react';

interface GlobalSearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
}

export function GlobalSearchResults({ results, onSelect }: GlobalSearchResultsProps) {
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'tenant':
        return <Building2 className="h-4 w-4 text-[rgb(101,121,255)]" />;
      case 'datasource':
        return <Database className="h-4 w-4 text-[rgb(101,121,255)]" />;
      case 'transaction':
        return <Receipt className="h-4 w-4 text-[rgb(101,121,255)]" />;
      case 'application':
        return <Briefcase className="h-4 w-4 text-[rgb(101,121,255)]" />;
      case 'model':
        return <FileCode className="h-4 w-4 text-[rgb(101,121,255)]" />;
      case 'dataplane':
        return <Table className="h-4 w-4 text-[rgb(101,121,255)]" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'tenant':
        return 'Tenant';
      case 'datasource':
        return 'Data Source';
      case 'transaction':
        return 'Transaction';
      case 'application':
        return 'Application';
      case 'model':
        return 'Model Schema';
      case 'dataplane':
        return 'Data Plane';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeOrder: SearchResult['type'][] = ['tenant', 'datasource', 'transaction', 'application', 'model', 'dataplane'];

  return (
    <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
      {typeOrder.map((type) => {
        const items = groupedResults[type];
        if (!items || items.length === 0) return null;

        return (
          <div key={type} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            {/* Type Header */}
            <div className="px-4 py-2 bg-[rgb(241,243,255)] dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              {getIcon(type)}
              {getTypeLabel(type)} ({items.length})
            </div>

            {/* Items */}
            {items.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {result.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {result.subtitle}
                </div>
              </button>
            ))}
          </div>
        );
      })}

      {/* Total Count */}
      {results.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}