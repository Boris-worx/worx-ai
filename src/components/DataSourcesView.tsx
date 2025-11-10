import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataTable } from './DataTable';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { SearchIcon } from './icons/SearchIcon';
import { Skeleton } from './ui/skeleton';
import { Plus, Trash2, Pencil, Eye, Database, MoreVertical, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DataSource, createDataSource, deleteDataSource, updateDataSource } from '../lib/api';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

import { UserRole } from './AuthContext';

interface DataSourcesViewProps {
  dataSources: DataSource[];
  setDataSources: React.Dispatch<React.SetStateAction<DataSource[]>>;
  isLoading: boolean;
  refreshData: () => void;
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

// Helper functions to handle both field name variations
const getDataSourceId = (ds: DataSource) => ds.DatasourceId || ds.DataSourceId || '';
const getDataSourceName = (ds: DataSource) => ds.DatasourceName || ds.DataSourceName || '';

// Data Capture Specification interface
interface DataCaptureSpecification {
  id: string;
  table: string;
  version: string;
  date: string;
  schema: any;
  // Additional fields from schema
  modelSchemaId: string;
  model: string;
  state: string;
  semver: string;
  profile: string;
  tenantId: string;
  dataSourceId: string;
  title: string;
  tenantName: string;
  dataSourceName: string;
}

// Mock Data Capture Schemas - only Quote with ModelSchema structure
const mockDataCaptureSchemas = {
  Quote: {
    modelSchemaId: "Quote:1",
    model: "Quote",
    version: 1,
    state: "active",
    semver: "1.0.0",
    profile: "data-capture",
    tenantId: "tenant-1",
    dataSourceId: "datasource_59cbb57b-ed55-40b0-9439-dc5134634d69",
    jsonSchema: {
      title: "Quote (Data Capture)",
      type: "object",
      primaryKey: [
        "quoteId"
      ],
      required: [
        "quoteId"
      ],
      properties: {
        quoteId: {
          type: "string"
        },
        customerId: {
          type: "string"
        },
        serviceRequestId: {
          type: "string"
        },
        isPublished: {
          type: "string"
        },
        publishedByUserId: {
          type: [
            "string",
            "null"
          ]
        },
        datePublished: {
          type: [
            "string",
            "null"
          ]
        },
        costCodeRequired: {
          type: "string"
        },
        publishLevelDetailId: {
          type: [
            "string",
            "null"
          ]
        },
        pricingMethodId: {
          type: [
            "string",
            "null"
          ]
        },
        pricingAsOfDate: {
          type: [
            "string",
            "null"
          ]
        },
        expirationDate: {
          type: [
            "string",
            "null"
          ]
        },
        locationCode: {
          type: [
            "string",
            "null"
          ]
        },
        shipTo: {
          type: [
            "string",
            "null"
          ]
        },
        locationName: {
          type: [
            "string",
            "null"
          ]
        },
        locationAddress: {
          type: [
            "string",
            "null"
          ]
        },
        locationTaxCode: {
          type: [
            "string",
            "null"
          ]
        },
        locationTaxRate: {
          type: [
            "string",
            "null"
          ]
        },
        locationTaxDescription: {
          type: [
            "string",
            "null"
          ]
        },
        createdBy: {
          type: [
            "string",
            "null"
          ]
        },
        createdDate: {
          type: [
            "string",
            "null"
          ]
        },
        lastModifiedBy: {
          type: [
            "string",
            "null"
          ]
        },
        lastModifiedDate: {
          type: [
            "string",
            "null"
          ]
        },
        isAutoMergeFailed: {
          type: "string"
        },
        exportNotes: {
          type: [
            "string",
            "null"
          ]
        },
        salesOrderComment: {
          type: [
            "string",
            "null"
          ]
        },
        jobId: {
          type: [
            "string",
            "null"
          ]
        },
        customerRequestedByDate: {
          type: [
            "string",
            "null"
          ]
        },
        quoteName: {
          type: [
            "string",
            "null"
          ]
        },
        quoteSortOrder: {
          type: [
            "string",
            "null"
          ]
        },
        isLinkedQuote: {
          type: "string"
        },
        linkedQuoteId: {
          type: [
            "string",
            "null"
          ]
        },
        linkedQuoteImportTypeId: {
          type: [
            "string",
            "null"
          ]
        },
        isNewVersionNeeded: {
          type: "string"
        },
        lastPriceRefreshedDate: {
          type: [
            "string",
            "null"
          ]
        },
        linkedQuoteHash: {
          type: [
            "string",
            "null"
          ]
        },
        referenceQuoteId: {
          type: [
            "string",
            "null"
          ]
        },
        quoteCostCode: {
          type: [
            "string",
            "null"
          ]
        },
        isSentToErp: {
          type: "string"
        },
        sapOrderType: {
          type: [
            "string",
            "null"
          ]
        },
        useErpTaxes: {
          type: "string"
        },
        erpDiscounts: {
          type: [
            "string",
            "null"
          ]
        },
        erpEstimatedFees: {
          type: [
            "string",
            "null"
          ]
        },
        erpEstimatedTaxes: {
          type: [
            "string",
            "null"
          ]
        },
        erpSubTotal: {
          type: [
            "string",
            "null"
          ]
        },
        erpGrandTotal: {
          type: [
            "string",
            "null"
          ]
        },
        erpTaxExempt: {
          type: [
            "string",
            "null"
          ]
        },
        erpTaxExemptExpiration: {
          type: [
            "string",
            "null"
          ]
        },
        erpTaxExemptNumber: {
          type: [
            "string",
            "null"
          ]
        },
        erpUserId: {
          type: [
            "string",
            "null"
          ]
        },
        isEditRestrictionEnabled: {
          type: "string"
        },
        isPartialPackOrderingEnabled: {
          type: "string"
        },
        selectedDisclaimerId: {
          type: [
            "string",
            "null"
          ]
        },
        isImportedByJson: {
          type: "string"
        },
        pricingAccountId: {
          type: [
            "string",
            "null"
          ]
        },
        metadata: {
          type: "object",
          unevaluatedProperties: true
        },
        createTime: {
          anyOf: [
            {
              type: "string",
              format: "date-time"
            },
            {
              type: "null"
            }
          ]
        },
        updateTime: {
          anyOf: [
            {
              type: "string",
              format: "date-time"
            },
            {
              type: "null"
            }
          ]
        }
      },
      unevaluatedProperties: true
    },
    tenants: [
      {
        tenantId: "tenant-1",
        tenantName: "BFS"
      }
    ],
    dataSources: [
      {
        dataSourceId: "datasource_f1e5b0b0-29d2-4316-a781-9a5e0075bd33",
        dataSourceType: "sql-db",
        dataSourceName: "Bidtools"
      }
    ]
  }
};

// Mock Data Capture Specifications - Quote with multiple tenant IDs
const getMockSpecifications = (dataSourceName: string): DataCaptureSpecification[] => {
  if (dataSourceName === 'Bidtools') {
    const quoteSchema = mockDataCaptureSchemas.Quote;
    const version = '1.0.0';
    
    // Mock tenant names
    const tenantData = [
      { id: 'tenant-1', name: 'BFS' },
      { id: 'tenant-2', name: 'Meritage' },
      { id: 'tenant-3', name: 'Smith Douglas' },
      { id: 'tenant-4', name: 'PIM' },
      { id: 'tenant-1', name: 'BFS' },
      { id: 'tenant-2', name: 'Meritage' },
      { id: 'tenant-3', name: 'Smith Douglas' },
      { id: 'tenant-4', name: 'PIM' },
      { id: 'tenant-1', name: 'BFS' },
      { id: 'tenant-2', name: 'Meritage' },
      { id: 'tenant-3', name: 'Smith Douglas' },
      { id: 'tenant-4', name: 'PIM' }
    ];
    
    // Create Quote specifications for each tenant
    return tenantData.map((tenant, index) => ({
      id: `Quote:${index + 1}`,
      table: quoteSchema.model,
      version: String(quoteSchema.version),
      date: '11/05/2025',
      schema: quoteSchema,
      modelSchemaId: `Quote:${index + 1}`,
      model: quoteSchema.model,
      state: quoteSchema.state,
      semver: version,
      profile: quoteSchema.profile,
      tenantId: tenant.id,
      dataSourceId: quoteSchema.dataSourceId,
      title: quoteSchema.jsonSchema.title,
      tenantName: tenant.name,
      dataSourceName: quoteSchema.dataSources[0].dataSourceName
    }));
  }
  return [];
};

// Get unique models from specifications
const getModelsFromSpecs = (specs: DataCaptureSpecification[]): string[] => {
  const models = new Set<string>();
  specs.forEach(spec => models.add(spec.model));
  return Array.from(models).sort();
};

// Get specifications by model
const getSpecsByModel = (specs: DataCaptureSpecification[], model: string): DataCaptureSpecification[] => {
  return specs.filter(spec => spec.model === model);
};

export function DataSourcesView({ dataSources, setDataSources, isLoading, refreshData, userRole, tenants, activeTenantId, onTenantChange }: DataSourcesViewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<DataSource | null>(null);
  const [newDataSourceName, setNewDataSourceName] = useState('');
  const [newDataSourceTenantId, setNewDataSourceTenantId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail view state
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Edit state
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDataSourceName, setEditDataSourceName] = useState('');
  
  // Data Capture Specifications state
  const [selectedSpec, setSelectedSpec] = useState<DataCaptureSpecification | null>(null);
  const [isSpecViewOpen, setIsSpecViewOpen] = useState(false);
  const [isSpecEditOpen, setIsSpecEditOpen] = useState(false);
  const [isSpecDeleteOpen, setIsSpecDeleteOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState<DataCaptureSpecification | null>(null);
  const [selectedModelPerDataSource, setSelectedModelPerDataSource] = useState<Record<string, string>>({});
  const [modelSearch, setModelSearch] = useState('');
  const [specificationSearch, setSpecificationSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPagePerDataSource, setCurrentPagePerDataSource] = useState<Record<string, number>>({});

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns - commonly used fields
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'DatasourceId', label: 'Data Source ID', enabled: true, locked: true },
    { key: 'DatasourceName', label: 'Name', enabled: true },
    { key: 'TenantId', label: 'Tenant ID', enabled: true },
    { key: 'DatasourceType', label: 'Type', enabled: true },
    { key: 'Type', label: 'Type (Legacy)', enabled: false },
    { key: 'Status', label: 'Status', enabled: false },
    { key: 'Description', label: 'Description', enabled: false },
    { key: 'CreateTime', label: 'Created', enabled: true },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
    { key: 'ConnectionString', label: 'Connection', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '5'; // Increment when changing default columns
    const saved = localStorage.getItem('dataSourcesViewColumns');
    const savedVersion = localStorage.getItem('dataSourcesViewColumnsVersion');
    
    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    // Clear old data and use defaults
    localStorage.removeItem('dataSourcesViewColumns');
    localStorage.setItem('dataSourcesViewColumnsVersion', STORAGE_VERSION);
    return getDefaultColumns();
  });

