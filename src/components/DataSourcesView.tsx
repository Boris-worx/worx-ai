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
import { Plus, Trash2, Pencil, Eye, Database, MoreVertical, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronsUpDown, Check, X } from 'lucide-react';
import { DataSource, createDataSource, deleteDataSource, updateDataSource, DataCaptureSpec, getDataCaptureSpecs, createDataCaptureSpec, updateDataCaptureSpec, deleteDataCaptureSpec } from '../lib/api';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Switch } from './ui/switch';
import { DataCaptureSpecCreateDialog } from './DataCaptureSpecCreateDialog';

import { UserRole } from './AuthContext';
import { ApicurioArtifact } from '../lib/apicurio';

interface DataSourcesViewProps {
  dataSources: DataSource[];
  setDataSources: React.Dispatch<React.SetStateAction<DataSource[]>>;
  isLoading: boolean;
  refreshData: () => void;
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
  apicurioArtifacts: ApicurioArtifact[];
  isLoadingArtifacts: boolean;
  onRefreshArtifacts: () => void;
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
  schema: any; // Kept for backward compatibility, but should use containerSchema
  // Additional fields from spec
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
  // Real Data Capture Spec fields
  dataCaptureSpecId?: string;
  dataCaptureSpecName?: string;
  containerName?: string; // Cosmos DB container name
  isActive?: boolean;
  sourcePrimaryKeyField?: string;
  partitionKeyField?: string;
  partitionKeyValue?: string;
  allowedFilters?: string[];
  requiredFields?: string[];
  containerSchema?: any; // Container schema - equivalent to jsonSchema for Cosmos DB
  createTime?: string | null;
  updateTime?: string | null;
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
      { id: 'BFS', name: 'BFS' },
      { id: 'Meritage', name: 'Meritage' },
      { id: 'Smith Douglas', name: 'Smith Douglas' },
      { id: 'PIM', name: 'PIM' },
      { id: 'BFS', name: 'BFS' },
      { id: 'Meritage', name: 'Meritage' },
      { id: 'Smith Douglas', name: 'Smith Douglas' },
      { id: 'PIM', name: 'PIM' },
      { id: 'BFS', name: 'BFS' },
      { id: 'Meritage', name: 'Meritage' },
      { id: 'Smith Douglas', name: 'Smith Douglas' },
      { id: 'PIM', name: 'PIM' }
    ];
    
    // Create Quote specifications for each tenant
    return tenantData.map((tenant, index) => ({
      id: `Quote:${index + 1}`,
      table: quoteSchema.model,
      version: String(quoteSchema.version),
      date: '11/05/2025',
      schema: quoteSchema.jsonSchema, // Keep for backward compatibility
      modelSchemaId: `Quote:${index + 1}`,
      model: quoteSchema.model,
      state: quoteSchema.state,
      semver: version,
      profile: quoteSchema.profile,
      tenantId: tenant.id,
      dataSourceId: 'bidtools',
      title: quoteSchema.jsonSchema.title,
      tenantName: tenant.name,
      dataSourceName: 'Bidtools',
      // Real Data Capture Spec fields
      dataCaptureSpecId: `Quote:${index + 1}`,
      dataCaptureSpecName: 'Quote',
      isActive: true,
      sourcePrimaryKeyField: 'quoteId',
      partitionKeyField: 'partitionKey',
      partitionKeyValue: `${tenant.id}-bidtools`,
      allowedFilters: [
        'quoteId',
        'customerId',
        'quoteStatus',
        'isPublished',
        'isAutoMergeFailed',
        'isLinkedQuote',
        'isNewVersionNeeded',
        'isSentToErp',
        'useErpTaxes',
        'isEditRestrictionEnabled',
        'isPartialPackOrderingEnabled',
        'isImportedByJson'
      ],
      requiredFields: ['quoteId', 'customerId'],
      containerSchema: {
        schemaVersion: 1,
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Cosmos DB document id, mapped from quoteId for point lookups'
          },
          quoteId: {
            type: 'string',
            description: 'Source primary key, also mapped to id'
          },
          partitionKey: {
            type: 'string',
            description: 'Partition key value, set to partitionKeyValue from spec'
          },
          ...quoteSchema.jsonSchema.properties,
          metaData: {
            type: 'object',
            properties: {
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sourceDatabase: { type: 'string' },
                    sourceTable: { type: 'string' },
                    sourceCreateTime: { type: ['string', 'null'], format: 'date-time' },
                    sourceUpdateTime: { type: ['string', 'null'], format: 'date-time' },
                    sourceEtag: { type: ['string', 'null'] }
                  }
                }
              }
            }
          }
        },
        required: ['id', 'quoteId', 'partitionKey'],
        unevaluatedProperties: true
      },
      createTime: '2025-11-05T10:00:00Z',
      updateTime: '2025-11-05T10:00:00Z'
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

