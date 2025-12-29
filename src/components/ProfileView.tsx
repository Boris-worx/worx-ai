import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { User, Mail, Building2, Shield } from 'lucide-react';

export function ProfileView() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                value={user?.username || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || 'user@nexusflow.ai'}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <Input
                id="role"
                value={user?.role || 'viewer'}
                disabled
                className="bg-muted capitalize"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Tenant
              </Label>
              <Input
                id="tenant"
                value={user?.tenantId || 'Global'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <Button variant="outline" disabled>
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">January 2025</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Last Login</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
