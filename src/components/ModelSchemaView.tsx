import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ViewIcon } from './icons/ViewIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { Skeleton } from './ui/skeleton';
import { Eye, CheckCircle2, AlertCircle, Plus, Trash2, Pencil, FileCode, MoreVertical, Filter, Lock } from 'lucide-react';
import { ModelSchema, getAllModelSchemas, createModelSchema, updateModelSchema, deleteModelSchema } from '../lib/api';
import { toast } from 'sonner@2.0.3';
import { UserRole } from './AuthContext';
import { DataTable } from './DataTable';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { TenantSelector } from './TenantSelector';
import { Tenant } from '../lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ModelSchemaViewProps {
  userRole: UserRole;
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function ModelSchemaView({ userRole, tenants, activeTenantId, onTenantChange }: ModelSchemaViewProps) {
  const [globalSchemas, setGlobalSchemas] = useState<ModelSchema[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selectedSchemaForDetail, setSelectedSchemaForDetail] = useState<ModelSchema | null>(null);
  const [isSchemaDetailOpen, setIsSchemaDetailOpen] = useState(false);

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    model: '',
    version: 1,
    state: 'active',
    semver: '1.0.0',
    jsonSchemaText: '{\n  "$id": "",\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "",\n  "type": "object",\n  "required": [],\n  "properties": {}\n}',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog state
  const [schemaToEdit, setSchemaToEdit] = useState<ModelSchema | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    model: '',
    version: 1,
    state: 'active',
    semver: '1.0.0',
    jsonSchemaText: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog state
  const [schemaToDelete, setSchemaToDelete] = useState<ModelSchema | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission checks
  const canCreate = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canEdit = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';
  const canDelete = userRole === 'superuser' || userRole === 'admin' || userRole === 'developer';

  // Protected types that cannot be edited or deleted
  const PROTECTED_TYPES = ['Customer', 'Location'];
  const isProtectedType = (modelName: string): boolean => {
    return PROTECTED_TYPES.includes(modelName);
  };

  // Helper to format field labels
  const formatFieldLabel = (field: string): string => {
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  // Default columns
  const getDefaultColumns = (): ColumnConfig[] => [
    { key: 'model', label: 'Model', enabled: true, locked: true },
    { key: 'version', label: 'Version', enabled: true },
    { key: 'semver', label: 'Semver', enabled: true },
    { key: 'state', label: 'State', enabled: true },
    { key: 'properties', label: 'Properties', enabled: true },
    { key: 'requiredFields', label: 'Required Fields', enabled: true },
    { key: 'CreateTime', label: 'Created', enabled: false },
    { key: 'UpdateTime', label: 'Updated', enabled: false },
  ];

  // Column configuration state with localStorage persistence
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    const STORAGE_VERSION = '1';
    const saved = localStorage.getItem('modelSchemaViewColumns');
    const savedVersion = localStorage.getItem('modelSchemaViewColumnsVersion');
    
    if (saved && savedVersion === STORAGE_VERSION) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    localStorage.removeItem('modelSchemaViewColumns');
    localStorage.setItem('modelSchemaViewColumnsVersion', STORAGE_VERSION);
    return getDefaultColumns();
  });

  // Save column configs to localStorage
  useEffect(() => {
    const STORAGE_VERSION = '1';
    localStorage.setItem('modelSchemaViewColumns', JSON.stringify(columnConfigs));
    localStorage.setItem('modelSchemaViewColumnsVersion', STORAGE_VERSION);
  }, [columnConfigs]);

  // Extract available fields from schemas
  const availableFields = useMemo(() => {
    if (globalSchemas.length === 0) return [];
    
    const fieldsSet = new Set<string>();
    globalSchemas.forEach(schema => {
      Object.keys(schema).forEach(key => {
        if (!key.startsWith('_')) {
          fieldsSet.add(key);
        }
      });
    });
    
    // Add computed fields
    fieldsSet.add('properties');
    fieldsSet.add('requiredFields');
    
    return Array.from(fieldsSet).sort();
  }, [globalSchemas]);

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

  // Helper functions for schema data
  const getRequiredFields = (jsonSchema: any): string[] => {
    return jsonSchema?.required || [];
  };

  const countProperties = (jsonSchema: any): number => {
    return Object.keys(jsonSchema?.properties || {}).length;
  };

  // Update column configs with isEmpty flag
  const enrichedColumnConfigs = useMemo(() => {
    if (globalSchemas.length === 0) {
      return columnConfigs.map(col => ({ ...col, isEmpty: false }));
    }
    
    return columnConfigs.map(col => {
      const hasData = col.locked || globalSchemas.some(schema => {
        let value: any;
        
        if (col.key === 'properties') {
          value = countProperties(schema.jsonSchema);
        } else if (col.key === 'requiredFields') {
          value = getRequiredFields(schema.jsonSchema).length;
        } else {
          value = schema[col.key as keyof ModelSchema];
        }
        
        return !isEmptyValue(value);
      });
      
      return {
        ...col,
        isEmpty: !hasData
      };
    });
  }, [columnConfigs, globalSchemas]);

  // Get state badge
  const getStateBadge = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
      case 'deprecated':
        return <Badge variant="destructive">Deprecated</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="bg-gray-300 text-gray-600">Deleted</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
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
    
    // Handle objects/arrays
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Get enabled columns and convert to DataTable format
  const columns = useMemo(() => {
    return enrichedColumnConfigs
      .filter(c => c.enabled)
      .filter(c => c.locked || !c.isEmpty)
      .map(colConfig => ({
        key: colConfig.key,
        header: colConfig.label,
        render: (row: ModelSchema) => {
          // Handle special computed fields
          if (colConfig.key === 'properties') {
            return <span>{countProperties(row.jsonSchema)}</span>;
          }
          if (colConfig.key === 'requiredFields') {
            return <span>{getRequiredFields(row.jsonSchema).length}</span>;
          }
          if (colConfig.key === 'state') {
            return getStateBadge(row.state);
          }
          // Add lock icon for protected model types
          if (colConfig.key === 'model') {
            const modelName = row.model;
            const isProtected = isProtectedType(modelName);
            return (
              <div className="flex items-center gap-2">
                <span>{modelName}</span>
                {isProtected && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Protected system type - cannot be edited or deleted</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          }
          
          const value = row[colConfig.key as keyof ModelSchema];
          return formatCellValue(value, colConfig.key);
        },
      }));
  }, [enrichedColumnConfigs, globalSchemas]);

  // Load schemas on mount
  useEffect(() => {
    loadGlobalSchemas();
  }, []);

  // Load global ModelSchemas
  const loadGlobalSchemas = async () => {
    setIsLoadingSchemas(true);
    setSchemaError(null);
    try {
      console.log('🔄 Loading global schemas...');
      const schemas = await getAllModelSchemas();
      console.log(`📦 Loaded ${schemas.length} schema(s) from API`);
      
      // Filter out deleted schemas (soft delete)
      const activeSchemas = schemas.filter(s => s && s.state !== 'deleted');
      console.log(`✅ ${activeSchemas.length} active schema(s) after filtering`);
      
      // Sort by UpdateTime (newest first)
      const sortedSchemas = activeSchemas.sort((a, b) => {
        try {
          const dateA = new Date(a.UpdateTime).getTime();
          const dateB = new Date(b.UpdateTime).getTime();
          return dateB - dateA; // Descending order (newest first)
        } catch (sortError) {
          console.warn('⚠️ Error sorting schemas:', sortError);
          return 0;
        }
      });
      
      setGlobalSchemas(sortedSchemas);
      console.log('✅ Schemas loaded and set successfully');
      
      if (schemas.length === 0) {
        setSchemaError('No schemas found. ModelSchema API may not be enabled yet.');
      }
    } catch (error: any) {
      console.error('❌ Error loading schemas:', error);
      const errorMessage = error.message || String(error);
      setSchemaError(errorMessage || 'Failed to load schemas');
      setGlobalSchemas([]);
      if (errorMessage !== 'CORS_BLOCKED') {
        toast.error(`Failed to load schemas: ${errorMessage}`);
      }
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  // Handle create schema
  const handleCreateSchema = async () => {
    setIsCreating(true);
    try {
      // Parse JSON schema
      let jsonSchema;
      try {
        jsonSchema = JSON.parse(createFormData.jsonSchemaText);
      } catch (e) {
        toast.error('Invalid JSON Schema format');
        setIsCreating(false);
        return;
      }

      const schemaData = {
        model: createFormData.model,
        version: createFormData.version,
        state: createFormData.state,
        semver: createFormData.semver,
        jsonSchema: jsonSchema,
      };

      await createModelSchema(schemaData);
      toast.success(`Model schema "${createFormData.model}" created successfully`);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        model: '',
        version: 1,
        state: 'active',
        semver: '1.0.0',
        jsonSchemaText: '{\n  "$id": "",\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "",\n  "type": "object",\n  "required": [],\n  "properties": {}\n}',
      });
      await loadGlobalSchemas();
    } catch (error: any) {
      toast.error(`Failed to create schema: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit schema
  const handleEditSchema = async () => {
    if (!schemaToEdit) return;

    setIsUpdating(true);
    try {
      // Parse JSON schema
      let jsonSchema;
      try {
        jsonSchema = JSON.parse(editFormData.jsonSchemaText);
      } catch (e) {
        toast.error('Invalid JSON Schema format');
        setIsUpdating(false);
        return;
      }

      const schemaData = {
        model: editFormData.model,
        version: editFormData.version,
        state: editFormData.state,
        semver: editFormData.semver,
        jsonSchema: jsonSchema,
      };

      await updateModelSchema(schemaToEdit.id, schemaData, schemaToEdit._etag || '');
      toast.success(`Model schema "${editFormData.model}" updated successfully`);
      setIsEditDialogOpen(false);
      setSchemaToEdit(null);
      await loadGlobalSchemas();
    } catch (error: any) {
      toast.error(`Failed to update schema: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete schema
  const handleDeleteSchema = async () => {
    if (!schemaToDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Starting delete for schema:', schemaToDelete.model, 'ID:', schemaToDelete.id);
      await deleteModelSchema(schemaToDelete.id, schemaToDelete._etag || '');
      console.log('✅ Delete completed, showing success toast');
      toast.success(`Model schema "${schemaToDelete.model}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setSchemaToDelete(null);
      console.log('🔄 Reloading schemas...');
      await loadGlobalSchemas();
      console.log('✅ Schemas reloaded successfully');
    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      const errorMessage = error.message || String(error);
      toast.error(`Failed to delete schema: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (schema: ModelSchema) => {
    setSchemaToEdit(schema);
    setEditFormData({
      model: schema.model,
      version: schema.version,
      state: schema.state,
      semver: schema.semver,
      jsonSchemaText: JSON.stringify(schema.jsonSchema, null, 2),
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (schema: ModelSchema) => {
    setSchemaToDelete(schema);
    setIsDeleteDialogOpen(true);
  };

  // Handle View click
  const handleViewClick = (schema: ModelSchema) => {
    setSelectedSchemaForDetail(schema);
    setIsSchemaDetailOpen(true);
  };

  // Handle Edit click
  const handleEditClick = (schema: ModelSchema) => {
    openEditDialog(schema);
  };

  // Handle Delete click
  const handleDeleteClick = (schema: ModelSchema) => {
    openDeleteDialog(schema);
  };

  return (
    <Card className="w-full max-w-[1440px] mx-auto">
      <CardHeader>
        {/* Mobile Layout: Stack vertically */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-[20px] font-bold pt-[0px] pr-[0px] pb-[5px] pl-[0px]">
              Transactions
            </CardTitle>
            <CardDescription>
              Manage transaction specifications from the BFS platform
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
                Add Schema
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
                      Add Schema
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
        {isLoadingSchemas ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : schemaError ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No Schemas Found</h3>
            <p className="text-muted-foreground mb-4">
              {schemaError}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Schema
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={globalSchemas}
            columns={columns}
            actions={(row) => {
              const isProtected = isProtectedType(row.model);
              return (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewClick(row)}
                  >
                    <ViewIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {canEdit && !isProtected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(row)}
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {canEdit && isProtected && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="cursor-not-allowed"
                          >
                            <EditIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Protected system type - cannot be edited</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {canDelete && !isProtected && (
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
                  {canDelete && isProtected && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="cursor-not-allowed"
                          >
                            <DeleteIcon className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Protected system type - cannot be deleted</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            }}
            actionsCompact={(row) => {
              const isProtected = isProtectedType(row.model);
              return (
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewClick(row)}
                    className="h-8 w-8 p-0"
                    title="View schema"
                  >
                    <ViewIcon className="h-4 w-4" />
                  </Button>
                  {canEdit && !isProtected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(row)}
                      className="h-8 w-8 p-0"
                      title="Edit schema"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && isProtected && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 cursor-not-allowed"
                            title="Protected system type"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Protected system type - cannot be edited</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {canDelete && !isProtected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(row)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete schema"
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && isProtected && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 cursor-not-allowed"
                            title="Protected system type"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Protected system type - cannot be deleted</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            }}
          />
        )}
      </CardContent>

      {/* Create Schema Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Model Schema</DialogTitle>
            <DialogDescription>
              Add a new transaction model schema to the global registry
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-model">Model Name *</Label>
                <Input
                  id="create-model"
                  placeholder="e.g., Customer, Location, Invoice"
                  value={createFormData.model}
                  onChange={(e) => setCreateFormData({ ...createFormData, model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-version">Version *</Label>
                <Input
                  id="create-version"
                  type="number"
                  min="1"
                  value={createFormData.version}
                  onChange={(e) => setCreateFormData({ ...createFormData, version: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-semver">Semantic Version *</Label>
                <Input
                  id="create-semver"
                  placeholder="e.g., 1.0.0"
                  value={createFormData.semver}
                  onChange={(e) => setCreateFormData({ ...createFormData, semver: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-state">State *</Label>
                <Select
                  value={createFormData.state}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, state: value })}
                >
                  <SelectTrigger id="create-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-jsonschema">JSON Schema *</Label>
              <Textarea
                id="create-jsonschema"
                placeholder="Enter JSON Schema definition"
                className="font-mono text-xs h-[300px]"
                value={createFormData.jsonSchemaText}
                onChange={(e) => setCreateFormData({ ...createFormData, jsonSchemaText: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchema}
              disabled={isCreating || !createFormData.model || !createFormData.semver}
            >
              {isCreating ? 'Creating...' : 'Create Schema'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schema Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Model Schema</DialogTitle>
            <DialogDescription>
              Update the model schema details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model Name * (read-only)</Label>
                <Input
                  id="edit-model"
                  value={editFormData.model}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Model name cannot be changed after creation</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-version">Version * (read-only)</Label>
                <Input
                  id="edit-version"
                  type="number"
                  value={editFormData.version}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Version cannot be changed after creation</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-semver">Semantic Version *</Label>
                <Input
                  id="edit-semver"
                  value={editFormData.semver}
                  onChange={(e) => setEditFormData({ ...editFormData, semver: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State *</Label>
                <Select
                  value={editFormData.state}
                  onValueChange={(value) => setEditFormData({ ...editFormData, state: value })}
                >
                  <SelectTrigger id="edit-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jsonschema">JSON Schema *</Label>
              <Textarea
                id="edit-jsonschema"
                className="font-mono text-xs h-[300px]"
                value={editFormData.jsonSchemaText}
                onChange={(e) => setEditFormData({ ...editFormData, jsonSchemaText: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSchema}
              disabled={isUpdating || !editFormData.model || !editFormData.semver}
            >
              {isUpdating ? 'Updating...' : 'Update Schema'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the model schema <strong>{schemaToDelete?.model}</strong> (v{schemaToDelete?.version})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchema}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schema Detail Dialog */}
      {selectedSchemaForDetail && (
        <Dialog open={isSchemaDetailOpen} onOpenChange={setIsSchemaDetailOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[1200px]">
            {/* Header with metadata in horizontal layout */}
            <div className="space-y-4 pb-4 border-b">
              <div>
                <DialogTitle className="text-2xl mb-1">
                  {selectedSchemaForDetail.model} - v{selectedSchemaForDetail.version} ({selectedSchemaForDetail.semver})
                </DialogTitle>
                <DialogDescription className="text-xs">
                  JSON Schema (Draft 2020-12)
                </DialogDescription>
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ID</label>
                  <div className="font-mono">{selectedSchemaForDetail.id}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <div>{getStateBadge(selectedSchemaForDetail.state)}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Created</label>
                  <div>
                    {new Date(selectedSchemaForDetail.CreateTime).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Updated</label>
                  <div>
                    {new Date(selectedSchemaForDetail.UpdateTime).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Two equal columns */}
            <div className="grid grid-cols-2 gap-6 h-[calc(90vh-280px)]">
              {/* Left Column - JSON Schema (50%) */}
              <div className="overflow-y-auto pr-2">
                <h4 className="mb-3">JSON Schema:</h4>
                <ScrollArea className="h-[calc(90vh-340px)] border rounded-md bg-muted p-3">
                  <pre className="text-xs font-mono leading-relaxed">
                    {JSON.stringify(selectedSchemaForDetail.jsonSchema, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              {/* Right Column - Properties Table (50%) */}
              <div className="overflow-y-auto pl-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="m-0">Properties:</h4>
                  <span className="text-xs text-muted-foreground">
                    {countProperties(selectedSchemaForDetail.jsonSchema)} fields
                  </span>
                </div>

                {/* Properties Table - Compact */}
                <div className="border rounded-lg overflow-hidden h-[calc(90vh-340px)]">
                  <ScrollArea className="h-full">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Field</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSchemaForDetail.jsonSchema?.properties || {}).map(([key, value]: [string, any], index) => {
                          const isRequired = getRequiredFields(selectedSchemaForDetail.jsonSchema).includes(key);
                          return (
                            <tr key={key} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-2 font-medium">{key}</td>
                              <td className="p-2 text-muted-foreground">{value.type || 'any'}</td>
                              <td className="p-2">
                                <Badge 
                                  variant={isRequired ? 'default' : 'secondary'}
                                  className="text-xs py-0 px-2"
                                >
                                  {isRequired ? 'Yes' : 'No'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
