import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth, UserRole } from './AuthContext';
import { Shield, Eye, Edit, Lock, RotateCcw } from 'lucide-react';

interface RoleTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES: { role: UserRole; label: string; description: string; icon: any }[] = [
  {
    role: 'admin',
    label: 'Admin (Portal.Admin)',
    description: 'Full access: View, Create, Edit, Delete',
    icon: Shield,
  },
  {
    role: 'edit',
    label: 'Editor (Portal.Editor)',
    description: 'View, Edit, Delete (no Create)',
    icon: Edit,
  },
  {
    role: 'view',
    label: 'Reader (Portal.Reader)',
    description: 'View only access',
    icon: Eye,
  },
];

export const RoleTestDialog = ({ open, onOpenChange }: RoleTestDialogProps) => {
  const { user, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Check if user is in test mode
  const isTestMode = localStorage.getItem('bfs_test_role') !== null;

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    
    // For Azure users, we'll temporarily override the role in localStorage
    if (user?.isAzureAuth) {
      const updatedUser = {
        ...user,
        role: role,
        azureRole: role === 'admin' ? 'Portal.Admin' : role === 'edit' ? 'Portal.Editor' : 'Portal.Reader',
      };
      localStorage.setItem('bfs_user', JSON.stringify(updatedUser));
      
      // Set test mode flag
      localStorage.setItem('bfs_test_role', role);
      
      // Reload the page to apply the role change
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      // For local users, use the test credentials
      const credentials: Record<UserRole, { username: string; password: string }> = {
        admin: { username: 'admin', password: 'admin123' },
        edit: { username: 'editor', password: 'edit123' },
        view: { username: 'viewer', password: 'view123' },
      };
      
      const cred = credentials[role];
      login(cred.username, cred.password);
      onOpenChange(false);
    }
  };

  const handleResetToRealRole = () => {
    // Remove test mode flag
    localStorage.removeItem('bfs_test_role');
    
    // Reload to fetch real Azure role
    window.location.reload();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'edit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'view':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#1D6BCD]" />
            Change Role for Testing
          </DialogTitle>
          <DialogDescription>
            Switch between different roles to test how the interface looks for each permission level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Current Role */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs mb-1">
              <strong>Current Role:</strong>
            </p>
            <div className="flex items-center gap-2">
              <Badge className={getRoleBadgeColor(user?.role || 'view')}>
                {user?.role || 'view'}
              </Badge>
              {user?.isAzureAuth && user.azureRole && (
                <span className="text-xs text-muted-foreground">
                  ({user.azureRole})
                </span>
              )}
              {isTestMode && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-300">
                  Test Mode
                </Badge>
              )}
            </div>
          </div>

          {/* Reset to Real Role Button (only for Azure users in test mode) */}
          {user?.isAzureAuth && isTestMode && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1">
                    <strong>Testing Mode Active</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You're currently testing a different role. Click to return to your real Azure role.
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
          <div className="space-y-2">
            <p className="text-sm">Select a role to test:</p>
            
            {ROLES.map((roleOption) => {
              const Icon = roleOption.icon;
              const isCurrentRole = user?.role === roleOption.role && !isTestMode;
              const isSelected = selectedRole === roleOption.role;

              return (
                <button
                  key={roleOption.role}
                  onClick={() => handleRoleChange(roleOption.role)}
                  disabled={isCurrentRole}
                  className={`
                    w-full p-4 rounded-lg border-2 transition-all text-left
                    ${isCurrentRole 
                      ? 'border-[#1D6BCD] bg-blue-50 cursor-default' 
                      : 'border-gray-200 hover:border-[#1D6BCD] hover:bg-gray-50 cursor-pointer'
                    }
                    ${isSelected && !isCurrentRole ? 'border-[#1D6BCD] bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg 
                      ${isCurrentRole ? 'bg-[#1D6BCD] text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{roleOption.label}</p>
                        {isCurrentRole && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {roleOption.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Testing Only:</strong> This feature is for UI testing purposes. 
              Changing roles here temporarily overrides your actual permissions. 
              {user?.isAzureAuth && ' The page will reload to apply the role change. Use the "Reset" button to return to your real role.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};