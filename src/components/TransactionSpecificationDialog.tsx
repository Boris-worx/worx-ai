import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Info } from 'lucide-react';
import { TransactionSpecification } from '../lib/api';

interface TransactionSpecificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  specification?: TransactionSpecification | null;
  applicationId: string;
  tenantId: string;
  onSubmit: (data: {
    specName: string;
    version: string;
    description: string;
    status: 'Active' | 'Inactive';
    jsonSchema: any;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function TransactionSpecificationDialog({
  open,
  onOpenChange,
  mode,
  specification,
  applicationId,
  tenantId,
  onSubmit,
  isSubmitting
}: TransactionSpecificationDialogProps) {
  const [formData, setFormData] = useState({
    specName: '',
    version: '1.0',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    jsonSchemaText: JSON.stringify({
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "",
      "type": "object",
      "required": [],
      "properties": {}
    }, null, 2)
  });

  const [jsonError, setJsonError] = useState<string | null>(null);

  // Load specification data when editing
  useEffect(() => {
    if (mode === 'edit' && specification) {
      setFormData({
        specName: specification.SpecName || '',
        version: specification.Version || '1.0',
        description: specification.Description || '',
        status: (specification.Status as 'Active' | 'Inactive') || 'Active',
        jsonSchemaText: JSON.stringify(specification.JsonSchema || {}, null, 2)
      });
    } else {
      // Reset for create mode
      setFormData({
        specName: '',
        version: '1.0',
        description: '',
        status: 'Active',
        jsonSchemaText: JSON.stringify({
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": "",
          "type": "object",
          "required": [],
          "properties": {}
        }, null, 2)
      });
    }
    setJsonError(null);
  }, [mode, specification, open]);

  // Validate JSON Schema
  const validateJsonSchema = (text: string): boolean => {
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (error: any) {
      setJsonError(error.message);
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validate JSON
    if (!validateJsonSchema(formData.jsonSchemaText)) {
      return;
    }

    // Validate required fields
    if (!formData.specName.trim()) {
      setJsonError('Specification Name is required');
      return;
    }

    if (!formData.version.trim()) {
      setJsonError('Version is required');
      return;
    }

    try {
      const jsonSchema = JSON.parse(formData.jsonSchemaText);
      
      await onSubmit({
        specName: formData.specName.trim(),
        version: formData.version.trim(),
        description: formData.description.trim(),
        status: formData.status,
        jsonSchema
      });
      
      // Reset form on success
      setFormData({
        specName: '',
        version: '1.0',
        description: '',
        status: 'Active',
        jsonSchemaText: JSON.stringify({
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": "",
          "type": "object",
          "required": [],
          "properties": {}
        }, null, 2)
      });
      setJsonError(null);
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Transaction Specification' : 'Edit Transaction Specification'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Define a new transaction specification with JSON schema'
              : 'Update the transaction specification details and schema'}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Transaction specifications define the data structure required by applications. 
            The JSON schema will be used to validate transaction data at runtime.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="specName">Specification Name *</Label>
            <Input
              id="specName"
              placeholder="e.g., Customer, Quote, Order"
              value={formData.specName}
              onChange={(e) => setFormData({ ...formData, specName: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="e.g., 1.0, 2.1"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Inactive') =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this transaction specification"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jsonSchema">JSON Schema *</Label>
              <span className="text-xs text-muted-foreground">
                JSON Schema Draft 2020-12
              </span>
            </div>
            <Textarea
              id="jsonSchema"
              placeholder="Enter JSON Schema definition"
              value={formData.jsonSchemaText}
              onChange={(e) => {
                setFormData({ ...formData, jsonSchemaText: e.target.value });
                // Clear error when user starts typing
                if (jsonError) setJsonError(null);
              }}
              onBlur={() => validateJsonSchema(formData.jsonSchemaText)}
              rows={12}
              disabled={isSubmitting}
              className="font-mono text-sm"
            />
            {jsonError && (
              <p className="text-sm text-destructive">
                ❌ {jsonError}
              </p>
            )}
          </div>

          {mode === 'create' && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>Application:</strong> {applicationId}</p>
              <p><strong>Tenant:</strong> {tenantId}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!jsonError}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
