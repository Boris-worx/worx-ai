import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { updateTenant, Tenant } from '../lib/api';
import { toast } from 'sonner';

interface TenantEditFormProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedTenant: Tenant) => void;
}

export function TenantEditForm({ tenant, open, onOpenChange, onSuccess }: TenantEditFormProps) {
  const [tenantId, setTenantId] = useState(tenant?.TenantId || '');
  const [tenantName, setTenantName] = useState(tenant?.TenantName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when tenant prop changes
  useEffect(() => {
    if (tenant) {
      setTenantId(tenant.TenantId || '');
      setTenantName(tenant.TenantName || '');
    }
  }, [tenant]);

  const handleSubmit = async () => {
    // Validation
    if (!tenantId.trim()) {
      toast.error('Tenant ID cannot be empty');
      return;
    }

    if (!tenantName.trim()) {
      toast.error('Tenant Name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      // Note: In most Cosmos DB implementations, the ID cannot be changed
      // If the ID has changed, we would need to delete and recreate
      // For now, we only update the name
      const updatedTenant = await updateTenant(
        tenant.TenantId, // Use original ID for the API call
        tenantName,
        tenant._etag || ''
      );

      toast.success(`Tenant "${updatedTenant.TenantName}" updated successfully`);
      onSuccess(updatedTenant);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset to original values
    if (tenant) {
      setTenantId(tenant.TenantId || '');
      setTenantName(tenant.TenantName || '');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update tenant information. Note: Changing the ID will require creating a new tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Tenant ID */}
          <div className="grid gap-2">
            <Label htmlFor="tenantId">Tenant ID</Label>
            <Input
              id="tenantId"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="e.g., tenant-001"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Note: Tenant ID cannot be changed in most database systems
            </p>
          </div>

          {/* Tenant Name */}
          <div className="grid gap-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g., Acme Corporation"
            />
          </div>

          {/* Metadata */}
          {tenant._etag && (
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <div>ETag: <span className="font-mono">{tenant._etag}</span></div>
              {tenant.UpdateTime && (
                <div>Last Updated: {new Date(tenant.UpdateTime).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button className="!rounded-full"
            variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="!rounded-full"
            onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}