  // Save column configs to localStorage whenever they change
  useEffect(() => {
    const STORAGE_VERSION = '5';
    localStorage.setItem('dataSourcesViewColumns', JSON.stringify(columnConfigs));
    localStorage.setItem('dataSourcesViewColumnsVersion', STORAGE_VERSION);
  }, [columnConfigs]);

  // Extract available fields from data sources to offer as columns
  const availableFields = useMemo(() => {
    if (dataSources.length === 0) return [];
    
    const fieldsSet = new Set<string>();
    dataSources.forEach(ds => {
      Object.keys(ds).forEach(key => {
        if (!key.startsWith('_')) {
          fieldsSet.add(key);
        }
      });
    });
    
    return Array.from(fieldsSet).sort();
  }, [dataSources]);

  // Update column configs when new fields are detected
  useEffect(() => {
    if (availableFields.length > 0) {
      const existingKeys = new Set(columnConfigs.map(c => c.key));
      const newFields = availableFields.filter(f => !existingKeys.has(f));
      
      if (newFields.length > 0) {
        const newConfigs = newFields.map(key => ({
          key,
          label: formatFieldLabel(key),
          enabled: false,
        }));
        setColumnConfigs([...columnConfigs, ...newConfigs]);
      }
    }
  }, [availableFields]);

