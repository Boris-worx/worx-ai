import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle2, Copy, TestTube } from 'lucide-react';
import { extractUserInfo } from '../lib/azure-auth';
import { toast } from 'sonner@2.0.3';

interface AzureRoleTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample /.auth/me response with Portal.Developer role
const SAMPLE_AUTH_RESPONSE = {
  "access_token": "eyJ0eXAiOiJKV1QiLCJub25jZSI6Im1od19EZUMwVUhrRXRMT096OHdUc3RpMUw1OXp1Rk9MdDVwcDdqMGxremMiLCJhbGciOiJSUzI1NiIsIng1dCI6InlFVXdtWFdMMTA3Q2MtN1FaMldTYmVPYjNzUSIsImtpZCI6InlFVXdtWFdMMTA3Q2MtN1FaMldTYmVPYjNzUSJ9...",
  "expires_on": "2025-10-28T00:45:13.7985667Z",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InlFVXdtWFdMMTA3Q2MtN1FaMldTYmVPYjNzUSJ9...",
  "provider_name": "aad",
  "user_claims": [
    {"typ": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "val": "Boris.Belov@myparadigm.com"},
    {"typ": "name", "val": "Boris Belov (contractor)"},
    {"typ": "roles", "val": "Portal.Developer"},
    {"typ": "preferred_username", "val": "Boris.Belov@myparadigm.com"}
  ],
  "user_id": "Boris.Belov@myparadigm.com"
};

export function AzureRoleTestDialog({ open, onOpenChange }: AzureRoleTestDialogProps) {
  const [testResult, setTestResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTest = () => {
    setIsProcessing(true);
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      const result = extractUserInfo(SAMPLE_AUTH_RESPONSE);
      setTestResult(result);
      setIsProcessing(false);
      toast.success('Azure AD response processed successfully!');
    }, 500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_AUTH_RESPONSE, null, 2));
    toast.success('Sample JSON copied to clipboard!');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-red-500';
      case 'viewonlysuperuser':
        return 'bg-orange-500';
      case 'admin':
        return 'bg-blue-500';
      case 'developer':
        return 'bg-green-500';
      case 'viewer':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'SuperUser';
      case 'viewonlysuperuser':
        return 'View-Only SuperUser';
      case 'admin':
        return 'Admin';
      case 'developer':
        return 'Developer';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-[#1D6BCD]" />
            Azure AD Role Processing Test
          </DialogTitle>
          <DialogDescription>
            Test how the application processes Azure AD /.auth/me responses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sample Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Sample /.auth/me Response</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
              </CardTitle>
              <CardDescription>
                Real response from Azure AD with Portal.Developer role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
                <pre>{JSON.stringify(SAMPLE_AUTH_RESPONSE, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Test Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleTest}
              disabled={isProcessing}
              className="bg-[#1D6BCD] hover:bg-[#1557a8]"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Process Response'}
            </Button>
          </div>

          {/* Results Section */}
          {testResult && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Processing Results
                </CardTitle>
                <CardDescription>
                  Extracted user information from Azure AD response
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{testResult.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm">{testResult.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">User ID:</span>
                    <span className="text-sm font-mono text-xs">{testResult.userId}</span>
                  </div>
                </div>

                {/* Role Mapping */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium">Role Mapping:</h4>
                  
                  <div className="bg-white p-3 rounded-md border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Azure AD Role:</span>
                      <Badge variant="outline" className="text-xs">
                        {testResult.azureRole}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-2xl">
                      →
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Application Role:</span>
                      <Badge className={`${getRoleColor(testResult.role)} text-white`}>
                        {getRoleLabel(testResult.role)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Access Level */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium">Access Permissions:</h4>
                  
                  <div className="bg-white p-3 rounded-md border">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <strong>Access Level:</strong>{' '}
                            {Array.isArray(testResult.access) 
                              ? testResult.access.join(', ')
                              : testResult.access}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1 ml-6">
                        <p>✓ Can access: Transaction Onboarding tab</p>
                        <p>✓ Can access: Data Source Onboarding tab</p>
                        <p>✓ Can access: Data Plane tab</p>
                        <p>✗ Cannot access: Tenants tab (SuperUser only)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Portal.Developer Permissions:
                  </h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>✓ Create/Edit/Delete transactions</p>
                    <p>✓ View/Edit data sources</p>
                    <p>✓ Access Data Plane features</p>
                    <p>✗ No tenant management access</p>
                  </div>
                </div>

                {/* Raw Result */}
                <details className="pt-2">
                  <summary className="text-sm font-medium cursor-pointer hover:text-[#1D6BCD]">
                    View Raw Result Object
                  </summary>
                  <div className="mt-2 bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Testing Other Roles */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Other Roles</CardTitle>
                <CardDescription>
                  To test other roles, modify the "roles" claim value in the sample JSON above
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <span className="font-medium">Portal.SuperUser</span>
                      <p className="text-muted-foreground">Full access to all tabs</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="font-medium">Portal.ViewOnlySuperUser</span>
                      <p className="text-muted-foreground">Read-only access to all</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="font-medium">Portal.Admin</span>
                      <p className="text-muted-foreground">Read/write transactions only</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="font-medium">Portal.Developer</span>
                      <p className="text-muted-foreground">Read/write transactions only</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="font-medium">Portal.Viewer</span>
                      <p className="text-muted-foreground">Read-only transactions only</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
