import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Upload, X, FileJson, AlertCircle } from 'lucide-react';
import { Tenant, createTenant, importTenantsToDemo } from '../lib/api';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';

interface TenantImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tenants: Tenant[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Helper function to extract tenants from Postman Collection
const extractTenantsFromPostmanCollection = (collection: any): any[] => {
  const tenants: any[] = [];
  const seenIds = new Set<string>();

  // Recursively process items in Postman Collection
  const processItems = (items: any[]) => {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      // Check if item has nested items (folder)
      if (item.item && Array.isArray(item.item)) {
        processItems(item.item);
      }

      // Check if item has request with body
      if (item.request && item.request.body) {
        const body = item.request.body;
        
        // Parse raw JSON body
        if (body.mode === 'raw' && body.raw) {
          try {
            const parsed = JSON.parse(body.raw);
            
            // Check if it's a tenant object
            if (parsed.TenantName) {
              const tenantId = parsed.TenantId || `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              // Avoid duplicates
              if (!seenIds.has(tenantId)) {
                seenIds.add(tenantId);
                tenants.push({
                  TenantId: tenantId,
                  TenantName: parsed.TenantName
                });
              }
            }
          } catch (e) {
            // Skip invalid JSON in request body
          }
        }
      }
    }
  };

  // Start processing from root items
  if (collection.item && Array.isArray(collection.item)) {
    processItems(collection.item);
  }

  return tenants;
};

// Helper function to find tenant array in nested object
const findTenantsInObject = (obj: any): any[] | null => {
  if (Array.isArray(obj)) {
    // Check if this is a tenant array
    if (obj.length > 0 && obj[0] && typeof obj[0] === 'object' && 
        ('TenantName' in obj[0] || 'TenantId' in obj[0])) {
      return obj;
    }
    return null;
  }
  
  // Search for tenant arrays in object properties
  for (const key in obj) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      const firstItem = obj[key][0];
      if (firstItem && typeof firstItem === 'object' && 
          ('TenantName' in firstItem || 'TenantId' in firstItem)) {
        return obj[key];
      }
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = findTenantsInObject(obj[key]);
      if (found) return found;
    }
  }
  return null;
};

export function TenantImportDialog({ open, onOpenChange, onSuccess }: TenantImportDialogProps) {
  const [tenantsJSON, setTenantsJSON] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        console.log('📄 Raw JSON:', jsonText.substring(0, 200)); // Debug log
        
        const json = JSON.parse(jsonText);
        console.log('📦 Parsed JSON structure:', json); // Debug log
        
        let tenantsArray: any[] = [];

        // Support multiple formats:
        // 1. Postman Collection: { info: {...}, item: [...] }
        // 2. Direct array: [{ TenantName: "..." }, ...]
        // 3. API response: { status: {...}, data: { tenants: [...] } }
        // 4. Simple object: { tenants: [...] }
        // 5. API response: { data: [...] }
        // 6. Single tenant: { TenantName: "..." }
        // 7. Any nested structure containing tenant array
        
        // Check for Postman Collection first
        if (json.info && json.item && Array.isArray(json.item)) {
          console.log('✅ Format detected: Postman Collection');
          tenantsArray = extractTenantsFromPostmanCollection(json);
          if (tenantsArray.length > 0) {
            toast.success(`Extracted ${tenantsArray.length} tenant(s) from Postman Collection`);
          }
        } else if (Array.isArray(json)) {
          // Format 1: Direct array
          console.log('✅ Format detected: Direct array');
          tenantsArray = json;
        } else if (json.data && Array.isArray(json.data.tenants)) {
          // Format 2: API response with data.tenants
          console.log('✅ Format detected: API response with data.tenants');
          tenantsArray = json.data.tenants;
        } else if (Array.isArray(json.tenants)) {
          // Format 3: Simple object with tenants array
          console.log('✅ Format detected: Simple object with tenants array');
          tenantsArray = json.tenants;
        } else if (json.data && Array.isArray(json.data)) {
          // Format 4: API response with data as array
          console.log('✅ Format detected: API response with data as array');
          tenantsArray = json.data;
        } else if (json.TenantName && typeof json.TenantName === 'string') {
          // Format 5: Single tenant object
          console.log('✅ Format detected: Single tenant object');
          tenantsArray = [json];
        } else if (json.TenantId && json.TenantName) {
          // Format 5b: Single tenant with ID
          console.log('✅ Format detected: Single tenant object with ID');
          tenantsArray = [json];
        } else {
          // Format 6: Try to find any tenant array in nested structure
          console.log('🔍 Searching for tenant array in nested structure...');
          const foundArray = findTenantsInObject(json);
          if (foundArray && foundArray.length > 0) {
            console.log('✅ Found tenant array:', foundArray.length, 'items');
            tenantsArray = foundArray;
            toast.info('Found tenant data in nested structure');
          } else {
            console.error('❌ No valid tenant data found in JSON');
            console.log('JSON keys:', Object.keys(json));
            toast.error(
              'Could not find tenant data in JSON. Please check the format.',
              { duration: 6000 }
            );
            return;
          }
        }

        console.log('📊 Tenants array length:', tenantsArray.length);
        
        if (tenantsArray.length === 0) {
          toast.error('No tenants found in JSON file');
          return;
        }

        // Validate tenant objects - check if they have TenantName OR can be created
        const validTenants = tenantsArray.filter(
          (tenant: any) => {
            const isValid = tenant && typeof tenant === 'object' && 
              tenant.TenantName && typeof tenant.TenantName === 'string';
            
            if (!isValid) {
              console.log('⚠️ Invalid tenant object:', tenant);
            }
            return isValid;
          }
        );

        console.log('✅ Valid tenants:', validTenants.length, 'out of', tenantsArray.length);

        if (validTenants.length === 0) {
          console.error('No valid tenants. Sample item:', tenantsArray[0]);
          toast.error(
            'No valid tenants found. Each tenant must have a "TenantName" field.',
            { duration: 6000 }
          );
          return;
        }

        if (validTenants.length < tenantsArray.length) {
          toast.warning(`Found ${validTenants.length} valid tenant(s) out of ${tenantsArray.length}`);
        }

        setTenantsJSON(validTenants);
        setImportResult(null);
        toast.success(`JSON loaded successfully - ${validTenants.length} tenant(s) found`);
      } catch (error: any) {
        console.error('JSON parse error:', error);
        toast.error(`Invalid JSON file: ${error.message || 'Unable to parse'}`, {
          duration: 6000
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!tenantsJSON || tenantsJSON.length === 0) {
      toast.error('Please upload a JSON file first');
      return;
    }

    setIsImporting(true);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const importedTenants: Tenant[] = [];

    for (const tenantData of tenantsJSON) {
      try {
        let tenant: Tenant;
        
        // If tenant already has full data (from API export), use it directly
        if (tenantData.TenantId) {
          // Complete tenant object from API export
          tenant = tenantData as Tenant;
          importedTenants.push(tenant);
          result.success++;
        } else {
          // Only TenantName provided, create via API
          const newTenant = await createTenant(tenantData.TenantName);
          importedTenants.push(newTenant);
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${tenantData.TenantName}: ${error.message || 'Unknown error'}`);
      }
    }

    setImportResult(result);
    setIsImporting(false);

    if (result.success > 0) {
      // Also import to demo mode storage for persistence
      importTenantsToDemo(importedTenants);
      
      toast.success(`Successfully imported ${result.success} tenant(s)`);
      onSuccess(importedTenants);
    }

    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} tenant(s)`);
    }

    if (result.failed === 0) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setTenantsJSON(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const removeFile = () => {
    setTenantsJSON(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Import Tenants from JSON</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing tenant data. Supports multiple formats including arrays, API responses, and nested structures.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* File Upload */}
          <Card className="p-4 border-dashed">
            {!tenantsJSON ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileJson className="h-10 w-10 mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload JSON file with tenant data
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload JSON File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-green-600" />
                    <span className="text-sm">
                      {tenantsJSON.length} tenant(s) loaded
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={isImporting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(tenantsJSON.slice(0, 3), null, 2)}
                  {tenantsJSON.length > 3 && '\n... and ' + (tenantsJSON.length - 3) + ' more'}
                </pre>
              </div>
            )}
          </Card>

          {/* Import Results */}
          {importResult && (
            <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Import Results:</p>
                <ul className="text-sm space-y-1">
                  <li>Successfully imported: {importResult.success}</li>
                  <li>Failed: {importResult.failed}</li>
                </ul>
                {importResult.errors.length > 0 && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">View errors</summary>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex w-full justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!tenantsJSON || isImporting || (importResult !== null && importResult.failed === 0)}
          >
            {isImporting ? 'Importing...' : 'Import Tenants'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}