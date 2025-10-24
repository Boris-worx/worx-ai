import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth, UserRole, AccessLevel, AccessSection } from './AuthContext';
import { RotateCcw, UserCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface RoleTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  { value: 'super', label: 'Super User (Portal.SuperUser)', description: 'Full admin access - can manage tenants and all data' },
  { value: 'viewsuper', label: 'View Only Super User (Portal.ViewOnlySuperUser)', description: 'Read-only access to everything' },
  { value: 'admin', label: 'Admin (Portal.Admin)', description: 'Read/Write per tenant' },
  { value: 'developer', label: 'Developer (Portal.Developer)', description: 'Read/Write per tenant' },
  { value: 'viewer', label: 'Viewer (Portal.Viewer)', description: 'Read-only per tenant' },
];

const ACCESS_OPTIONS = [
  { value: 'All', label: 'All sections' },
  { value: 'Tenants', label: 'Tenants' },
  { value: 'Transactions', label: 'Transactions' },
  { value: 'Data Plane', label: 'Data Plane' },
];

export const RoleTestDialog = ({ open, onOpenChange }: RoleTestDialogProps) => {
  const { user, updateUser } = useAuth();
  
  // Initialize selectedRole based on current user's role
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'view');
  
  // Initialize selectedAccess based on current user's access
  const getCurrentAccessValue = (): string => {
    if (!user?.access || user.access === 'All') return 'All';
    if (Array.isArray(user.access) && user.access.length === 1) {
      return user.access[0];
    }
    return 'All';
  };
  
  const [selectedAccess, setSelectedAccess] = useState<string>(getCurrentAccessValue());

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRole(user?.role || 'view');
      setSelectedAccess(getCurrentAccessValue());
    }
  }, [open, user]);

  // Check if user is in test mode
  const isTestMode = localStorage.getItem('bfs_test_role') !== null;

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const handleAccessChange = (value: string) => {
    setSelectedAccess(value);
  };

  const handleApplyChanges = () => {
    // Determine what to apply
    const roleToApply = selectedRole || user?.role || 'view';
    
    // Convert selected access to AccessLevel
    // NOTE: Section Access is currently disabled - always use 'All'
    // To enable, uncomment the Section Access UI below and use this line:
    // const access: AccessLevel = selectedAccess === 'All' ? 'All' : [selectedAccess as AccessSection];
    const access: AccessLevel = 'All';

    // For Azure users, we'll temporarily override the role and access in localStorage
    if (user?.isAzureAuth) {
      // Map role to Azure role
      const azureRoleMap: Record<UserRole, string> = {
        super: 'Portal.SuperUser',
        viewsuper: 'Portal.ViewOnlySuperUser',
        admin: 'Portal.Admin',
        developer: 'Portal.Developer',
        viewer: 'Portal.Viewer',
      };
      
      const updatedUser = {
        username: user.username,
        email: user.email,
        name: user.name,
        role: roleToApply,
        access: access,
        azureRole: azureRoleMap[roleToApply as UserRole] || 'Portal.Viewer',
        isAzureAuth: true,
      };
      
      console.log('Saving updated user:', updatedUser);
      
      // Set test mode flag if role changed
      if (selectedRole && selectedRole !== user.role) {
        localStorage.setItem('bfs_test_role', roleToApply);
      }
      
      // Update user state without reload
      updateUser(updatedUser);
      
      // Show success message
      toast.success(`Settings updated! Role: ${roleToApply}`);
      
      // Close dialog
      onOpenChange(false);
    } else {
      // For local users, update with new access
      const credentials: Record<UserRole, { username: string; password: string }> = {
        super: { username: 'superuser', password: 'super123' },
        viewsuper: { username: 'viewsuper', password: 'viewsuper123' },
        admin: { username: 'admin', password: 'admin123' },
        developer: { username: 'developer', password: 'dev123' },
        viewer: { username: 'viewer', password: 'view123' },
      };
      
      const cred = credentials[roleToApply as UserRole];
      
      // Update the user with custom access directly
      const updatedUser = {
        username: cred.username,
        role: roleToApply,
        access: access,
        isAzureAuth: false,
      };
      
      console.log('Saving local user:', updatedUser);
      
      // Update user state without reload
      updateUser(updatedUser);
      
      // Show success message
      toast.success(`Settings updated! Role: ${roleToApply}`);
      
      // Close dialog
      onOpenChange(false);
    }
  };

  const handleResetToRealRole = () => {
    // Remove test mode flag
    localStorage.removeItem('bfs_test_role');
    
    // Reload to fetch real Azure role
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#1D6BCD]" />
            Change Role & Access
          </DialogTitle>
          <DialogDescription>
            Configure role permissions for testing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Reset to Real Role Button (only for Azure users in test mode) */}
          {user?.isAzureAuth && isTestMode && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1">
                    <strong>Testing Mode Active</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click to return to your real Azure settings
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetToRealRole}
                  className="shrink-0"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-[#1D6BCD]" />
              <Label htmlFor="role-select" className="text-sm">
                Select Role:
              </Label>
            </div>
            
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {ROLE_OPTIONS.find(r => r.value === selectedRole)?.description || ''}
            </p>
          </div>

          {/* ========================================
              SECTION ACCESS - CURRENTLY DISABLED
              ========================================
              To enable Section Access selection:
              1. Uncomment the block below
              2. In handleApplyChanges(), use:
                 const access: AccessLevel = selectedAccess === 'All' ? 'All' : [selectedAccess as AccessSection];
              ======================================== */}
          
          {/* Access Level Selection - UNCOMMENT TO ENABLE */}
          {/* <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1D6BCD]" />
              <Label htmlFor="access-select" className="text-sm">
                Section Access:
              </Label>
            </div>
            
            <Select value={selectedAccess} onValueChange={handleAccessChange}>
              <SelectTrigger id="access-select" className="w-full">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {selectedAccess === 'All' 
                ? 'User will have access to all sections of the application'
                : `User will only have access to ${selectedAccess}`
              }
            </p>
          </div> */}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyChanges}
            className="bg-[#1D6BCD] hover:bg-[#1557a8]"
          >
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};