  // Auto-select current tenant when opening create dialog
  useEffect(() => {
    if (isCreateDialogOpen && !newDataSourceTenantId) {
      // If not global tenant, pre-select the active tenant
      if (activeTenantId && activeTenantId !== 'global') {
        setNewDataSourceTenantId(activeTenantId);
      }
    }
  }, [isCreateDialogOpen, activeTenantId]);

  // Helper to check if a value is empty
  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && (value.trim() === '' || value === '—')) return true;
    return false;
  };

  // Helper to check if a column has any non-empty values
  const hasNonEmptyValues = (columnKey: string): boolean => {
    if (dataSources.length === 0) return false;
    
    return dataSources.some(row => {
      let value: any;
      
      // Use helper functions for ID and Name fields
      if (columnKey === 'DatasourceId' || columnKey === 'DataSourceId') {
        value = getDataSourceId(row);
      } else if (columnKey === 'DatasourceName' || columnKey === 'DataSourceName') {
        value = getDataSourceName(row);
      } else if (columnKey === 'TenantId') {
        value = row.TenantId;
      } else {
        value = row[columnKey as keyof DataSource];
      }
      
      return !isEmptyValue(value);
    });
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (dataSources.length === 0) {
      // If no data, don't mark anything as empty
      return columnConfigs.map(col => ({ ...col, isEmpty: false }));
    }
    
    return columnConfigs.map(col => {
      // Check if column has any non-empty values
      const hasData = col.locked || dataSources.some(row => {
        let value: any;
        
        // Use helper functions for ID and Name fields
        if (col.key === 'DatasourceId' || col.key === 'DataSourceId') {
          value = getDataSourceId(row);
        } else if (col.key === 'DatasourceName' || col.key === 'DataSourceName') {
          value = getDataSourceName(row);
        } else if (col.key === 'TenantId') {
          value = row.TenantId;
        } else {
          value = row[col.key as keyof DataSource];
        }
        
        return !isEmptyValue(value);
      });
      
      return {
        ...col,
        isEmpty: !hasData
      };
    });
  }, [columnConfigs, dataSources]);

  // Get enabled columns and convert to DataTable format
  const columns = useMemo(() => {
    return enrichedColumnConfigs
      .filter(c => c.enabled)
      // Filter out columns that have no data (all values are empty)
      .filter(c => c.locked || !c.isEmpty)
      .map(colConfig => ({
        key: colConfig.key,
        header: colConfig.label,
        render: (row: DataSource) => {
          // Use helper functions for ID and Name fields
          if (colConfig.key === 'DatasourceId' || colConfig.key === 'DataSourceId') {
            const id = getDataSourceId(row);
            const displayId = id || 'N/A';
            return (
              <div className="max-w-[120px] md:max-w-[180px]">
                <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={displayId}>
                  {displayId}
                </code>
              </div>
            );
          }
          if (colConfig.key === 'TenantId') {
            const tenantId = row.TenantId || '—';
            return (
              <div className="max-w-[120px] md:max-w-[180px]">
                <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={tenantId}>
                  {tenantId}
                </code>
              </div>
            );
          }
          if (colConfig.key === 'DatasourceName' || colConfig.key === 'DataSourceName') {
            const name = getDataSourceName(row);
            return name || '—';
          }
          
          // Get the value using the config key
          const value = row[colConfig.key as keyof DataSource];
          return formatCellValue(value, colConfig.key);
        },
      }));
  }, [enrichedColumnConfigs, dataSources]);

  // Create data source handler
  const handleCreate = async () => {
    if (!newDataSourceName.trim()) {
      toast.error('Datasource Name is required');
      return;
    }

    if (!newDataSourceTenantId) {
      toast.error('Tenant ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the selected TenantId from the dropdown
      const tenantIdToUse = newDataSourceTenantId !== 'none' ? newDataSourceTenantId : undefined;
      
      const created = await createDataSource(
        newDataSourceName.trim(),
        tenantIdToUse
      );
      
      // Add to list (prepend - newest first)
      setDataSources([created, ...dataSources]);
      
      // Reset form
      setNewDataSourceName('');
      setNewDataSourceTenantId('');
      setIsCreateDialogOpen(false);
      
      toast.success(`Data source "${getDataSourceName(created)}" created successfully!`);
      
      // Refresh data from API
      refreshData();
    } catch (error: any) {
      toast.error(`Failed to create data source: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete data source handler
  const handleDeleteClick = (dataSource: DataSource) => {
    setDataSourceToDelete(dataSource);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!dataSourceToDelete) return;

    setIsSubmitting(true);
    try {
      const etag = dataSourceToDelete._etag || '';
      const idToDelete = getDataSourceId(dataSourceToDelete);
      await deleteDataSource(idToDelete, etag);
      
      // Remove from list
      setDataSources(dataSources.filter(ds => getDataSourceId(ds) !== idToDelete));
      
      setIsDeleteDialogOpen(false);
      setDataSourceToDelete(null);
      
      toast.success(`Data source "${getDataSourceName(dataSourceToDelete)}" deleted successfully!`);
      
      // Refresh data from API
      refreshData();
    } catch (error: any) {
      toast.error(`Failed to delete data source: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View data source details
  const handleViewClick = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
    setIsDetailOpen(true);
  };

  // Edit data source
  const handleEditClick = (dataSource: DataSource) => {
    setDataSourceToEdit(dataSource);
    setEditDataSourceName(getDataSourceName(dataSource));
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!dataSourceToEdit) return;
    if (!editDataSourceName.trim()) {
      toast.error('Data Source Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const etag = dataSourceToEdit._etag || '';
      const idToUpdate = getDataSourceId(dataSourceToEdit);
      const updated = await updateDataSource(
        idToUpdate,
        editDataSourceName.trim(),
        etag,
        undefined, // type
        undefined, // connection
        undefined, // description
      );
      
      // Update in list
      setDataSources(dataSources.map(ds => 
        getDataSourceId(ds) === getDataSourceId(updated) ? updated : ds
      ));
      
      setIsEditOpen(false);
      setDataSourceToEdit(null);
      
      toast.success(`Data source "${getDataSourceName(updated)}" updated successfully!`);
      
      // Refresh data from API
      refreshData();
    } catch (error: any) {
      toast.error(`Failed to update data source: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format cell value
  const formatCellValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) return '—';
    
    // Format dates
    if (key === 'CreateTime' || key === 'UpdateTime') {
      try {
        return <span className="whitespace-nowrap text-xs md:text-sm">{new Date(value).toLocaleDateString()}</span>;
      } catch {
        return value;
      }
    }
    
    // Format status
    if (key === 'Status') {
      const status = String(value).toLowerCase();
      if (status === 'active') {
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">Active</Badge>;
      } else if (status === 'inactive') {
        return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
      }
      return <Badge variant="outline" className="text-xs">{value}</Badge>;
    }
    
    // Format Type
    if (key === 'Type') {
      return <Badge variant="outline" className="text-xs">{value}</Badge>;
    }
    
    // Format Description with truncation
    if (key === 'Description') {
      const desc = String(value);
      if (desc.length === 0 || desc === '—') return '—';
      return (
        <div className="max-w-[200px] md:max-w-[300px]">
          <span className="text-xs md:text-sm truncate block" title={desc}>
            {desc}
          </span>
        </div>
      );
    }
    
    // Handle objects/arrays
    if (typeof value === 'object') {
      return (
        <div className="max-w-[150px]">
          <code className="text-[10px] md:text-[11px] bg-muted px-1 py-0.5 rounded truncate block" title={JSON.stringify(value)}>
            {JSON.stringify(value)}
          </code>
        </div>
      );
    }
    
    return <span className="text-xs md:text-sm">{String(value)}</span>;
  };

  // Check permissions
  // SuperUser and Admin and Developer have full read/write access to Data Source Onboarding
  // ViewOnlySuperUser and Viewer have read-only access
  const canCreate = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canEdit = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canDelete = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';

  return (
    <Card className="w-full max-w-[1440px] mx-auto">
      <CardHeader>
        {/* Mobile Layout: Stack vertically */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-[20px] font-bold pt-[0px] pr-[0px] pb-[5px] pl-[0px]">
              Data Sources
            </CardTitle>
            <CardDescription>
              Manage data sources and their configurations
            </CardDescription>
          </div>
          
          {/* Desktop View - All buttons visible */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <TenantSelector
              tenants={tenants}
              activeTenantId={activeTenantId}
              onTenantChange={onTenantChange}
              isSuperUser={userRole === 'superuser'}
            />
            <ColumnSelector
              columns={enrichedColumnConfigs}
              onColumnsChange={setColumnConfigs}
            />
            {canCreate && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            )}
          </div>

          {/* Mobile View - Dropdown Menu */}
          <div className="flex md:hidden items-center gap-2 justify-end">
            {/* Tenant Selector */}
            <TenantSelector
              tenants={tenants}
              activeTenantId={activeTenantId}
              onTenantChange={onTenantChange}
              isSuperUser={userRole === 'superuser'}
            />
            
            {/* Dropdown Menu with other actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canCreate && (
                  <>
                    <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Data Source
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="flex-1">Columns</span>
                  <ColumnSelector
                    columns={enrichedColumnConfigs}
                    onColumnsChange={setColumnConfigs}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : dataSources.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No Data Sources</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first data source
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={dataSources}
            columns={columns}
            expandable={true}
            getRowId={(row) => getDataSourceId(row)}
            renderExpandedContent={(row) => {
              const dataSourceId = getDataSourceId(row);
              const specifications = getMockSpecifications(getDataSourceName(row));
              const models = getModelsFromSpecs(specifications);
              
              // Get or set default selected model for this data source
              const currentSelectedModel = selectedModelPerDataSource[dataSourceId] || models[0];
              
              const handleModelSelect = (model: string) => {
                setSelectedModelPerDataSource(prev => ({
                  ...prev,
                  [dataSourceId]: model
                }));
                // Reset to page 1 when model changes
                setCurrentPagePerDataSource(prev => ({
                  ...prev,
                  [dataSourceId]: 1
                }));
              };
              
              // Get specifications for selected model
              const filteredSpecs = getSpecsByModel(specifications, currentSelectedModel);
              
              // Filter models by search
              const filteredModels = models.filter(model => 
                model.toLowerCase().includes(modelSearch.toLowerCase())
              );
              
              // Filter specifications by search
              const searchFilteredSpecs = filteredSpecs.filter(spec => 
                spec.modelSchemaId.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.model.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.semver.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.tenantId.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.tenantName.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.dataSourceName.toLowerCase().includes(specificationSearch.toLowerCase())
              );
              
              // Sort specifications
              const sortedSpecs = [...searchFilteredSpecs].sort((a, b) => {
                if (!sortColumn) return 0;
                
                let aValue = '';
                let bValue = '';
                
                switch (sortColumn) {
                  case 'modelSchemaId':
                    aValue = a.modelSchemaId;
                    bValue = b.modelSchemaId;
                    break;
                  case 'model':
                    aValue = a.model;
                    bValue = b.model;
                    break;
                  case 'semver':
                    aValue = a.semver;
                    bValue = b.semver;
                    break;
                  case 'tenantId':
                    aValue = a.tenantId;
                    bValue = b.tenantId;
                    break;
                  case 'tenantName':
                    aValue = a.tenantName;
                    bValue = b.tenantName;
                    break;
                  case 'dataSourceName':
                    aValue = a.dataSourceName;
                    bValue = b.dataSourceName;
                    break;
                  default:
                    return 0;
                }
                
                if (sortDirection === 'asc') {
                  return aValue.localeCompare(bValue);
                } else {
                  return bValue.localeCompare(aValue);
                }
              });
              
              // Handle sort column click
              const handleSort = (column: string) => {
                if (sortColumn === column) {
                  // Toggle direction if same column
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  // New column, default to asc
                  setSortColumn(column);
                  setSortDirection('asc');
                }
                // Reset to page 1 when sort changes
                setCurrentPagePerDataSource(prev => ({
                  ...prev,
                  [dataSourceId]: 1
                }));
              };
              
              // Render sort icon
              const renderSortIcon = (column: string) => {
                if (sortColumn !== column) {
                  return <ArrowUpDown className="h-3 w-3 ml-1 inline-block opacity-40" />;
                }
                return sortDirection === 'asc' 
                  ? <ArrowUp className="h-3 w-3 ml-1 inline-block" />
                  : <ArrowDown className="h-3 w-3 ml-1 inline-block" />;
              };
              
              // Pagination logic
              const itemsPerPage = 10;
              const currentPage = currentPagePerDataSource[dataSourceId] || 1;
              const totalPages = Math.ceil(sortedSpecs.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedSpecs = sortedSpecs.slice(startIndex, endIndex);
              
              const handlePageChange = (page: number) => {
                setCurrentPagePerDataSource(prev => ({
                  ...prev,
                  [dataSourceId]: page
                }));
              };
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm">Data Capture Specifications</h4>
                    {canCreate && (
                      <Button 
                        size="sm" 
                        className="bg-[#1D6BCD] hover:bg-[#1557A8]"
                        onClick={() => {
                          toast.info('Add Data Capture Specification - Coming soon!');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Specification
                      </Button>
                    )}
                  </div>
                  
                  {specifications.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No Data Capture Specifications defined
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
                      {/* Left Column - Models List */}
                      <div className="space-y-2">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search models..."
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            className="pl-9 h-9"
                          />
                        </div>
                        <Card className="border">
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-1 p-2">
                              {filteredModels.length > 0 ? (
                                filteredModels.map((model) => (
                                  <Button
                                    key={model}
                                    variant={currentSelectedModel === model ? 'default' : 'ghost'}
                                    className="w-full justify-start text-left h-auto py-2 px-3"
                                    onClick={() => handleModelSelect(model)}
                                  >
                                    <span className="text-sm truncate">{model}</span>
                                  </Button>
                                ))
                              ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                  No models found
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </Card>
                      </div>

                      {/* Right Column - Specifications Table */}
                      <div className="min-w-0 space-y-2">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search specifications..."
                            value={specificationSearch}
                            onChange={(e) => {
                              setSpecificationSearch(e.target.value);
                              // Reset to page 1 when search changes
                              setCurrentPagePerDataSource(prev => ({
                                ...prev,
                                [dataSourceId]: 1
                              }));
                            }}
                            className="pl-9 h-9"
                          />
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('modelSchemaId')}
                                >
                                  Model Schema ID{renderSortIcon('modelSchemaId')}
                                </th>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('model')}
                                >
                                  Model{renderSortIcon('model')}
                                </th>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('semver')}
                                >
                                  Version{renderSortIcon('semver')}
                                </th>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('tenantId')}
                                >
                                  Tenant ID{renderSortIcon('tenantId')}
                                </th>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('tenantName')}
                                >
                                  Tenant Name{renderSortIcon('tenantName')}
                                </th>
                                <th 
                                  className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                  onClick={() => handleSort('dataSourceName')}
                                >
                                  Data Source Name{renderSortIcon('dataSourceName')}
                                </th>
                                <th className="text-right py-2 px-4 whitespace-nowrap font-normal">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {paginatedSpecs.length > 0 ? (
                                paginatedSpecs.map((spec) => (
                                  <tr key={spec.id} className="border-b last:border-0">
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="max-w-[120px] md:max-w-[180px]">
                                      <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={spec.modelSchemaId}>
                                        {spec.modelSchemaId}
                                      </code>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.model}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.semver}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="max-w-[120px] md:max-w-[180px]">
                                      <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={spec.tenantId}>
                                        {spec.tenantId}
                                      </code>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.tenantName}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.dataSourceName}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSpec(spec);
                                          setIsSpecViewOpen(true);
                                        }}
                                        title="View specification"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                      {canEdit && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedSpec(spec);
                                            setIsSpecEditOpen(true);
                                          }}
                                          title="Edit specification"
                                        >
                                          <Pencil className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                      )}
                                      {canDelete && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSpecToDelete(spec);
                                            setIsSpecDeleteOpen(true);
                                          }}
                                          title="Delete specification"
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          Delete
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                  No specifications found
                                </td>
                              </tr>
                            )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-2">
                            <div className="text-sm text-muted-foreground">
                              Showing {startIndex + 1} to {Math.min(endIndex, sortedSpecs.length)} of {sortedSpecs.length} specifications
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </Button>
                              <div className="text-sm">
                                Page {currentPage} of {totalPages}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
            actions={(row) => (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewClick(row)}
                >
                  <ViewIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(row)}
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(row)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <DeleteIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
            actionsCompact={(row) => (
              <div className="flex gap-1 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewClick(row)}
                  className="h-8 w-8 p-0"
                  title="View data source"
                >
                  <ViewIcon className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(row)}
                    className="h-8 w-8 p-0"
                    title="Edit data source"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(row)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete data source"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )} className="text-[16px] p-[0px] rounded-[10px]"
          />
        )}
      </CardContent>

      {/* Create Data Source Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Data Source</DialogTitle>
            <DialogDescription>
              Add a new data source to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataSourceName">Datasource Name *</Label>
              <Input
                id="dataSourceName"
                placeholder="Enter datasource name"
                value={newDataSourceName}
                onChange={(e) => setNewDataSourceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newDataSourceTenantId) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID *</Label>
              <Select
                value={newDataSourceTenantId}
                onValueChange={setNewDataSourceTenantId}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenantId === 'global' && (
                    <SelectItem value="none">None (No Tenant)</SelectItem>
                  )}
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.TenantId} value={tenant.TenantId}>
                      {tenant.TenantName} ({tenant.TenantId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {activeTenantId !== 'global' && activeTenantId 
                  ? `Current tenant: ${tenants.find(t => t.TenantId === activeTenantId)?.TenantName || activeTenantId}`
                  : 'Select which tenant this data source belongs to'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewDataSourceName('');
                setNewDataSourceTenantId('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Data Source Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Source</DialogTitle>
            <DialogDescription>
              Update data source information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDataSourceName">Data Source Name *</Label>
              <Input
                id="editDataSourceName"
                placeholder="Enter data source name"
                value={editDataSourceName}
                onChange={(e) => setEditDataSourceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setDataSourceToEdit(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dataSourceToDelete ? getDataSourceName(dataSourceToDelete) : ''}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail View Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Source Details</DialogTitle>
            <DialogDescription>
              Detailed information about this data source
            </DialogDescription>
          </DialogHeader>
          {selectedDataSource && (
            <div className="space-y-4">
              {Object.entries(selectedDataSource)
                .filter(([key]) => !key.startsWith('_'))
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4">
                    <div className="text-sm text-muted-foreground">{formatFieldLabel(key)}</div>
                    <div className="col-span-2 text-sm">
                      {key === 'ConnectionString' ? '••••••••' : formatCellValue(value, key)}
                    </div>
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Capture Specification View Dialog */}
      <Dialog open={isSpecViewOpen} onOpenChange={setIsSpecViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Capture Specification</DialogTitle>
            <DialogDescription>
              Schema definition for {selectedSpec?.table}
            </DialogDescription>
          </DialogHeader>
          {selectedSpec && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                <div>
                  <div className="text-sm text-muted-foreground">Table</div>
                  <div className="text-sm">{selectedSpec.table}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Version</div>
                  <div className="text-sm">{selectedSpec.version}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm">{selectedSpec.date}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">JSON Schema</div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <pre className="text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                    {JSON.stringify(selectedSpec.schema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Capture Specification Edit Dialog */}
      <Dialog open={isSpecEditOpen} onOpenChange={setIsSpecEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Capture Specification</DialogTitle>
            <DialogDescription>
              Update specification for {selectedSpec?.table}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Table</Label>
              <Input value={selectedSpec?.table || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specVersion">Version *</Label>
              <Input
                id="specVersion"
                placeholder="e.g., 2.0"
                defaultValue={selectedSpec?.version || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specSchema">JSON Schema *</Label>
              <Textarea
                id="specSchema"
                placeholder="Paste JSON schema here"
                defaultValue={JSON.stringify(selectedSpec?.schema, null, 2)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast.success('Specification updated successfully!');
                setIsSpecEditOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Capture Specification Delete Dialog */}
      <AlertDialog open={isSpecDeleteOpen} onOpenChange={setIsSpecDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Capture Specification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the specification for "{specToDelete?.table}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success(`Specification for ${specToDelete?.table} deleted successfully!`);
                setIsSpecDeleteOpen(false);
                setSpecToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