export function DataSourcesView({ dataSources, setDataSources, isLoading, refreshData, userRole, tenants, activeTenantId, onTenantChange, apicurioArtifacts, isLoadingArtifacts, onRefreshArtifacts }: DataSourcesViewProps) {
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
  const [editDataSourceTenantId, setEditDataSourceTenantId] = useState('');
  
  // Data Capture Specifications state
  const [dataCaptureSpecs, setDataCaptureSpecs] = useState<DataCaptureSpec[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<DataCaptureSpecification | null>(null);
  const [isSpecViewOpen, setIsSpecViewOpen] = useState(false);
  const [isSpecEditOpen, setIsSpecEditOpen] = useState(false);
  const [isSpecDeleteOpen, setIsSpecDeleteOpen] = useState(false);
  const [isSpecCreateOpen, setIsSpecCreateOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState<DataCaptureSpecification | null>(null);
  const [selectedModelPerDataSource, setSelectedModelPerDataSource] = useState<Record<string, string>>({});
  const [modelSearch, setModelSearch] = useState('');
  const [specificationSearch, setSpecificationSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPagePerDataSource, setCurrentPagePerDataSource] = useState<Record<string, number>>({});
  
  // Create Data Capture Spec form state
  const [createSpecForm, setCreateSpecForm] = useState({
    dataCaptureSpecName: '',
    containerName: '',
    version: 1,
    isActive: true,
    profile: 'data-capture',
    sourcePrimaryKeyField: '',
    partitionKeyField: '',
    partitionKeyValue: '',
    allowedFilters: [] as string[], // Changed to array for multiselect
    allowedFiltersText: '', // Text input for allowed filters (comma-separated)
    requiredFields: [] as string[], // ✅ US1: Make required fields editable
    containerSchemaText: ''
  });
  const [isCreatingSpec, setIsCreatingSpec] = useState(false);

  // Removed: Apicurio Registry state - no longer using Apicurio integration

  // Available filters for multiselect dropdown
  const [availableFilters] = useState([
    'quoteId',
    'customerId',
    'quoteStatus',
    'isPublished',
    'isAutoMergeFailed',
    'isLinkedQuote',
    'isNewVersionNeeded',
    'isSentToErp',
    'useErpTaxes',
    'isEditRestrictionEnabled',
    'isPartialPackOrderingEnabled',
    'isImportedByJson'
  ]);

  // Edit Data Capture Spec form state
  const [editSpecForm, setEditSpecForm] = useState({
    dataCaptureSpecName: '',
    containerName: '',
    tenantId: '',
    dataSourceId: '',
    version: 1,
    isActive: true,
    profile: 'data-capture',
    sourcePrimaryKeyField: '',
    partitionKeyField: 'partitionKey',
    partitionKeyValue: '',
    allowedFilters: [] as string[],
    requiredFields: [] as string[],
    containerSchemaText: ''
  });
  const [isUpdatingSpec, setIsUpdatingSpec] = useState(false);

  // Load selected spec data into edit form when dialog opens
  useEffect(() => {
    if (isSpecEditOpen && selectedSpec) {
      // Find the real spec with all data
      const realSpec = dataCaptureSpecs.find(s => s.dataCaptureSpecId === selectedSpec.dataCaptureSpecId);
      
      if (realSpec) {
        setEditSpecForm({
          dataCaptureSpecName: realSpec.dataCaptureSpecName || '',
          containerName: realSpec.containerName || '',
          tenantId: realSpec.tenantId || '',
          dataSourceId: realSpec.dataSourceId || '',
          version: realSpec.version || 1,
          isActive: realSpec.isActive !== undefined ? realSpec.isActive : true,
          profile: realSpec.profile || 'data-capture',
          sourcePrimaryKeyField: realSpec.sourcePrimaryKeyField || '',
          partitionKeyField: realSpec.partitionKeyField || 'partitionKey',
          partitionKeyValue: realSpec.partitionKeyValue || '',
          allowedFilters: Array.isArray(realSpec.allowedFilters) ? realSpec.allowedFilters : [],
          requiredFields: Array.isArray(realSpec.requiredFields) ? realSpec.requiredFields : [],
          containerSchemaText: realSpec.containerSchema 
            ? JSON.stringify(realSpec.containerSchema, null, 2) 
            : ''
        });
      }
    }
  }, [isSpecEditOpen, selectedSpec, dataCaptureSpecs]);

  // Load IRC example template (from client's curl request)
  const loadIRCExampleTemplate = () => {
    const ircTemplate = {
      dataCaptureSpecName: "irc",
      containerName: "ircs",
      version: 1,
      isActive: true,
      profile: "data-capture",
      sourcePrimaryKeyField: "id",
      partitionKeyField: "id",
      partitionKeyValue: "",
      allowedFilters: ["id"],
      requiredFields: ["id"],
      containerSchema: {
        schemaVersion: 1,
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Document ID. developer/integrator sets it from webapp. Source primary key value in case of one source or combination, also mapped to id if needed"
          },
          metaData: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceDatabase: { type: "string" },
                    sourceTable: { type: "string" },
                    sourcePrimaryKeyField: { type: "string" },
                    sourceCreateTime: { type: ["string", "null"], format: "date-time" },
                    sourceUpdateTime: { type: ["string", "null"], format: "date-time" },
                    sourceEtag: { type: ["string", "null"] }
                  }
                }
              }
            }
          },
          createTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          },
          updateTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          }
        },
        required: ["id"],
        unevaluatedProperties: true
      }
    };

    setCreateSpecForm({
      dataCaptureSpecName: ircTemplate.dataCaptureSpecName,
      containerName: ircTemplate.containerName,
      version: ircTemplate.version,
      isActive: ircTemplate.isActive,
      profile: ircTemplate.profile,
      sourcePrimaryKeyField: ircTemplate.sourcePrimaryKeyField,
      partitionKeyField: ircTemplate.partitionKeyField,
      partitionKeyValue: ircTemplate.partitionKeyValue,
      allowedFilters: ircTemplate.allowedFilters,
      requiredFields: ircTemplate.requiredFields,
      containerSchemaText: JSON.stringify(ircTemplate.containerSchema, null, 2)
    });

    toast.success('Loaded IRC example template');
  };

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

  // Convert DataCaptureSpec to DataCaptureSpecification for display
  const convertSpecForDisplay = (spec: DataCaptureSpec): DataCaptureSpecification => {
    const tenant = tenants.find(t => t.TenantId === spec.tenantId);
    const dataSource = dataSources.find(ds => (ds.DataSourceId || ds.DatasourceId) === spec.dataSourceId);
    
    return {
      id: spec.dataCaptureSpecId || `${spec.dataCaptureSpecName}:${spec.version}`,
      table: spec.dataCaptureSpecName,
      version: String(spec.version),
      date: spec.createTime ? new Date(spec.createTime).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'),
      schema: spec.containerSchema,
      modelSchemaId: spec.dataCaptureSpecId || `${spec.dataCaptureSpecName}:${spec.version}`,
      model: spec.dataCaptureSpecName,
      state: spec.isActive ? 'active' : 'inactive',
      semver: String(spec.version),
      profile: spec.profile,
      tenantId: spec.tenantId,
      dataSourceId: spec.dataSourceId,
      title: spec.dataCaptureSpecName,
      tenantName: tenant?.TenantName || spec.tenantId,
      dataSourceName: getDataSourceName(dataSource || {} as DataSource) || spec.dataSourceId,
      // Real Data Capture Spec fields
      dataCaptureSpecId: spec.dataCaptureSpecId,
      dataCaptureSpecName: spec.dataCaptureSpecName,
      containerName: spec.containerName,
      isActive: spec.isActive,
      sourcePrimaryKeyField: spec.sourcePrimaryKeyField,
      partitionKeyField: spec.partitionKeyField,
      partitionKeyValue: spec.partitionKeyValue,
      allowedFilters: spec.allowedFilters,
      requiredFields: spec.requiredFields,
      containerSchema: spec.containerSchema,
      createTime: spec.createTime,
      updateTime: spec.updateTime
    };
  };

  // Get specifications for a specific data source
  const getSpecificationsForDataSource = (dataSourceId: string, dataSourceTenantId?: string): DataCaptureSpecification[] => {
    // Filter by dataSourceId and optionally by tenantId
    let filtered = dataCaptureSpecs.filter(spec => spec.dataSourceId === dataSourceId);
    
    // If not global tenant, also filter by tenant
    if (activeTenantId !== 'global' && dataSourceTenantId) {
      filtered = filtered.filter(spec => spec.tenantId === dataSourceTenantId);
    }
    
    return filtered.map(convertSpecForDisplay);
  };

  // Load Data Capture Specifications
  const loadDataCaptureSpecs = async (tenantId?: string, dataSourceId?: string) => {
    try {
      setIsLoadingSpecs(true);
      const specs = await getDataCaptureSpecs(tenantId, dataSourceId);
      setDataCaptureSpecs(specs);
    } catch (error) {
      console.error('Failed to load data capture specs:', error);
      toast.error('Failed to load data capture specifications');
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Load Data Capture Specs when active tenant changes
  useEffect(() => {
    if (activeTenantId && activeTenantId !== 'global') {
      loadDataCaptureSpecs(activeTenantId);
    } else if (activeTenantId === 'global') {
      // Load all specs for global tenant
      loadDataCaptureSpecs();
    }
  }, [activeTenantId]);

  // Auto-select current tenant when opening create dialog
  useEffect(() => {
    if (isCreateDialogOpen && !newDataSourceTenantId) {
      // If not global tenant, pre-select the active tenant
      if (activeTenantId && activeTenantId !== 'global') {
        setNewDataSourceTenantId(activeTenantId);
      }
    }
  }, [isCreateDialogOpen, activeTenantId]);

  // Removed: Load Apicurio schemas - no longer using Apicurio integration

  // Auto-fill form and template when opening create spec dialog
  useEffect(() => {
    if (isSpecCreateOpen && selectedDataSource) {
      const dataSourceId = getDataSourceId(selectedDataSource);
      const tenantId = selectedDataSource.TenantId || activeTenantId;
      
      if (tenantId && tenantId !== 'global' && dataSourceId) {
        // Auto-generate container schema template
        const primaryKeyField = createSpecForm.sourcePrimaryKeyField || 'id';
        const partitionKeyField = createSpecForm.partitionKeyField || 'partitionKey';
        
        const template = {
          schemaVersion: 1,
          type: "object",
          properties: {
            [primaryKeyField]: { type: "string" },
            [partitionKeyField]: { type: "string" },
            metaData: {
              type: "object",
              properties: {
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceDatabase: { type: "string" },
                      sourceTable: { type: "string" },
                      sourceCreateTime: { type: ["string", "null"], format: "date-time" },
                      sourceUpdateTime: { type: ["string", "null"], format: "date-time" },
                      sourceEtag: { type: ["string", "null"] }
                    }
                  }
                }
              }
            },
            createTime: { type: ["string", "null"], format: "date-time" },
            updateTime: { type: ["string", "null"], format: "date-time" }
          },
          required: [primaryKeyField, partitionKeyField],
          unevaluatedProperties: true
        };

        setCreateSpecForm(prev => ({
          ...prev,
          partitionKeyValue: `${tenantId}-${dataSourceId}`,
          containerSchemaText: JSON.stringify(template, null, 2)
        }));
      }
    }
  }, [isSpecCreateOpen, selectedDataSource, activeTenantId, createSpecForm.sourcePrimaryKeyField, createSpecForm.partitionKeyField]);

  // Pre-fill edit form when opening edit spec dialog
  useEffect(() => {
    if (isSpecEditOpen && selectedSpec) {
      setEditSpecForm({
        dataCaptureSpecName: selectedSpec.dataCaptureSpecName || '',
        containerName: selectedSpec.containerName || '',
        tenantId: selectedSpec.tenantId || '',
        dataSourceId: selectedSpec.dataSourceId || '',
        version: selectedSpec.version ? parseInt(String(selectedSpec.version)) : 1,
        isActive: selectedSpec.isActive !== undefined ? selectedSpec.isActive : true,
        profile: selectedSpec.profile || 'data-capture',
        sourcePrimaryKeyField: selectedSpec.sourcePrimaryKeyField || '',
        partitionKeyField: selectedSpec.partitionKeyField || 'partitionKey',
        partitionKeyValue: selectedSpec.partitionKeyValue || '',
        allowedFilters: Array.isArray(selectedSpec.allowedFilters) ? selectedSpec.allowedFilters : [],
        requiredFields: Array.isArray(selectedSpec.requiredFields) ? selectedSpec.requiredFields : [],
        allowedFiltersText: selectedSpec.allowedFilters ? selectedSpec.allowedFilters.join('\n') : '',
        requiredFieldsText: selectedSpec.requiredFields ? selectedSpec.requiredFields.join('\n') : '',
        containerSchemaText: selectedSpec.containerSchema ? JSON.stringify(selectedSpec.containerSchema, null, 2) : ''
      });
    }
  }, [isSpecEditOpen, selectedSpec]);

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
      
      // ✅ US1: Offer to continue with Data Capture Specification
      // Show a prompt asking if user wants to add a specification
      setTimeout(() => {
        const continueWithSpec = window.confirm(
          'Data Source created successfully!\n\nWould you like to add a Data Capture Specification now?'
        );
        
        if (continueWithSpec) {
          setSelectedDataSource(created);
          setIsSpecCreateOpen(true);
        }
      }, 500);
      
      // Refresh data from API after a short delay to allow backend to fully process
      setTimeout(() => {
        refreshData();
      }, 1000);
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
      const tenantIdToDelete = dataSourceToDelete.TenantId;
      
      console.log('🗑️ Deleting data source:');
      console.log('  Data Source:', dataSourceToDelete);
      console.log('  ID to delete:', idToDelete);
      console.log('  TenantId:', tenantIdToDelete);
      console.log('  Name:', getDataSourceName(dataSourceToDelete));
      console.log('  ETag:', etag);
      
      if (!idToDelete) {
        throw new Error('Data Source ID is missing');
      }
      
      await deleteDataSource(idToDelete, etag, tenantIdToDelete);
      
      // Remove from list immediately for better UX
      setDataSources(dataSources.filter(ds => getDataSourceId(ds) !== idToDelete));
      
      setIsDeleteDialogOpen(false);
      setDataSourceToDelete(null);
      
      toast.success(`Data source "${getDataSourceName(dataSourceToDelete)}" deleted successfully!`);
      
      // Refresh data from API after a short delay to allow backend to fully process the deletion
      setTimeout(() => {
        refreshData();
      }, 1000);
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
    setEditDataSourceTenantId(dataSource.TenantId || '');
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
        undefined, // tenantId - cannot be changed
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

  // Removed: handleDiscoverSpecifications - no longer using Apicurio integration

  // Check permissions
  // SuperUser and Admin and Developer have full read/write access to Data Source Onboarding
  // ViewOnlySuperUser and Viewer have read-only access
  const canCreate = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canEdit = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canDelete = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';

  return (
    <Card className="w-full max-w-[1440px] mx-auto">
      <CardHeader>
        {/* Action Buttons Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Tenant + Filter */}
          <div className="flex items-center gap-2">
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
          </div>

          {/* Right: Add Button */}
          {canCreate && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          )}
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
          /* Empty State */
          <div className="text-center py-12 text-muted-foreground">
            No data sources available
          </div>
        ) : (
          <DataTable
            data={dataSources}
            columns={columns}
            expandable={true}
            getRowId={(row) => getDataSourceId(row)}
            renderExpandedContent={(row) => {
              const dataSourceId = getDataSourceId(row);
              const dataSourceTenantId = row.TenantId;
              const specifications = getSpecificationsForDataSource(dataSourceId, dataSourceTenantId);
              
              // Filter specifications by search (show all, not filtered by model)
              const searchFilteredSpecs = specifications.filter(spec => 
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
                          setSelectedDataSource(row);
                          setIsSpecCreateOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Specification
                      </Button>
                    )}
                  </div>
                  
                  {isLoadingSpecs ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : specifications.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No Data Capture Specifications defined
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                                    <div className="flex gap-1 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSpec(spec);
                                          setIsSpecViewOpen(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="View specification"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      {canEdit && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedSpec(spec);
                                            setIsSpecEditOpen(true);
                                          }}
                                          className="h-8 w-8 p-0"
                                          title="Edit specification"
                                        >
                                          <Pencil className="h-4 w-4" />
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
                                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                          title="Delete specification"
                                        >
                                          <Trash2 className="h-4 w-4" />
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
                  )}
                </div>
              );
            }}
            actions={(row) => (
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
        <DialogContent className="max-w-[600px]">
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
                <SelectTrigger id="tenantId" className="bg-white border ">
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
          <DialogFooter className="flex w-full justify-between">
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
        <DialogContent className="max-w-[600px]">
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
            
            <div className="space-y-2">
              <Label htmlFor="editTenantId">Tenant ID</Label>
              <Select
                value={editDataSourceTenantId}
                onValueChange={setEditDataSourceTenantId}
                disabled
              >
                <SelectTrigger id="editTenantId" className="bg-white border border-input">
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
                Tenant ID cannot be changed after creation
              </p>
            </div>
          </div>
          <DialogFooter className="flex w-full justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setDataSourceToEdit(null);
                setEditDataSourceName('');
                setEditDataSourceTenantId('');
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
          <DialogFooter className="flex w-full justify-between">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Capture Specification View Dialog */}
      <Dialog open={isSpecViewOpen} onOpenChange={setIsSpecViewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Capture Specification</DialogTitle>
            <DialogDescription>
              Container schema definition for {selectedSpec?.table}
            </DialogDescription>
          </DialogHeader>
          {selectedSpec && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b">
                <div>
                  <div className="text-sm text-muted-foreground">Model</div>
                  <div className="text-sm">{selectedSpec.dataCaptureSpecName || selectedSpec.table}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Container Name</div>
                  <div className="text-sm font-mono">{selectedSpec.containerName || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Version</div>
                  <div className="text-sm">{selectedSpec.version}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Profile</div>
                  <div className="text-sm">{selectedSpec.profile}</div>
                </div>
              </div>

              {/* Partition & Primary Key */}
              {(selectedSpec.sourcePrimaryKeyField || selectedSpec.partitionKeyField || selectedSpec.partitionKeyValue) && (
                <div className="space-y-2 pb-4 border-b">
                  <div className="text-sm font-medium">Partition & Keys</div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSpec.sourcePrimaryKeyField && (
                      <div>
                        <div className="text-sm text-muted-foreground">Source Primary Key</div>
                        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedSpec.sourcePrimaryKeyField}</div>
                      </div>
                    )}
                    {selectedSpec.partitionKeyField && (
                      <div>
                        <div className="text-sm text-muted-foreground">Partition Key Field</div>
                        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedSpec.partitionKeyField}</div>
                      </div>
                    )}
                    {selectedSpec.partitionKeyValue && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Partition Key Value</div>
                        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedSpec.partitionKeyValue}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Allowed Filters & Required Fields */}
              {(selectedSpec.allowedFilters || selectedSpec.requiredFields) && (
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  {selectedSpec.allowedFilters && selectedSpec.allowedFilters.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Allowed Filters ({selectedSpec.allowedFilters.length})</div>
                      <ScrollArea className="h-[120px] rounded-md border p-2">
                        <div className="space-y-1">
                          {selectedSpec.allowedFilters.map((filter: string, idx: number) => (
                            <div key={idx} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {filter}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  {selectedSpec.requiredFields && selectedSpec.requiredFields.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Required Fields ({selectedSpec.requiredFields.length})</div>
                      <ScrollArea className="h-[120px] rounded-md border p-2">
                        <div className="space-y-1">
                          {selectedSpec.requiredFields.map((field: string, idx: number) => (
                            <div key={idx} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {field}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {/* Container Schema - Show sample Cosmos DB document */}
              <div>
                <div className="text-sm font-medium mb-2">Container Schema (Cosmos DB)</div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <pre className="text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                    {JSON.stringify(selectedSpec, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex w-full justify-between">
            <Button variant="outline" onClick={() => setIsSpecViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Data Capture Specification Dialog */}
      <DataCaptureSpecCreateDialog
        isOpen={isSpecCreateOpen}
        onClose={() => setIsSpecCreateOpen(false)}
        selectedDataSource={selectedDataSource}
        activeTenantId={activeTenantId}
        onSuccess={async () => {
          await loadDataCaptureSpecs(activeTenantId !== 'global' ? activeTenantId : undefined);
        }}
        apicurioArtifacts={apicurioArtifacts}
        isLoadingArtifacts={isLoadingArtifacts}
        onRefreshArtifacts={onRefreshArtifacts}
      />



      {/* Data Capture Specification Edit Dialog */}
      <Dialog open={isSpecEditOpen} onOpenChange={setIsSpecEditOpen}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Data Capture Specification</DialogTitle>
            <DialogDescription>
              Update the data capture specification for {selectedSpec?.dataCaptureSpecName || selectedSpec?.table}
            </DialogDescription>
          </DialogHeader>

          {/* Single column layout */}
          <div className="overflow-y-auto h-[calc(90vh-220px)]">
            <div className="space-y-3 pb-4 pr-2">
              {/* Accordion for form sections */}
              <Accordion
                type="multiple"
                defaultValue={["basic", "keys", "required"]}
                className="w-full space-y-3"
              >
                {/* Basic Information */}
                <AccordionItem
                  value="basic"
                  className="bg-white rounded-[10px] border px-4 py-0"
                >
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    Basic Information
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pt-2 pb-2">
                    {/* Tenant ID + Data Source ID */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="editTenantId" className="text-xs">
                          Tenant ID *
                        </Label>
                        <Input
                          id="editTenantId"
                          value={editSpecForm.tenantId || ''}
                          disabled
                          className="bg-muted h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editDataSourceId" className="text-xs">
                          Data Source ID *
                        </Label>
                        <Input
                          id="editDataSourceId"
                          value={editSpecForm.dataSourceId || ''}
                          disabled
                          className="bg-muted h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Specification Name + Container Name */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="editSpecName" className="text-xs">
                          Spec Name *
                        </Label>
                        <Input
                          id="editSpecName"
                          placeholder="e.g., irc"
                          value={editSpecForm.dataCaptureSpecName || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              dataCaptureSpecName: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editContainerName" className="text-xs">
                          Container Name *
                        </Label>
                        <Input
                          id="editContainerName"
                          placeholder="e.g., ircs"
                          value={editSpecForm.containerName || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              containerName: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Key Fields Configuration */}
                <AccordionItem
                  value="keys"
                  className="bg-white rounded-[10px] border px-4 py-0"
                >
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    Key Fields Configuration
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pt-2 pb-2">
                    {/* Source Primary Key Field + Partition Field + Partition Value in 3 columns */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="editPrimaryKey" className="text-xs">
                          Source Primary Key Field *
                        </Label>
                        <Input
                          id="editPrimaryKey"
                          placeholder="e.g., quoteId"
                          value={editSpecForm.sourcePrimaryKeyField || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              sourcePrimaryKeyField: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editPartitionKey" className="text-xs">
                          Partition Key Field *
                        </Label>
                        <Input
                          id="editPartitionKey"
                          placeholder="e.g., partitionKey"
                          value={editSpecForm.partitionKeyField || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              partitionKeyField: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editPartitionValue" className="text-xs">
                          Partition Key Value
                        </Label>
                        <Input
                          id="editPartitionValue"
                          placeholder="Optional"
                          value={editSpecForm.partitionKeyValue || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              partitionKeyValue: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Allowed Filters - Multi-Select Dropdown */}
                    {(() => {
                      // Extract available fields from schema
                      const extractAvailableFields = (): string[] => {
                        if (!editSpecForm.containerSchemaText) return [];
                        try {
                          const schema = JSON.parse(editSpecForm.containerSchemaText);
                          let fields: string[] = [];
                          if (schema.properties && typeof schema.properties === "object") {
                            fields = Object.keys(schema.properties);
                          } else if (Array.isArray(schema.fields)) {
                            fields = schema.fields
                              .filter((f: any) => f && f.name)
                              .map((f: any) => f.name);
                          }
                          return fields;
                        } catch (e) {
                          return [];
                        }
                      };
                      const availableFields = extractAvailableFields();

                      if (availableFields.length === 0) return null;

                      return (
                        <div className="space-y-1">
                          <Label className="text-xs">Allowed Filters *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-auto min-h-[32px] justify-between text-xs font-normal bg-white hover:bg-white"
                              >
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {(!editSpecForm.allowedFilters || editSpecForm.allowedFilters.length === 0) ? (
                                    <span className="text-muted-foreground">
                                      Select filters...
                                    </span>
                                  ) : (
                                    <>
                                      {(editSpecForm.allowedFilters || []).slice(0, 3).map((filter) => (
                                        <Badge
                                          key={filter}
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          {filter}
                                        </Badge>
                                      ))}
                                      {(editSpecForm.allowedFilters || []).length > 3 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          +{(editSpecForm.allowedFilters || []).length - 3} more
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search filters..." className="h-8 text-xs" />
                                <CommandList>
                                  <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                                    No filters found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableFields.map((field) => {
                                      const isSelected = (editSpecForm.allowedFilters || []).includes(field);
                                      return (
                                        <CommandItem
                                          key={field}
                                          value={field}
                                          onSelect={() => {
                                            if (isSelected) {
                                              setEditSpecForm({
                                                ...editSpecForm,
                                                allowedFilters: (editSpecForm.allowedFilters || []).filter(
                                                  (f) => f !== field,
                                                ),
                                              });
                                            } else {
                                              setEditSpecForm({
                                                ...editSpecForm,
                                                allowedFilters: [
                                                  ...(editSpecForm.allowedFilters || []),
                                                  field,
                                                ],
                                              });
                                            }
                                          }}
                                          className="text-xs"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                              <div className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                                isSelected ? "bg-primary border-primary" : "border-input"
                                              }`}>
                                                {isSelected && (
                                                  <Check className="h-3 w-3 text-primary-foreground" />
                                                )}
                                              </div>
                                              <span className="font-mono">{field}</span>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                                <div className="border-t p-2 bg-muted/50">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{(editSpecForm.allowedFilters || []).length} of {availableFields.length} selected</span>
                                    {(editSpecForm.allowedFilters || []).length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditSpecForm({
                                            ...editSpecForm,
                                            allowedFilters: [],
                                          });
                                        }}
                                      >
                                        Clear all
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })()}
                  </AccordionContent>
                </AccordionItem>

                {/* Required Fields */}
                {(() => {
                  // Extract available fields from schema
                  const extractAvailableFields = (): string[] => {
                    if (!editSpecForm.containerSchemaText) return [];
                    try {
                      const schema = JSON.parse(editSpecForm.containerSchemaText);
                      let fields: string[] = [];
                      if (schema.properties && typeof schema.properties === "object") {
                        fields = Object.keys(schema.properties);
                      } else if (Array.isArray(schema.fields)) {
                        fields = schema.fields
                          .filter((f: any) => f && f.name)
                          .map((f: any) => f.name);
                      }
                      return fields;
                    } catch (e) {
                      return [];
                    }
                  };
                  const availableFields = extractAvailableFields();

                  if (availableFields.length === 0) return null;

                  return (
                    <AccordionItem
                      value="required"
                      className="bg-white rounded-[10px] border px-4 py-0"
                    >
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        Required Fields ({(editSpecForm.requiredFields || []).length} selected)
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2 pb-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Required Fields *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-auto min-h-[32px] justify-between text-xs font-normal bg-white hover:bg-white"
                              >
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {(!editSpecForm.requiredFields || editSpecForm.requiredFields.length === 0) ? (
                                    <span className="text-muted-foreground">
                                      Select required fields...
                                    </span>
                                  ) : (
                                    <>
                                      {(editSpecForm.requiredFields || []).slice(0, 3).map((field) => (
                                        <Badge
                                          key={field}
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          {field}
                                        </Badge>
                                      ))}
                                      {(editSpecForm.requiredFields || []).length > 3 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          +{(editSpecForm.requiredFields || []).length - 3} more
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search required fields..." className="h-8 text-xs" />
                                <CommandList>
                                  <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                                    No fields found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableFields.map((field) => {
                                      const isSelected = (editSpecForm.requiredFields || []).includes(field);
                                      return (
                                        <CommandItem
                                          key={field}
                                          value={field}
                                          onSelect={() => {
                                            if (isSelected) {
                                              setEditSpecForm({
                                                ...editSpecForm,
                                                requiredFields: (editSpecForm.requiredFields || []).filter(
                                                  (f) => f !== field,
                                                ),
                                              });
                                            } else {
                                              setEditSpecForm({
                                                ...editSpecForm,
                                                requiredFields: [
                                                  ...(editSpecForm.requiredFields || []),
                                                  field,
                                                ],
                                              });
                                            }
                                          }}
                                          className="text-xs"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                              <div className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                                isSelected ? "bg-primary border-primary" : "border-input"
                                              }`}>
                                                {isSelected && (
                                                  <Check className="h-3 w-3 text-primary-foreground" />
                                                )}
                                              </div>
                                              <span className="font-mono">{field}</span>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                                <div className="border-t p-2 bg-muted/50">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{(editSpecForm.requiredFields || []).length} of {availableFields.length} selected</span>
                                    {(editSpecForm.requiredFields || []).length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditSpecForm({
                                            ...editSpecForm,
                                            requiredFields: [],
                                          });
                                        }}
                                      >
                                        Clear all
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })()}

                {/* Additional Fields - Collapsed by default */}
                <AccordionItem
                  value="additional"
                  className="bg-white rounded-[10px] border px-4 py-0"
                >
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>Additional Fields</span>
                      <Badge variant="outline" className="text-[10px]">
                        Optional
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pt-2 pb-2">
                    {/* Version + Profile + Is Active in 3 columns */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="editVersion" className="text-xs">
                          Version *
                        </Label>
                        <Input
                          id="editVersion"
                          type="number"
                          min="1"
                          value={editSpecForm.version || 1}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              version: parseInt(e.target.value) || 1,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editProfile" className="text-xs">
                          Profile *
                        </Label>
                        <Input
                          id="editProfile"
                          value={editSpecForm.profile || ''}
                          onChange={(e) =>
                            setEditSpecForm({
                              ...editSpecForm,
                              profile: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editIsActive" className="text-xs">
                          Is Active
                        </Label>
                        <div className="flex items-center space-x-2 h-8">
                          <Switch
                            id="editIsActive"
                            checked={editSpecForm.isActive}
                            onCheckedChange={(checked) =>
                              setEditSpecForm({
                                ...editSpecForm,
                                isActive: checked,
                              })
                            }
                          />
                          <Label
                            htmlFor="editIsActive"
                            className="text-xs cursor-pointer"
                          >
                            {editSpecForm.isActive ? "Active" : "Inactive"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Container Schema - Collapsed by default */}
                <AccordionItem
                  value="schema"
                  className="bg-white rounded-[10px] border px-4 py-0"
                >
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    <div className="flex items-center justify-between w-full p-[0px]">
                      <span>Container Schema (JSON)</span>
                      <Badge variant="outline" className="text-[10px]">
                        JSON Schema
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2 pb-2">
                    <div className="border rounded-md overflow-hidden">
                      <textarea
                        className="w-full h-[300px] font-mono text-[11px] p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-muted/20"
                        value={editSpecForm.containerSchemaText || ''}
                        onChange={(e) =>
                          setEditSpecForm({
                            ...editSpecForm,
                            containerSchemaText: e.target.value,
                          })
                        }
                        placeholder="Paste JSON schema here..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <DialogFooter className="flex w-full justify-between">
            <Button
              variant="outline"
              onClick={() => setIsSpecEditOpen(false)}
              disabled={isUpdatingSpec}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedSpec || !selectedSpec.dataCaptureSpecId) {
                  toast.error('No specification selected');
                  return;
                }

                // Validate required fields
                if (!editSpecForm.dataCaptureSpecName || !editSpecForm.sourcePrimaryKeyField || 
                    !editSpecForm.partitionKeyField || !editSpecForm.containerSchemaText) {
                  toast.error('Please fill in all required fields');
                  return;
                }

                // Parse container schema
                let containerSchema;
                try {
                  containerSchema = JSON.parse(editSpecForm.containerSchemaText);
                } catch (error) {
                  toast.error('Invalid JSON in Container Schema');
                  return;
                }

                // Use filters and required fields from state (already arrays)
                const allowedFilters = editSpecForm.allowedFilters || [];
                const requiredFields = editSpecForm.requiredFields || [];

                if (requiredFields.length === 0) {
                  toast.error('At least one required field must be specified');
                  return;
                }

                setIsUpdatingSpec(true);
                try {
                  // Find the real spec to get _etag
                  const realSpec = dataCaptureSpecs.find(s => s.dataCaptureSpecId === selectedSpec.dataCaptureSpecId);
                  if (!realSpec || !realSpec._etag) {
                    toast.error('Specification not found or missing ETag');
                    setIsUpdatingSpec(false);
                    return;
                  }

                  // Get tenantId from the spec or activeTenantId
                  const tenantId = realSpec.tenantId || activeTenantId;
                  if (!tenantId || tenantId === 'global') {
                    toast.error('Cannot update spec: Invalid tenant');
                    setIsUpdatingSpec(false);
                    return;
                  }

                  const updatedSpec = await updateDataCaptureSpec(
                    selectedSpec.dataCaptureSpecId,
                    {
                      dataCaptureSpecName: editSpecForm.dataCaptureSpecName,
                      tenantId: tenantId,
                      dataSourceId: realSpec.dataSourceId,
                      isActive: editSpecForm.isActive,
                      version: editSpecForm.version,
                      profile: editSpecForm.profile,
                      sourcePrimaryKeyField: editSpecForm.sourcePrimaryKeyField,
                      partitionKeyField: editSpecForm.partitionKeyField,
                      partitionKeyValue: editSpecForm.partitionKeyValue,
                      allowedFilters: allowedFilters,
                      requiredFields: requiredFields,
                      containerSchema: containerSchema
                    },
                    realSpec._etag
                  );

                  toast.success(`Data Capture Specification "${editSpecForm.dataCaptureSpecName}" updated successfully!`);
                  setIsSpecEditOpen(false);
                  
                  // Reload specs
                  await loadDataCaptureSpecs(activeTenantId !== 'global' ? activeTenantId : undefined);
                } catch (error: any) {
                  console.error('Failed to update spec:', error);
                  toast.error(error.message || 'Failed to update data capture specification');
                } finally {
                  setIsUpdatingSpec(false);
                }
              }}
              disabled={isUpdatingSpec}
            >
              {isUpdatingSpec ? 'Updating...' : 'Update Specification'}
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
            <AlertDialogCancel onClick={() => {
              setIsSpecDeleteOpen(false);
              setSpecToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!specToDelete || !specToDelete.dataCaptureSpecId) {
                  toast.error('Invalid specification');
                  setIsSpecDeleteOpen(false);
                  setSpecToDelete(null);
                  return;
                }

                try {
                  // Find the real spec to get _etag
                  const realSpec = dataCaptureSpecs.find(s => s.dataCaptureSpecId === specToDelete.dataCaptureSpecId);
                  if (!realSpec || !realSpec._etag) {
                    toast.error('Specification not found or missing ETag');
                    setIsSpecDeleteOpen(false);
                    setSpecToDelete(null);
                    return;
                  }

                  console.log('Deleting spec with:', {
                    dataCaptureSpecId: realSpec.dataCaptureSpecId,
                    dataCaptureSpecName: realSpec.dataCaptureSpecName,
                    version: realSpec.version,
                    etag: realSpec._etag
                  });

                  // Use dataCaptureSpecId directly as returned from API
                  // Pass all available identifiers to help with different API deletion strategies
                  await deleteDataCaptureSpec(
                    realSpec.dataCaptureSpecId || realSpec.dataCaptureSpecName, 
                    realSpec._etag,
                    realSpec.version,
                    realSpec.containerName,
                    realSpec.tenantId,
                    realSpec.dataSourceId
                  );
                  toast.success(`Specification for ${specToDelete.table} deleted successfully!`);
                  
                  // Reload specs
                  await loadDataCaptureSpecs(activeTenantId !== 'global' ? activeTenantId : undefined);
                } catch (error: any) {
                  console.error('Failed to delete spec:', error);
                  toast.error(error.message || 'Failed to delete specification');
                } finally {
                  setIsSpecDeleteOpen(false);
                  setSpecToDelete(null);
                }
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
