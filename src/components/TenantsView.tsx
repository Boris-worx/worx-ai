import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DataTable } from './DataTable';
import { Plus, RefreshCw, Trash2, Pencil, Upload, Eye } from 'lucide-react';
import { Tenant, createTenant, deleteTenant } from '../lib/api';
import { toast } from 'sonner@2.0.3';
import { TenantDetail } from './TenantDetail';
import { TenantEditForm } from './TenantEditForm';
import { TenantImportDialog } from './TenantImportDialog';

interface TenantsViewProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  isLoading: boolean;
  refreshData: () => void;
}

export function TenantsView({ tenants, setTenants, isLoading, refreshData }: TenantsViewProps) {
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

  const columns = [
    {
      key: 'TenantId',
      header: 'Tenant ID',
      render: (tenant: Tenant) => (
        <button
          onClick={() => handleTenantIdClick(tenant)}
          className="font-mono text-primary hover:underline cursor-pointer"
        >
          {tenant.TenantId}
        </button>
      ),
    },
    {
      key: 'TenantName',
      header: 'Tenant Name',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <CardTitle className="font-bold pt-[0px] pr-[0px] pb-[5px] pl-[0px]">Supplier Tenants</CardTitle>
              <CardDescription>
                View and manage supplier tenants on the BFS platform
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={refreshData} disabled={isLoading} className="rounded-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Tenant
              </Button>
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
                Get started by importing tenants from a JSON file. Upload your tenant data to begin managing suppliers on the BFS platform.
              </p>
              <Button onClick={() => setIsImportOpen(true)} size="lg" className="rounded-full">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import Tenants from JSON</span>
                <span className="sm:hidden">Import JSON</span>
              </Button>
            </div>
          ) : (
            /* Full Functionality - Show after tenants are imported */
            <>
              {/* Tenants Table */}
              <DataTable
                data={tenants}
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
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(tenant)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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