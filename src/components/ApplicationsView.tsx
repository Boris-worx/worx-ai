import { Textarea } from './ui/textarea';
import { DataTable } from './DataTable';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Skeleton } from './ui/skeleton';
import { Plus, Trash2, Pencil, Eye, AppWindow, MoreVertical, Filter, Info, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SearchIcon } from './icons/SearchIcon';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { Tenant, Application, getApplications, createApplication, updateApplication, deleteApplication, TransactionSpecification, getTransactionSpecifications, createTransactionSpecification, updateTransactionSpecification, deleteTransactionSpecification } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { TransactionSpecificationDialog } from './TransactionSpecificationDialog';
import { TransactionSpecificationViewDialog } from './TransactionSpecificationViewDialog';
import type { UserRole } from './AuthContext';

interface ApplicationsViewProps {
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

// Helper functions to handle field name
const getApplicationId = (app: Application) => app.ApplicationId || '';
const getApplicationName = (app: Application) => app.ApplicationName || '';

export function ApplicationsView({ userRole, tenants, activeTenantId, onTenantChange }: ApplicationsViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [isUsingMockSpecs, setIsUsingMockSpecs] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  
  // Create form state
  const [newApplicationForm, setNewApplicationForm] = useState({
    name: '',
    tenantId: '',
    version: '',
    description: '',
    status: 'Active'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail view state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Edit state
  const [applicationToEdit, setApplicationToEdit] = useState<Application | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editApplicationForm, setEditApplicationForm] = useState({
    name: '',
    version: '',
    description: '',
    status: 'Active'
  });
  
  // Transaction Specifications state
  const [transactionSpecs, setTransactionSpecs] = useState<Map<string, TransactionSpecification[]>>(new Map());
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<TransactionSpecification | null>(null);
  const [isSpecViewOpen, setIsSpecViewOpen] = useState(false);
  const [isSpecCreateOpen, setIsSpecCreateOpen] = useState(false);
  const [isSpecEditOpen, setIsSpecEditOpen] = useState(false);
  const [isSpecDeleteOpen, setIsSpecDeleteOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState<TransactionSpecification | null>(null);
  const [currentApplicationForSpec, setCurrentApplicationForSpec] = useState<Application | null>(null);
  const [isSubmittingSpec, setIsSubmittingSpec] = useState(false);
  
  // Transaction Specifications search, sort, and pagination state
  const [specificationSearch, setSpecificationSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPagePerApplication, setCurrentPagePerApplication] = useState<{ [key: string]: number }>({});

  // Load applications from API when tenant changes
  useEffect(() => {
    loadApplications();
  }, [activeTenantId]);

  const loadApplications = async () => {
    setIsLoading(true);
    setIsUsingMockData(false); // Reset flag
    try {
      const data = await getApplications(
        activeTenantId === 'global' ? undefined : activeTenantId
      );
      
      // Check if we got mock data by looking at the application IDs
      // Mock data typically has IDs like 'app-001', 'app-002', etc.
      const hasMockPattern = data.some(app => /^app-\d{3,}$/.test(app.ApplicationId));
      setIsUsingMockData(hasMockPattern || data.length === 0);
      
      setApplications(data);
      console.log(`✅ Loaded ${data.length} applications for tenant: ${activeTenantId}`);
      
      // Load transaction specifications for each application
      await loadTransactionSpecifications(data);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast.error(`Failed to load applications: ${error.message}`);
      setApplications([]);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Transaction Specifications for applications
  const loadTransactionSpecifications = async (apps: Application[]) => {
    setIsLoadingSpecs(true);
    setIsUsingMockSpecs(false); // Reset flag
    try {
      const specsMap = new Map<string, TransactionSpecification[]>();
      let foundMockSpecs = false;
      
      // Load specs for each application
      await Promise.all(
        apps.map(async (app) => {
          try {
            const appId = getApplicationId(app);
            const specs = await getTransactionSpecifications(appId, activeTenantId === 'global' ? undefined : activeTenantId);
            
            // Check if specs have mock pattern (txspec-xxx format)
            if (specs.some(spec => /^txspec-\d{3,}$/.test(spec.TransactionSpecId || ''))) {
              foundMockSpecs = true;
            }
            
            specsMap.set(appId, specs);
          } catch (error) {
            console.error(`Failed to load specs for application ${getApplicationId(app)}:`, error);
            specsMap.set(getApplicationId(app), []);
          }
        })
      );
      
      setIsUsingMockSpecs(foundMockSpecs);
      setTransactionSpecs(specsMap);
    } catch (error: any) {
      console.error('Error loading transaction specifications:', error);
      setIsUsingMockSpecs(true);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Reload specifications for a specific application
  const reloadSpecificationsForApp = async (applicationId: string) => {
    try {
      const specs = await getTransactionSpecifications(applicationId, activeTenantId === 'global' ? undefined : activeTenantId);
      setTransactionSpecs(new Map(transactionSpecs.set(applicationId, specs)));
    } catch (error: any) {
      console.error(`Failed to reload specs for application ${applicationId}:`, error);
      toast.error(`Failed to reload specifications: ${error.message}`);
    }
  };

  // Create Transaction Specification
  const handleCreateSpec = async (data: {
    specName: string;
    version: string;
    description: string;
    status: 'Active' | 'Inactive';
    jsonSchema: any;
  }) => {
    if (!currentApplicationForSpec) return;
    
    setIsSubmittingSpec(true);
    try {
      const applicationId = getApplicationId(currentApplicationForSpec);
      const tenantId = currentApplicationForSpec.TenantId;
      
      const created = await createTransactionSpecification({
        ApplicationId: applicationId,
        TenantId: tenantId,
        SpecName: data.specName,
        Version: data.version,
        Description: data.description,
        Status: data.status,
        JsonSchema: data.jsonSchema
      });
      
      // Reload specifications for this application
      await reloadSpecificationsForApp(applicationId);
      
      setIsSpecCreateOpen(false);
      setCurrentApplicationForSpec(null);
      
      toast.success(`Transaction Specification "${data.specName}" created successfully!`);
    } catch (error: any) {
      toast.error(`Failed to create specification: ${error.message}`);
      throw error; // Re-throw to keep dialog open
    } finally {
      setIsSubmittingSpec(false);
    }
  };

  // Edit Transaction Specification
  const handleEditSpec = async (data: {
    specName: string;
    version: string;
    description: string;
    status: 'Active' | 'Inactive';
    jsonSchema: any;
  }) => {
    if (!selectedSpec) return;
    
    setIsSubmittingSpec(true);
    try {
      const updated = await updateTransactionSpecification(
        selectedSpec.TransactionSpecId!,
        {
          SpecName: data.specName,
          Version: data.version,
          Description: data.description,
          Status: data.status,
          JsonSchema: data.jsonSchema
        },
        selectedSpec._etag
      );
      
      // Reload specifications for this application
      await reloadSpecificationsForApp(selectedSpec.ApplicationId);
      
      setIsSpecEditOpen(false);
      setSelectedSpec(null);
      
      toast.success(`Transaction Specification "${data.specName}" updated successfully!`);
    } catch (error: any) {
      toast.error(`Failed to update specification: ${error.message}`);
      throw error; // Re-throw to keep dialog open
    } finally {
      setIsSubmittingSpec(false);
    }
  };

  // Delete Transaction Specification
  const handleDeleteSpec = async () => {
    if (!specToDelete) return;
    
    setIsSubmittingSpec(true);
    try {
      await deleteTransactionSpecification(
        specToDelete.TransactionSpecId!,
        specToDelete._etag
      );
      
      // Reload specifications for this application
      await reloadSpecificationsForApp(specToDelete.ApplicationId);
      
      setIsSpecDeleteOpen(false);
      setSpecToDelete(null);
      
      toast.success(`Transaction Specification "${specToDelete.SpecName}" deleted successfully!`);
    } catch (error: any) {
      toast.error(`Failed to delete specification: ${error.message}`);
    } finally {
      setIsSubmittingSpec(false);
    }
  };

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns - commonly used fields
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'ApplicationName', label: 'Application', enabled: true, locked: true },
    { key: 'Version', label: 'Version', enabled: true },
    { key: 'CreateTime', label: 'Date', enabled: true },
    { key: 'TenantId', label: 'Tenant ID', enabled: userRole === 'superuser' }, // Only enabled for SuperUser
    { key: 'ApplicationId', label: 'Application ID', enabled: false },
    { key: 'Status', label: 'Status', enabled: false },
    { key: 'Description', label: 'Description', enabled: false },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '2';
    const saved = localStorage.getItem('applicationsViewColumns');
    const savedVersion = localStorage.getItem('applicationsViewColumnsVersion');
    
    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    // Clear old data and use defaults
    localStorage.removeItem('applicationsViewColumns');
    localStorage.setItem('applicationsViewColumnsVersion', STORAGE_VERSION);
    return getDefaultColumns();
  });

  // Save column configs to localStorage whenever they change
  useEffect(() => {
    const STORAGE_VERSION = '2';
    localStorage.setItem('applicationsViewColumns', JSON.stringify(columnConfigs));
    localStorage.setItem('applicationsViewColumnsVersion', STORAGE_VERSION);
  }, [columnConfigs]);

  // Extract available fields from applications to offer as columns
  const availableFields = useMemo(() => {
    if (applications.length === 0) return [];
    
    const fieldsSet = new Set<string>();
    applications.forEach(app => {
      Object.keys(app).forEach(key => {
        if (!key.startsWith('_')) {
          fieldsSet.add(key);
        }
      });
    });
    
    return Array.from(fieldsSet).sort();
  }, [applications]);

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

  // Helper to check if a value is empty
  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && (value.trim() === '' || value === '—')) return true;
    return false;
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (applications.length === 0) {
      // If no data, don't mark anything as empty
      return columnConfigs.map(col => ({ ...col, isEmpty: false }));
    }
    
    return columnConfigs.map(col => {
      // Check if column has any non-empty values
      const hasData = col.locked || applications.some(row => {
        let value: any;
        
        // Use helper functions for ID and Name fields
        if (col.key === 'ApplicationId') {
          value = getApplicationId(row);
        } else if (col.key === 'ApplicationName') {
          value = getApplicationName(row);
        } else {
          value = row[col.key as keyof Application];
        }
        
        return !isEmptyValue(value);
      });
      
      return {
        ...col,
        isEmpty: !hasData
      };
    });
  }, [columnConfigs, applications]);

  // Get enabled columns and convert to DataTable format
  const columns = useMemo(() => {
    return enrichedColumnConfigs
      .filter(c => c.enabled)
      // Filter out columns that have no data (all values are empty)
      .filter(c => c.locked || !c.isEmpty)
      .map(colConfig => ({
        key: colConfig.key,
        header: colConfig.label,
        render: (row: Application) => {
          // Use helper functions for ID and Name fields
          if (colConfig.key === 'ApplicationId') {
            const id = getApplicationId(row);
            const displayId = id || 'N/A';
            return (
              <div className="max-w-[120px] md:max-w-[180px]">
                <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={displayId}>
                  {displayId}
                </code>
              </div>
            );
          }
          if (colConfig.key === 'ApplicationName') {
            const name = getApplicationName(row);
            return name || '—';
          }
          
          // Get the value using the config key
          const value = row[colConfig.key as keyof Application];
          return formatCellValue(value, colConfig.key);
        },
      }));
  }, [enrichedColumnConfigs, applications]);

  // Create application handler
  const handleCreate = async () => {
    if (!newApplicationForm.name.trim()) {
      toast.error('Application Name is required');
      return;
    }

    // Validate TenantId selection
    if (!newApplicationForm.tenantId) {
      toast.error('Please select a Tenant');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createApplication({
        ApplicationName: newApplicationForm.name.trim(),
        TenantId: newApplicationForm.tenantId,
        Version: newApplicationForm.version.trim() || '1.0',
        Description: newApplicationForm.description.trim(),
        Status: newApplicationForm.status || 'Active',
      });
      
      // Add to list (prepend - newest first)
      setApplications([created, ...applications]);
      
      // Reset form
      setNewApplicationForm({
        name: '',
        tenantId: '',
        version: '',
        description: '',
        status: 'Active'
      });
      setIsCreateDialogOpen(false);
      
      toast.success(`Application "${getApplicationName(created)}" created successfully!`);
    } catch (error: any) {
      toast.error(`Failed to create application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete application handler
  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!applicationToDelete) return;

    setIsSubmitting(true);
    try {
      const idToDelete = getApplicationId(applicationToDelete);
      
      // Call real BFS API to delete application
      await deleteApplication(idToDelete, applicationToDelete._etag);
      
      // Remove from list
      setApplications(applications.filter(app => getApplicationId(app) !== idToDelete));
      
      setIsDeleteDialogOpen(false);
      setApplicationToDelete(null);
      
      toast.success(`Application "${getApplicationName(applicationToDelete)}" deleted successfully!`);
    } catch (error: any) {
      toast.error(`Failed to delete application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View application details
  const handleViewClick = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailOpen(true);
  };

  // Edit application
  const handleEditClick = (application: Application) => {
    setApplicationToEdit(application);
    setEditApplicationForm({
      name: getApplicationName(application),
      version: application.Version || '',
      description: application.Description || '',
      status: application.Status || 'Active'
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!applicationToEdit) return;
    if (!editApplicationForm.name.trim()) {
      toast.error('Application Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call real BFS API to update application
      const updated = await updateApplication(
        getApplicationId(applicationToEdit),
        {
          ApplicationName: editApplicationForm.name.trim(),
          Version: editApplicationForm.version.trim() || '1.0',
          Description: editApplicationForm.description.trim(),
          Status: editApplicationForm.status,
        },
        applicationToEdit._etag // Pass ETag for optimistic concurrency
      );
      
      // Update in list with the response from API
      setApplications(applications.map(app => 
        getApplicationId(app) === getApplicationId(updated) ? updated : app
      ));
      
      setIsEditOpen(false);
      setApplicationToEdit(null);
      
      toast.success(`Application "${getApplicationName(updated)}" updated successfully!`);
    } catch (error: any) {
      toast.error(`Failed to update application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format cell value
  const formatCellValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined || value === '') return '—';
    
    // Format dates as MM/DD/YYYY
    if (key === 'CreateTime' || key === 'UpdateTime') {
      try {
        const date = new Date(value);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return <span className="whitespace-nowrap text-xs md:text-sm">{`${month}/${day}/${year}`}</span>;
      } catch {
        return String(value);
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
    
    // Format Version
    if (key === 'Version') {
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
              Add Application
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
        ) : applications.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 text-muted-foreground">
            No applications available
          </div>
        ) : (
          <DataTable
            data={applications}
            columns={columns}
            expandable={true}
            getRowId={(row) => getApplicationId(row)}
            renderExpandedContent={(row) => {
              const applicationId = getApplicationId(row);
              const applicationTenantId = row.TenantId;
              const specifications = transactionSpecs.get(applicationId) || [];
              
              // Filter specifications by search
              const searchFilteredSpecs = specifications.filter(spec => 
                spec.TransactionSpecId?.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.SpecName?.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.Version?.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.ApplicationId?.toLowerCase().includes(specificationSearch.toLowerCase()) ||
                spec.TenantId?.toLowerCase().includes(specificationSearch.toLowerCase())
              );
              
              // Sort specifications
              const sortedSpecs = [...searchFilteredSpecs].sort((a, b) => {
                if (!sortColumn) return 0;
                
                let aValue = '';
                let bValue = '';
                
                switch (sortColumn) {
                  case 'TransactionSpecId':
                    aValue = a.TransactionSpecId || '';
                    bValue = b.TransactionSpecId || '';
                    break;
                  case 'SpecName':
                    aValue = a.SpecName || '';
                    bValue = b.SpecName || '';
                    break;
                  case 'Version':
                    aValue = a.Version || '';
                    bValue = b.Version || '';
                    break;
                  case 'Status':
                    aValue = a.Status || '';
                    bValue = b.Status || '';
                    break;
                  case 'ApplicationId':
                    aValue = a.ApplicationId || '';
                    bValue = b.ApplicationId || '';
                    break;
                  case 'TenantId':
                    aValue = a.TenantId || '';
                    bValue = b.TenantId || '';
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
                setCurrentPagePerApplication(prev => ({
                  ...prev,
                  [applicationId]: 1
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
              const currentPage = currentPagePerApplication[applicationId] || 1;
              const totalPages = Math.ceil(sortedSpecs.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedSpecs = sortedSpecs.slice(startIndex, endIndex);
              
              const handlePageChange = (page: number) => {
                setCurrentPagePerApplication(prev => ({
                  ...prev,
                  [applicationId]: page
                }));
              };
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm">Transaction Specifications</h4>
                    {canCreate && (
                      <Button 
                        size="sm" 
                        className="bg-[#1D6BCD] hover:bg-[#1557A8]"
                        onClick={() => {
                          setCurrentApplicationForSpec(row);
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
                        No Transaction Specifications defined
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
                            setCurrentPagePerApplication(prev => ({
                              ...prev,
                              [applicationId]: 1
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
                                onClick={() => handleSort('TransactionSpecId')}
                              >
                                Specification ID{renderSortIcon('TransactionSpecId')}
                              </th>
                              <th 
                                className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                onClick={() => handleSort('SpecName')}
                              >
                                Name{renderSortIcon('SpecName')}
                              </th>
                              <th 
                                className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                onClick={() => handleSort('Version')}
                              >
                                Version{renderSortIcon('Version')}
                              </th>
                              <th 
                                className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                onClick={() => handleSort('Status')}
                              >
                                Status{renderSortIcon('Status')}
                              </th>
                              <th 
                                className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                onClick={() => handleSort('ApplicationId')}
                              >
                                Application ID{renderSortIcon('ApplicationId')}
                              </th>
                              <th 
                                className="text-left py-2 px-4 whitespace-nowrap cursor-pointer hover:bg-muted/70 select-none font-normal"
                                onClick={() => handleSort('TenantId')}
                              >
                                Tenant ID{renderSortIcon('TenantId')}
                              </th>
                              <th className="text-right py-2 px-4 whitespace-nowrap font-normal">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-card">
                            {paginatedSpecs.length > 0 ? (
                              paginatedSpecs.map((spec) => (
                                <tr key={spec.TransactionSpecId} className="border-b last:border-0">
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="max-w-[120px] md:max-w-[180px]">
                                      <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={spec.TransactionSpecId}>
                                        {spec.TransactionSpecId}
                                      </code>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.SpecName}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">{spec.Version}</td>
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <Badge 
                                      variant={spec.Status === 'Active' ? 'default' : 'secondary'}
                                      className={spec.Status === 'Active' ? 'bg-green-600 hover:bg-green-700 text-xs' : 'text-xs'}
                                    >
                                      {spec.Status || 'Active'}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="max-w-[120px] md:max-w-[180px]">
                                      <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={spec.ApplicationId}>
                                        {spec.ApplicationId}
                                      </code>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <div className="max-w-[120px] md:max-w-[180px]">
                                      <code className="text-[10px] md:text-[11px] bg-muted px-1 md:px-1.5 py-0.5 rounded truncate block" title={spec.TenantId}>
                                        {spec.TenantId}
                                      </code>
                                    </div>
                                  </td>
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
                  title="View application"
                >
                  <ViewIcon className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(row)}
                    className="h-8 w-8 p-0"
                    title="Edit application"
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
                    title="Delete application"
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
                  title="View application"
                >
                  <ViewIcon className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(row)}
                    className="h-8 w-8 p-0"
                    title="Edit application"
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
                    title="Delete application"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          />
        )}
      </CardContent>

      {/* Create Application Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
            <DialogDescription>
              Add a new application to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="applicationName">Application Name *</Label>
              <Input
                id="applicationName"
                placeholder="Enter application name"
                value={newApplicationForm.name}
                onChange={(e) => setNewApplicationForm({ ...newApplicationForm, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationVersion">Version</Label>
              <Input
                id="applicationVersion"
                placeholder="e.g., 1.0"
                value={newApplicationForm.version}
                onChange={(e) => setNewApplicationForm({ ...newApplicationForm, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationTenant">Tenant</Label>
              <Select
                value={newApplicationForm.tenantId}
                onValueChange={(value) => setNewApplicationForm({ ...newApplicationForm, tenantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant">
                    {newApplicationForm.tenantId ? tenants.find(t => t.TenantId === newApplicationForm.tenantId)?.TenantName : 'Select a tenant'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.TenantId} value={tenant.TenantId}>
                      {tenant.TenantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationDescription">Description</Label>
              <Textarea
                id="applicationDescription"
                placeholder="Enter application description (optional)"
                value={newApplicationForm.description}
                onChange={(e) => setNewApplicationForm({ ...newApplicationForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationStatus">Status</Label>
              <Select
                value={newApplicationForm.status}
                onValueChange={(value) => setNewApplicationForm({ ...newApplicationForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status">
                    {newApplicationForm.status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex w-full justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewApplicationForm({
                  name: '',
                  tenantId: '',
                  version: '',
                  description: '',
                  status: 'Active'
                });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update application information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editApplicationName">Application Name *</Label>
              <Input
                id="editApplicationName"
                placeholder="Enter application name"
                value={editApplicationForm.name}
                onChange={(e) => setEditApplicationForm({ ...editApplicationForm, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editApplicationVersion">Version</Label>
              <Input
                id="editApplicationVersion"
                placeholder="e.g., 1.0"
                value={editApplicationForm.version}
                onChange={(e) => setEditApplicationForm({ ...editApplicationForm, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editApplicationDescription">Description</Label>
              <Textarea
                id="editApplicationDescription"
                placeholder="Enter application description (optional)"
                value={editApplicationForm.description}
                onChange={(e) => setEditApplicationForm({ ...editApplicationForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editApplicationStatus">Status</Label>
              <Select
                value={editApplicationForm.status}
                onValueChange={(value) => setEditApplicationForm({ ...editApplicationForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status">
                    {editApplicationForm.status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setApplicationToEdit(null);
                setEditApplicationForm({
                  name: '',
                  version: '',
                  description: '',
                  status: 'Active'
                });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Application Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{applicationToDelete ? getApplicationName(applicationToDelete) : ''}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Application Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about this application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                    {getApplicationId(selectedApplication)}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-sm">{getApplicationName(selectedApplication)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Version</p>
                  <p className="text-sm">{selectedApplication.Version || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="text-sm">{selectedApplication.Status || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">
                    {selectedApplication.CreateTime 
                      ? new Date(selectedApplication.CreateTime).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Updated</p>
                  <p className="text-sm">
                    {selectedApplication.UpdateTime 
                      ? new Date(selectedApplication.UpdateTime).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedApplication.Description || '—'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transaction Specification Dialog */}
      <TransactionSpecificationViewDialog
        open={isSpecViewOpen}
        onOpenChange={setIsSpecViewOpen}
        specification={selectedSpec}
      />

      {/* Create Transaction Specification Dialog */}
      <TransactionSpecificationDialog
        open={isSpecCreateOpen}
        onOpenChange={setIsSpecCreateOpen}
        mode="create"
        specification={null}
        applicationId={currentApplicationForSpec ? getApplicationId(currentApplicationForSpec) : ''}
        tenantId={currentApplicationForSpec?.TenantId || ''}
        onSubmit={handleCreateSpec}
        isSubmitting={isSubmittingSpec}
      />

      {/* Edit Transaction Specification Dialog */}
      <TransactionSpecificationDialog
        open={isSpecEditOpen}
        onOpenChange={setIsSpecEditOpen}
        mode="edit"
        specification={selectedSpec}
        applicationId={selectedSpec?.ApplicationId || ''}
        tenantId={selectedSpec?.TenantId || ''}
        onSubmit={handleEditSpec}
        isSubmitting={isSubmittingSpec}
      />

      {/* Delete Transaction Specification Dialog */}
      <AlertDialog open={isSpecDeleteOpen} onOpenChange={setIsSpecDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction Specification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{specToDelete?.SpecName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingSpec}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpec}
              disabled={isSubmittingSpec}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmittingSpec ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}