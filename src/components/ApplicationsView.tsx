import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { DataTable } from './DataTable';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Skeleton } from './ui/skeleton';
import { Plus, Trash2, Pencil, Eye, AppWindow, MoreVertical, Filter } from 'lucide-react';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';

import { UserRole } from './AuthContext';

interface ApplicationsViewProps {
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

// Application Interface
interface Application {
  ApplicationId: string;
  ApplicationName: string;
  Version?: string;
  Description?: string;
  Status?: string;
  CreateTime?: string;
  UpdateTime?: string;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

// Transaction Specification interface
interface TransactionSpecification {
  id: string;
  table: string;
  version: string;
  date: string;
  schema?: any;
}

// Helper functions to handle field name
const getApplicationId = (app: Application) => app.ApplicationId || '';
const getApplicationName = (app: Application) => app.ApplicationName || '';

// Mock Applications
const mockApplications: Application[] = [
  {
    ApplicationId: 'app-001',
    ApplicationName: 'myBLDR',
    Version: '1.0',
    Description: '',
    Status: 'Active',
    CreateTime: '2025-10-30T00:00:00Z',
    UpdateTime: '2025-10-30T00:00:00Z',
    _etag: 'etag-001',
  },
  {
    ApplicationId: 'app-002',
    ApplicationName: 'Will Call',
    Version: '2.1',
    Description: '',
    Status: 'Active',
    CreateTime: '2025-10-31T00:00:00Z',
    UpdateTime: '2025-10-31T00:00:00Z',
    _etag: 'etag-002',
  },
];

// Mock Transaction Specifications
const getMockSpecifications = (applicationName: string): TransactionSpecification[] => {
  // All applications have the same specifications
  return [
    {
      id: 'spec_quote',
      table: 'Quote',
      version: '2.0',
      date: '10/30/2025',
    },
    {
      id: 'spec_customer',
      table: 'Customer',
      version: '2.1',
      date: '10/31/2025',
    },
    {
      id: 'spec_order',
      table: 'Order',
      version: '2.1',
      date: '10/31/2025',
    },
  ];
};

export function ApplicationsView({ userRole, tenants, activeTenantId, onTenantChange }: ApplicationsViewProps) {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [newApplicationName, setNewApplicationName] = useState('');
  const [newApplicationVersion, setNewApplicationVersion] = useState('');
  const [newApplicationDescription, setNewApplicationDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail view state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Edit state
  const [applicationToEdit, setApplicationToEdit] = useState<Application | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editApplicationName, setEditApplicationName] = useState('');
  
  // Transaction Specifications state
  const [selectedSpec, setSelectedSpec] = useState<TransactionSpecification | null>(null);
  const [isSpecViewOpen, setIsSpecViewOpen] = useState(false);
  const [isSpecEditOpen, setIsSpecEditOpen] = useState(false);
  const [isSpecDeleteOpen, setIsSpecDeleteOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState<TransactionSpecification | null>(null);

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
    if (!newApplicationName.trim()) {
      toast.error('Application Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const created: Application = {
        ApplicationId: `app-${Date.now()}`,
        ApplicationName: newApplicationName.trim(),
        Version: newApplicationVersion.trim() || '1.0',
        Description: newApplicationDescription.trim(),
        Status: 'Active',
        CreateTime: new Date().toISOString(),
        UpdateTime: new Date().toISOString(),
        _etag: `etag-${Date.now()}`,
      };
      
      // Add to list (prepend - newest first)
      setApplications([created, ...applications]);
      
      // Reset form
      setNewApplicationName('');
      setNewApplicationVersion('');
      setNewApplicationDescription('');
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const idToDelete = getApplicationId(applicationToDelete);
      
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
    setEditApplicationName(getApplicationName(application));
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!applicationToEdit) return;
    if (!editApplicationName.trim()) {
      toast.error('Application Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updated: Application = {
        ...applicationToEdit,
        ApplicationName: editApplicationName.trim(),
        UpdateTime: new Date().toISOString(),
      };
      
      // Update in list
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
        {/* Mobile Layout: Stack vertically */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-[20px] font-bold pt-[0px] pr-[0px] pb-[5px] pl-[0px]">
              Applications
            </CardTitle>
            <CardDescription>
              Manage applications and their transaction specifications
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
                Add Application
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
                      Add Application
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
        ) : applications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <AppWindow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No Applications</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first application
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={applications}
            columns={columns}
            expandable={true}
            getRowId={(row) => getApplicationId(row)}
            renderExpandedContent={(row) => {
              const specifications = getMockSpecifications(getApplicationName(row));
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm">Transaction Specifications:</h4>
                    {canCreate && (
                      <Button 
                        size="sm" 
                        className="bg-[#1D6BCD] hover:bg-[#1557A8]"
                        onClick={() => {
                          toast.info('Add Transaction Specification - Coming soon!');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Transaction Specification
                      </Button>
                    )}
                  </div>
                  
                  {specifications.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <AppWindow className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No Transaction Specifications defined
                      </p>
                      {canCreate && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => {
                            toast.info('Add Transaction Specification - Coming soon!');
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Specification
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left py-2 px-4">Table</th>
                            <th className="text-left py-2 px-4">Version</th>
                            <th className="text-left py-2 px-4">Date</th>
                            <th className="text-right py-2 px-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specifications.map((spec) => (
                            <tr key={spec.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="py-2 px-4">{spec.table}</td>
                              <td className="py-2 px-4">{spec.version}</td>
                              <td className="py-2 px-4">{spec.date}</td>
                              <td className="py-2 px-4">
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
                          ))}
                        </tbody>
                      </table>
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
        <DialogContent>
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
                value={newApplicationName}
                onChange={(e) => setNewApplicationName(e.target.value)}
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
                value={newApplicationVersion}
                onChange={(e) => setNewApplicationVersion(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewApplicationName('');
                setNewApplicationVersion('');
                setNewApplicationDescription('');
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update application name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editApplicationName">Application Name *</Label>
              <Input
                id="editApplicationName"
                placeholder="Enter application name"
                value={editApplicationName}
                onChange={(e) => setEditApplicationName(e.target.value)}
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
                setApplicationToEdit(null);
                setEditApplicationName('');
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
      <Dialog open={isSpecViewOpen} onOpenChange={setIsSpecViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Specification Details</DialogTitle>
            <DialogDescription>
              View transaction specification information
            </DialogDescription>
          </DialogHeader>
          {selectedSpec && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Table</p>
                  <p className="text-sm">{selectedSpec.table}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Version</p>
                  <p className="text-sm">{selectedSpec.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="text-sm">{selectedSpec.date}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsSpecViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Specification Dialog */}
      <Dialog open={isSpecEditOpen} onOpenChange={setIsSpecEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction Specification</DialogTitle>
            <DialogDescription>
              Edit specification - Coming soon!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsSpecEditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Specification Dialog */}
      <AlertDialog open={isSpecDeleteOpen} onOpenChange={setIsSpecDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction Specification</AlertDialogTitle>
            <AlertDialogDescription>
              Delete specification - Coming soon!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}