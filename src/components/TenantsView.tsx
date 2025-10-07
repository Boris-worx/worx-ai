import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DataTable } from './DataTable';
import { Plus, RefreshCw, Trash2, Pencil, Upload } from 'lucide-react';
import { Tenant, createTenant, deleteTenant } from '../lib/api';
import { toast } from 'sonner';
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
          <CardTitle>Tenant Management</CardTitle>
          <CardDescription>
            View and manage supplier tenants on the BFS platform
          </CardDescription>
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
              <Button onClick={() => setIsImportOpen(true)} size="lg">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import Tenants from JSON</span>
                <span className="sm:hidden">Import JSON</span>
              </Button>
            </div>
          ) : (
            /* Full Functionality - Show after tenants are imported */
            <>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button className="!rounded-full" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Tenant
                </Button>

                <Button variant="secondary" className="!hidden" onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </Button>

                <Button className="!rounded-full" variant="outline" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

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
                      className="!rounded-full"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      className="!rounded-full"
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
              className="!rounded-full"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewTenantName('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="!rounded-full"
              onClick={handleCreate} disabled={isSubmitting}>
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

      <div className="flex justify-center items-center py-8">
        <img
          src="/src/img/logo.png"
          alt="Logo"
          width={200}
          height={74}
          style={{ objectFit: 'contain' }}
        />
      </div>

    </div>

  );
}