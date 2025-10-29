import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { DataTable } from './DataTable';
import { RefreshIcon } from './icons/RefreshIcon';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Plus, RefreshCw, Trash2, Pencil, Eye, Database, MoreVertical, Filter } from 'lucide-react';
import { DataSource, createDataSource, deleteDataSource, updateDataSource } from '../lib/api';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

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

export function DataSourcesView({ dataSources, setDataSources, isLoading, refreshData, userRole, tenants, activeTenantId, onTenantChange }: DataSourcesViewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<DataSource | null>(null);
  const [newDataSourceName, setNewDataSourceName] = useState('');
  const [newDataSourceType, setNewDataSourceType] = useState('');
  const [newDataSourceConnection, setNewDataSourceConnection] = useState('');
  const [newDataSourceDescription, setNewDataSourceDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail view state
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Edit state
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDataSourceName, setEditDataSourceName] = useState('');
  const [editDataSourceType, setEditDataSourceType] = useState('');
  const [editDataSourceConnection, setEditDataSourceConnection] = useState('');
  const [editDataSourceDescription, setEditDataSourceDescription] = useState('');

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    // Convert camelCase to Title Case
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns - commonly used fields
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'DatasourceId', label: 'Data Source ID', enabled: true, locked: true },
    { key: 'DatasourceName', label: 'Name', enabled: true },
    { key: 'Type', label: 'Type', enabled: false },
    { key: 'Status', label: 'Status', enabled: false },
    { key: 'CreateTime', label: 'Created', enabled: true },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
    { key: 'Description', label: 'Description', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '3'; // Increment when changing default columns
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
    const STORAGE_VERSION = '3';
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
            return id || '—';
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
      toast.error('Data Source Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createDataSource(
        newDataSourceName.trim(),
        newDataSourceType.trim() || undefined,
        newDataSourceConnection.trim() || undefined,
        newDataSourceDescription.trim() || undefined,
      );
      
      // Add to list (prepend - newest first)
      setDataSources([created, ...dataSources]);
      
      // Reset form
      setNewDataSourceName('');
      setNewDataSourceType('');
      setNewDataSourceConnection('');
      setNewDataSourceDescription('');
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
    setEditDataSourceType(dataSource.Type || '');
    setEditDataSourceConnection(dataSource.ConnectionString || '');
    setEditDataSourceDescription(dataSource.Description || '');
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
        editDataSourceType.trim() || undefined,
        editDataSourceConnection.trim() || undefined,
        editDataSourceDescription.trim() || undefined,
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
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    
    // Format status
    if (key === 'Status') {
      const status = String(value).toLowerCase();
      if (status === 'active') {
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
      } else if (status === 'inactive') {
        return <Badge variant="secondary">Inactive</Badge>;
      }
      return <Badge variant="outline">{value}</Badge>;
    }
    
    // Handle objects/arrays
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
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
              Data Source Onboarding
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
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                <DropdownMenuItem onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </DropdownMenuItem>
                {canCreate && (
                  <>
                    <DropdownMenuSeparator />
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
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading data sources...</p>
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
            )}
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
              <Label htmlFor="dataSourceName">Data Source Name *</Label>
              <Input
                id="dataSourceName"
                placeholder="Enter data source name"
                value={newDataSourceName}
                onChange={(e) => setNewDataSourceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSourceType">Type</Label>
              <Input
                id="dataSourceType"
                placeholder="e.g., SQL, NoSQL, REST API"
                value={newDataSourceType}
                onChange={(e) => setNewDataSourceType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSourceConnection">Connection String</Label>
              <Input
                id="dataSourceConnection"
                placeholder="Enter connection string"
                value={newDataSourceConnection}
                onChange={(e) => setNewDataSourceConnection(e.target.value)}
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSourceDescription">Description</Label>
              <Textarea
                id="dataSourceDescription"
                placeholder="Enter description"
                value={newDataSourceDescription}
                onChange={(e) => setNewDataSourceDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewDataSourceName('');
                setNewDataSourceType('');
                setNewDataSourceConnection('');
                setNewDataSourceDescription('');
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataSourceType">Type</Label>
              <Input
                id="editDataSourceType"
                placeholder="e.g., SQL, NoSQL, REST API"
                value={editDataSourceType}
                onChange={(e) => setEditDataSourceType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataSourceConnection">Connection String</Label>
              <Input
                id="editDataSourceConnection"
                placeholder="Enter connection string"
                value={editDataSourceConnection}
                onChange={(e) => setEditDataSourceConnection(e.target.value)}
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataSourceDescription">Description</Label>
              <Textarea
                id="editDataSourceDescription"
                placeholder="Enter description"
                value={editDataSourceDescription}
                onChange={(e) => setEditDataSourceDescription(e.target.value)}
                rows={3}
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
    </Card>
  );
}
