import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { User, Mail, Shield, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AzureAuthMeResponse {
  user_id: string;
  user_claims: Array<{
    typ: string;
    val: string;
  }>;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [azureData, setAzureData] = useState<AzureAuthMeResponse | null>(null);

  useEffect(() => {
    if (open && user?.isAzureAuth) {
      fetchAzureProfile();
    } else if (open && !user?.isAzureAuth) {
      // For non-Azure users, no need to fetch
      setLoading(false);
      setAzureData(null);
    }
  }, [open, user?.isAzureAuth]);

  const fetchAzureProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/.auth/me');
      
      if (response.ok) {
        const data = await response.json();
        // Azure returns an array with one element
        if (Array.isArray(data) && data.length > 0) {
          setAzureData(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Azure profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClaimValue = (claimType: string): string | null => {
    if (!azureData?.user_claims) return null;
    
    const claim = azureData.user_claims.find(c => 
      c.typ === claimType || c.typ.endsWith(`/${claimType}`)
    );
    return claim?.val || null;
  };

  // Get display name - prefer Azure name if available
  const displayName = user?.isAzureAuth && azureData
    ? (getClaimValue('name') || user.name || user.username)
    : (user?.name || user?.username || 'User');

  // Get email - prefer Azure email if available
  const displayEmail = user?.isAzureAuth && azureData
    ? (getClaimValue('emailaddress') || user.email)
    : user?.email;

  // Get role display
  const displayRole = user?.role || 'view';
  const azureRole = user?.isAzureAuth ? user.azureRole : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#1D6BCD]" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#1D6BCD]" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Name */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-[#1D6BCD] mt-0.5 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="break-words text-right text-sm">{displayName}</span>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-[#1D6BCD] mt-0.5 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="break-words text-right text-sm">
                  {azureRole ? `(${azureRole})` : displayRole}
                </span>
              </div>
            </div>

            {/* Email */}
            {displayEmail && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-[#1D6BCD] mt-0.5 shrink-0" />
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="break-all text-right text-sm">{displayEmail}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};