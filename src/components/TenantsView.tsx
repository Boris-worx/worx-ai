import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DataTable } from './DataTable';
import { RefreshIcon } from './icons/RefreshIcon';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Plus, RefreshCw, Trash2, Pencil, Upload, Eye, MoreVertical, Filter } from 'lucide-react';
import { Tenant, createTenant, deleteTenant } from '../lib/api';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { TenantDetail } from './TenantDetail';
import { TenantEditForm } from './TenantEditForm';
import { TenantImportDialog } from './TenantImportDialog';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

import { UserRole } from './AuthContext';

interface TenantsViewProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  isLoading: boolean;
  refreshData: () => void;
  userRole: UserRole;
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function TenantsView({ tenants, setTenants, isLoading, refreshData, userRole, activeTenantId, onTenantChange }: TenantsViewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [newTenantName, setNewTenantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail view state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Edit state
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Permission checks based on role hierarchy
  // Only Portal.SuperUser has full access to tenants (view/create/edit/delete)
  // Portal.ViewOnlySuperUser has read-only access to tenants
  const canCreate = userRole === 'superuser';
  const canEdit = userRole === 'superuser';
  const canDelete = userRole === 'superuser';
  const canView = userRole === 'superuser' || userRole === 'viewonlysuperuser';

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns - commonly used fields
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'TenantId', label: 'Tenant ID', enabled: true, locked: true },
    { key: 'TenantName', label: 'Tenant Name', enabled: true },
    { key: 'CreateTime', label: 'Created', enabled: true },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
    { key: 'Status', label: 'Status', enabled: false },
    { key: 'Description', label: 'Description', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '2'; // Increment when changing default columns
    const saved = localStorage.getItem('tenantsViewColumns');
    const savedVersion = localStorage.getItem('tenantsViewColumnsVersion');
    
    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    // Clear old data and use defaults
    localStorage.removeItem('tenantsViewColumns');
    localStorage.setItem('tenantsViewColumnsVersion', STORAGE_VERSION);
    return getDefaultColumns();
  });

  // Save column configs to localStorage whenever they change
  useEffect(() => {
    const STORAGE_VERSION = '2';
    localStorage.setItem('tenantsViewColumns', JSON.stringify(columnConfigs));
    localStorage.setItem('tenantsViewColumnsVersion', STORAGE_VERSION);
  }, [columnConfigs]);

  // Extract available fields from tenants to offer as columns
  const availableFields = useMemo(() => {
    if (tenants.length === 0) return [];
    
    const fieldsSet = new Set<string>();
    tenants.forEach(tenant => {
      Object.keys(tenant).forEach(key => {
        if (!key.startsWith('_')) {
          fieldsSet.add(key);
        }
      });
    });
    
    return Array.from(fieldsSet).sort();
  }, [tenants]);

  // Update column configs when new fields are detected
  useEffect(() => {
    if (availableFields.length > 0) {
      setColumnConfigs(prev => {
        const existingKeys = new Set(prev.map(c => c.key));
        const newColumns: ColumnConfig[] = [];
        
        availableFields.forEach(field => {
          if (!existingKeys.has(field)) {
            newColumns.push({
              key: field,
              label: formatFieldLabel(field),
              enabled: false,
            });
          }
        });
        
        if (newColumns.length > 0) {
          console.log(`Found ${newColumns.length} new field(s):`, newColumns.map(c => c.key));
          return [...prev, ...newColumns];
        }
        return prev;
      });
    }
  }, [availableFields]);

  // Reset columns to default
  const handleResetColumns = () => {
    setColumnConfigs(getDefaultColumns());
    localStorage.removeItem('tenantsViewColumns');
    toast.success('Column settings reset to default');
  };

  // User Story 2: Create tenant
  const handleCreate = async () => {
    if (!newTenantName.trim()) {
      toast.error('Please enter a tenant name');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTenant = await createTenant(newTenantName);
      toast.success(`Tenant "${newTenant.TenantName}" created with ID: ${newTenant.TenantId}`);
      setIsCreateDialogOpen(false);
      setNewTenantName('');
      
      // Auto-refresh to get complete data from server
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User Story 3: Delete tenant
  const handleDelete = async () => {
    if (!tenantToDelete) return;

    try {
      await deleteTenant(tenantToDelete.TenantId, tenantToDelete._etag || '');
      setTenants((prev) => prev.filter((t) => t.TenantId !== tenantToDelete.TenantId));
      toast.success(`Tenant "${tenantToDelete.TenantName}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
      
      // Auto-refresh to get updated list from server
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tenant');
    }
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  // Handle clicking on TenantID to show details
  const handleTenantIdClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailOpen(true);
  };

  // Handle edit
  const handleEdit = (tenant: Tenant) => {
    setTenantToEdit(tenant);
    setIsEditOpen(true);
  };

  // Handle successful update
  const handleUpdateSuccess = (updatedTenant: Tenant) => {
    // Auto-refresh to get complete data from server
    refreshData();
  };

  // Handle successful import
  const handleImportSuccess = (importedTenants: Tenant[]) => {
    // Auto-refresh to get complete data from server
    refreshData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    if (path.includes('.')) {
      const parts = path.split('.');
      let value = obj;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return undefined;
      }
      return value;
    }
    return obj[path];
  };

  // Helper to check if a value is empty
  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && (value.trim() === '' || value === '—' || value === 'N/A')) return true;
    return false;
  };

  // Helper to check if a column has any non-empty values
  const hasNonEmptyValues = (columnKey: string): boolean => {
    if (tenants.length === 0) return false;
    
    return tenants.some(tenant => {
      const value = getNestedValue(tenant, columnKey);
      return !isEmptyValue(value);
    });
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (tenants.length === 0) {
      // If no data, don't mark anything as empty
      return columnConfigs.map(col => ({ ...col, isEmpty: false }));
    }
    
    return columnConfigs.map(col => {
      // Check if column has any non-empty values
      const hasData = col.locked || tenants.some(tenant => {
        const value = getNestedValue(tenant, col.key);
        return !isEmptyValue(value);
      });
      
      return {
        ...col,
        isEmpty: !hasData
      };
    });
  }, [columnConfigs, tenants]);

  // DataTable columns configuration - dynamically generated based on enabled columns
  const columns = useMemo(() => {
    // Use enrichedColumnConfigs which already has isEmpty flags
    const enabledColumns = enrichedColumnConfigs.filter(col => col.enabled);
    
    // Filter out columns that have no data (all values are empty)
    const columnsWithData = enabledColumns.filter(col => 
      col.locked || !col.isEmpty
    );
    
    return columnsWithData.map(colConfig => {
      // Special rendering for TenantId
      if (colConfig.key === 'TenantId') {
        return {
          key: 'TenantId',
          header: 'Tenant ID',
          render: (tenant: Tenant) => (
            <div className="max-w-[140px]">
              <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded truncate block">
                {tenant.TenantId}
              </code>
            </div>
          ),
        };
      }

      // Special rendering for TenantName
      if (colConfig.key === 'TenantName') {
        return {
          key: 'TenantName',
          header: 'Tenant Name',
          render: (tenant: Tenant) => (
            <div className="max-w-[200px]">
              <span className="text-sm truncate block" title={tenant.TenantName}>
                {tenant.TenantName}
              </span>
            </div>
          ),
        };
      }

      // Special rendering for CreateTime and UpdateTime
      if (colConfig.key === 'CreateTime' || colConfig.key === 'UpdateTime') {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (tenant: Tenant) => {
            const dateValue = getNestedValue(tenant, colConfig.key);
            return (
              <div className="text-sm">
                {formatDate(dateValue)}
              </div>
            );
          },
        };
      }

      // Special rendering for Status
      if (colConfig.key === 'Status') {
        return {
          key: colConfig.key,
          header: colConfig.label,
          render: (tenant: Tenant) => {
            const value = getNestedValue(tenant, colConfig.key);
            if (!value || value === '-') {
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            return (
              <Badge variant="default" className="whitespace-nowrap text-xs bg-[#1D6BCD] hover:bg-[#1858A8]">
                {String(value)}
              </Badge>
            );
          },
        };
      }

      // Generic rendering for other columns
      return {
        key: colConfig.key,
        header: colConfig.label,
        render: (tenant: Tenant) => {
          const value = getNestedValue(tenant, colConfig.key);
          
          if (value === null || value === undefined) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }

          // Handle dates
          if (colConfig.key.toLowerCase().includes('time') || colConfig.key.toLowerCase().includes('date')) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return <span className="whitespace-nowrap text-sm">{date.toLocaleDateString()}</span>;
              }
            } catch (e) {
              // Not a date, continue
            }
          }

          // Handle booleans
          if (typeof value === 'boolean') {
            return (
              <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                {value ? 'Yes' : 'No'}
              </Badge>
            );
          }

          // Handle objects and arrays
          if (typeof value === 'object') {
            return (
              <div className="max-w-[150px]">
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded truncate block" title={JSON.stringify(value)}>
                  {JSON.stringify(value)}
                </code>
              </div>
            );
          }

          // Handle primitives
          return (
            <div className="max-w-[200px]">
              <span className="text-sm truncate block" title={String(value)}>
                {String(value)}
              </span>
            </div>
          );
        },
      };
    });
  }, [enrichedColumnConfigs, tenants]);

  // Filter tenants based on active tenant selection
  const filteredTenants = useMemo(() => {
    if (activeTenantId === 'global') {
      return tenants;
    }
    return tenants.filter(tenant => tenant.TenantId === activeTenantId);
  }, [tenants, activeTenantId]);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      <Card>
        <CardHeader>
          {/* Mobile Layout: Stack vertically */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <CardTitle className="font-bold text-lg md:text-xl pt-[0px] pr-[0px] pb-[5px] pl-[0px]">Supplier Tenants</CardTitle>
              <CardDescription className="text-sm text-[16px]">
                View and manage supplier tenants on the BFS platform
              </CardDescription>
            </div>
            
            {/* Desktop View - All buttons visible */}
            <div className="hidden md:flex gap-2 flex-shrink-0">
              <TenantSelector
                tenants={tenants}
                activeTenantId={activeTenantId}
                onTenantChange={onTenantChange}
                isSuperUser={userRole === 'superuser'}
              />
              <ColumnSelector
                columns={enrichedColumnConfigs}
                onColumnsChange={setColumnConfigs}
                availableFields={availableFields}
                onReset={handleResetColumns}
              />
              <Button variant="outline" onClick={refreshData} disabled={isLoading}>
                <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {canCreate && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
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
                  <DropdownMenuItem onClick={refreshData} disabled={isLoading}>
                    <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </DropdownMenuItem>
                  {canCreate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tenant
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
                      availableFields={availableFields}
                      onReset={handleResetColumns}
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            /* Empty State - Show only Import button */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No Tenants Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {canCreate 
                  ? 'Get started by importing tenants from a JSON file. Upload your tenant data to begin managing suppliers on the BFS platform.'
                  : 'No tenants available. Contact a SuperUser to import tenant data.'}
              </p>
              {canCreate && (
                <Button onClick={() => setIsImportOpen(true)} size="lg" className="rounded-full">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Import Tenants from JSON</span>
                  <span className="sm:hidden">Import JSON</span>
                </Button>
              )}
            </div>
          ) : (
            /* Full Functionality - Show after tenants are imported */
            <>
              {/* Tenants Table */}
              <DataTable
                data={filteredTenants}
                columns={columns}
                searchPlaceholder="Search tenants..."
                searchKeys={['TenantId', 'TenantName']}
                emptyMessage="No tenants found. Click 'Add New Tenant' to create one."
                actions={(tenant) => (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTenantIdClick(tenant)}
                    >
                      <ViewIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(tenant)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <DeleteIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
                actionsCompact={(tenant) => (
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTenantIdClick(tenant)}
                      className="h-8 w-8 p-0"
                      title="View tenant"
                    >
                      <ViewIcon className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                        className="h-8 w-8 p-0"
                        title="Edit tenant"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(tenant)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete tenant"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Enter the tenant name. A unique Tenant ID will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input
                id="tenantName"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Enter tenant name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewTenantName('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tenant "{tenantToDelete?.TenantName}" (ID: {tenantToDelete?.TenantId}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTenantToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Tenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tenant Detail Dialog */}
      {selectedTenant && (
        <TenantDetail
          tenant={selectedTenant}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}

      {/* Edit Tenant Dialog */}
      {tenantToEdit && (
        <TenantEditForm
          tenant={tenantToEdit}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Import Tenants Dialog */}
      <TenantImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}