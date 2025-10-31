import { useState, useMemo, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SearchIcon } from './icons/SearchIcon';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  actionsCompact?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchKeys?: string[];
  defaultPageSize?: number;
  showPagination?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  actions,
  actionsCompact,
  emptyMessage = 'No data available.',
  searchPlaceholder = 'Search...',
  searchKeys = [],
  defaultPageSize = 100,
  showPagination = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Check for horizontal overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (tableContainerRef.current) {
        const hasHorizontalScroll = tableContainerRef.current.scrollWidth > tableContainerRef.current.clientWidth;
        setHasOverflow(hasHorizontalScroll);
      }
    };

    checkOverflow();
    // Use a slight delay to ensure table is fully rendered
    const timeout = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeout);
    };
  }, [data, columns]);

  // Helper function to recursively search in nested objects
  const searchInValue = (value: any, searchTerm: string): boolean => {
    if (value === null || value === undefined) return false;
    
    // If it's an object, search recursively in all its properties
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.values(value).some(v => searchInValue(v, searchTerm));
    }
    
    // If it's an array, search in all items
    if (Array.isArray(value)) {
      return value.some(v => searchInValue(v, searchTerm));
    }
    
    // Otherwise convert to string and search
    return String(value).toLowerCase().includes(searchTerm);
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((item) => {
      // If specific search keys provided, search only those
      if (searchKeys.length > 0) {
        return searchKeys.some((key) =>
          searchInValue(item[key], lowerSearch)
        );
      }
      
      // Otherwise search all values (including nested objects)
      return Object.values(item).some((value) =>
        searchInValue(value, lowerSearch)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  // Get paginated data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex, showPagination]);

  // Reset to page 1 when search term or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Determine whether to use compact actions
  const shouldUseCompactActions = hasOverflow && actionsCompact;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div 
        ref={tableContainerRef}
        className="border border-border rounded-lg overflow-x-auto"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="whitespace-nowrap text-left text-xs md:text-sm">
                  {column.sortable !== false ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 hover:bg-transparent text-xs md:text-sm"
                    >
                      {column.header}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {actions && (
                <TableHead 
                  className={`text-right whitespace-nowrap text-xs md:text-sm ${
                    shouldUseCompactActions 
                      ? 'sticky right-0 bg-background shadow-[-8px_0_12px_rgba(0,0,0,0.08)] z-10 pr-3 pl-4 border-l border-border' 
                      : 'pr-2 md:pr-4'
                  }`}
                >
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow
                key={item.id || startIndex + index}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className="py-2 md:py-3">
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell 
                    className={`text-right py-2 md:py-3 ${
                      shouldUseCompactActions 
                        ? 'sticky right-0 bg-background shadow-[-8px_0_12px_rgba(0,0,0,0.08)] z-10 pr-3 pl-4 border-l border-border' 
                        : 'pr-2 md:pr-4'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shouldUseCompactActions ? actionsCompact!(item) : actions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {showPagination && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Left: Results info and page size selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <div className="text-[14px]">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium text-[12px]">{endIndex}</span> of{' '}
              <span className="font-medium">{totalItems}</span> {totalItems === 1 ? 'item' : 'items'}
              {searchTerm && <span className="ml-1">(filtered from {data.length})</span>}
            </div>
            
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs text-[14px]">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(parseInt(value))}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground px-2 whitespace-nowrap">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
