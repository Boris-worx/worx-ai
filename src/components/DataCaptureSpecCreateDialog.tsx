import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Database, FileJson } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DataSource, createDataCaptureSpec, ApicurioArtifact, getApicurioArtifactContent } from '../lib/api';

interface DataCaptureSpecCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataSource: DataSource | null;
  activeTenantId: string;
  availableApicurioSchemas: ApicurioArtifact[];
  isLoadingApicurioSchemas: boolean;
  onSuccess: () => void;
}

// Helper to get data source ID (handle both field name variations)
const getDataSourceId = (ds: DataSource) => ds.DatasourceId || ds.DataSourceId || '';
const getDataSourceName = (ds: DataSource) => ds.DatasourceName || ds.DataSourceName || '';

export function DataCaptureSpecCreateDialog({
  isOpen,
  onClose,
  selectedDataSource,
  activeTenantId,
  availableApicurioSchemas,
  isLoadingApicurioSchemas,
  onSuccess
}: DataCaptureSpecCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApicurioSchema, setSelectedApicurioSchema] = useState<string>('');
  const [formData, setFormData] = useState({
    dataCaptureSpecName: '',
    containerName: '',
    tenantId: '',
    dataSourceId: '',
    isActive: true,
    version: 1,
    profile: 'data-capture',
    sourcePrimaryKeyField: '',
    partitionKeyField: '',
    partitionKeyValue: '',
    allowedFiltersText: '', // Comma-separated
    requiredFields: [] as string[],
    containerSchemaText: ''
  });

  // Pre-fill tenantId and dataSourceId
  useEffect(() => {
    if (isOpen && selectedDataSource) {
      setFormData(prev => ({
        ...prev,
        tenantId: selectedDataSource.TenantId || activeTenantId,
        dataSourceId: getDataSourceId(selectedDataSource)
      }));
    }
  }, [isOpen, selectedDataSource, activeTenantId]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        dataCaptureSpecName: '',
        containerName: '',
        tenantId: '',
        dataSourceId: '',
        isActive: true,
        version: 1,
        profile: 'data-capture',
        sourcePrimaryKeyField: '',
        partitionKeyField: '',
        partitionKeyValue: '',
        allowedFiltersText: '',
        requiredFields: [],
        containerSchemaText: ''
      });
      setSelectedApicurioSchema('');
    }
  }, [isOpen]);

  // Load IRC example template
  const loadIRCTemplate = () => {
    const ircTemplate = {
      dataCaptureSpecName: "irc",
      containerName: "ircs",
      version: 1,
      isActive: true,
      profile: "data-capture",
      sourcePrimaryKeyField: "id",
      partitionKeyField: "id",
      partitionKeyValue: "",
      allowedFiltersText: "id",
      requiredFields: ["id"],
      containerSchema: {
        schemaVersion: 1,
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Document ID. developer/integrator sets it from webapp. Source primary key value in case of one source or combination, also mapped to id if needed"
          },
          metaData: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceDatabase: { type: "string" },
                    sourceTable: { type: "string" },
                    sourcePrimaryKeyField: { type: "string" },
                    sourceCreateTime: { type: ["string", "null"], format: "date-time" },
                    sourceUpdateTime: { type: ["string", "null"], format: "date-time" },
                    sourceEtag: { type: ["string", "null"] }
                  }
                }
              }
            }
          },
          createTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          },
          updateTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          }
        },
        required: ["id"],
        unevaluatedProperties: true
      }
    };

    setFormData(prev => ({
      ...prev,
      dataCaptureSpecName: ircTemplate.dataCaptureSpecName,
      containerName: ircTemplate.containerName,
      version: ircTemplate.version,
      isActive: ircTemplate.isActive,
      profile: ircTemplate.profile,
      sourcePrimaryKeyField: ircTemplate.sourcePrimaryKeyField,
      partitionKeyField: ircTemplate.partitionKeyField,
      partitionKeyValue: ircTemplate.partitionKeyValue,
      allowedFiltersText: ircTemplate.allowedFiltersText,
      requiredFields: ircTemplate.requiredFields,
      containerSchemaText: JSON.stringify(ircTemplate.containerSchema, null, 2)
    }));

    toast.success('Loaded IRC example template');
  };

  // Load schema from Apicurio
  const handleApicurioSchemaLoad = async (value: string) => {
    setSelectedApicurioSchema(value);

    if (!value) return;

    try {
      const selectedSchema = availableApicurioSchemas.find(s => s.id === value);

      if (!selectedSchema || !selectedSchema.groupId) {
        toast.error('Unable to determine Apicurio group for this schema');
        return;
      }

      const schemaContent = await getApicurioArtifactContent(selectedSchema.groupId, value);
      const schemaName = value.replace(/^bfs\./, '').replace(/\.json$/, '');

      setFormData(prev => ({
        ...prev,
        dataCaptureSpecName: prev.dataCaptureSpecName || schemaName,
        containerSchemaText: JSON.stringify(schemaContent, null, 2)
      }));

      toast.success(`Loaded schema "${value}" from group "${selectedSchema.groupId}"`);
    } catch (error) {
      console.error('Failed to load schema from Apicurio:', error);
      toast.error('Failed to load schema from Apicurio Registry');
    }
  };

  // Extract available fields from schema for Required Fields checkboxes
  const extractAvailableFields = (): string[] => {
    if (!formData.containerSchemaText) return [];

    try {
      const schema = JSON.parse(formData.containerSchemaText);
      let fields: string[] = [];

      // JSON Schema format
      if (schema.properties && typeof schema.properties === 'object') {
        fields = Object.keys(schema.properties);
      }
      // AVRO format
      else if (Array.isArray(schema.fields)) {
        fields = schema.fields
          .filter((f: any) => f && f.name)
          .map((f: any) => f.name);
      }

      return fields;
    } catch (e) {
      console.error('Failed to parse schema:', e);
      return [];
    }
  };

  // Generate preview JSON payload
  const getPreviewPayload = () => {
    try {
      // Parse allowed filters (comma-separated)
      const allowedFilters = formData.allowedFiltersText
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Parse container schema
      let containerSchema;
      try {
        containerSchema = formData.containerSchemaText ? JSON.parse(formData.containerSchemaText) : {};
      } catch {
        containerSchema = '// Invalid JSON';
      }

      const payload = {
        dataCaptureSpecName: formData.dataCaptureSpecName || '',
        containerName: formData.containerName || '',
        tenantId: formData.tenantId || '',
        dataSourceId: formData.dataSourceId || '',
        isActive: formData.isActive,
        version: formData.version,
        profile: formData.profile,
        sourcePrimaryKeyField: formData.sourcePrimaryKeyField || '',
        partitionKeyField: formData.partitionKeyField || '',
        partitionKeyValue: formData.partitionKeyValue,
        allowedFilters: allowedFilters,
        requiredFields: formData.requiredFields,
        containerSchema: containerSchema
      };

      return JSON.stringify(payload, null, 2);
    } catch (e) {
      return '// Error generating preview';
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDataSource) {
      toast.error('No data source selected');
      return;
    }

    // Validation
    if (!formData.dataCaptureSpecName.trim()) {
      toast.error('Data Capture Specification Name is required');
      return;
    }

    if (!formData.containerName.trim()) {
      toast.error('Container Name is required');
      return;
    }

    if (!formData.version || formData.version < 1) {
      toast.error('Version must be at least 1');
      return;
    }

    if (!formData.containerSchemaText.trim()) {
      toast.error('Container Schema is required');
      return;
    }

    if (formData.requiredFields.length === 0) {
      toast.error('Please select at least one Required Field');
      return;
    }

    if (!formData.sourcePrimaryKeyField.trim()) {
      toast.error('Source Primary Key Field is required');
      return;
    }

    if (!formData.partitionKeyField.trim()) {
      toast.error('Partition Key Field is required');
      return;
    }

    // Parse container schema
    let containerSchema;
    try {
      containerSchema = JSON.parse(formData.containerSchemaText);
    } catch (error) {
      toast.error('Invalid JSON in Container Schema');
      return;
    }

    // Parse allowed filters (comma-separated)
    const allowedFilters = formData.allowedFiltersText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    setIsSubmitting(true);
    try {
      const payload = {
        dataCaptureSpecName: formData.dataCaptureSpecName,
        containerName: formData.containerName,
        tenantId: formData.tenantId,
        dataSourceId: formData.dataSourceId,
        isActive: formData.isActive,
        version: formData.version,
        profile: formData.profile,
        sourcePrimaryKeyField: formData.sourcePrimaryKeyField,
        partitionKeyField: formData.partitionKeyField,
        partitionKeyValue: formData.partitionKeyValue,
        allowedFilters: allowedFilters,
        requiredFields: formData.requiredFields,
        containerSchema: containerSchema
      };

      console.log('Creating Data Capture Spec:', payload);

      await createDataCaptureSpec(payload);

      toast.success(`Data Capture Specification "${formData.dataCaptureSpecName}" created successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create spec:', error);
      const errorMessage = error.message || 'Failed to create data capture specification';
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFields = extractAvailableFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Data Capture Specification</DialogTitle>
          <DialogDescription>
            Define how data from {selectedDataSource ? getDataSourceName(selectedDataSource) : 'data source'} should be captured into Cosmos DB.
          </DialogDescription>
        </DialogHeader>

        {/* Two column layout: Form on left, JSON on right */}
        <div className="flex gap-6 h-[calc(90vh-220px)] -mx-6 px-6">
          {/* Left Column: Form Fields */}
          <div className="flex-1 overflow-y-auto pr-4 border-r">
            <div className="space-y-3 pb-4">
              {/* Load Template or Schema */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadIRCTemplate}
                className="w-full"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Load IRC Template
              </Button>

              <Separator />

              {/* Apicurio Schema Selector */}
              <div className="space-y-2 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apicurioSchema" className="text-xs">Load Schema from Apicurio</Label>
                  {isLoadingApicurioSchemas && <Badge variant="outline" className="text-xs animate-pulse">Loading...</Badge>}
                </div>

                {isLoadingApicurioSchemas ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Database className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Discovering schemas...</span>
                  </div>
                ) : availableApicurioSchemas.length > 0 ? (
                  <Select value={selectedApicurioSchema} onValueChange={handleApicurioSchemaLoad}>
                    <SelectTrigger id="apicurioSchema" className="bg-white h-8">
                      <SelectValue placeholder="Select schema..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {availableApicurioSchemas.map((schema) => (
                        <SelectItem key={schema.id} value={schema.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs">{schema.id}</span>
                            {schema.groupId && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {schema.groupId}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      No schemas found.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion for form sections */}
              <Accordion type="multiple" defaultValue={["basic", "keys", "required"]} className="w-full">
                {/* Basic Information */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-sm py-2">Basic Information</AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pt-2">
                    {/* Tenant ID + Data Source ID */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="tenantId" className="text-xs">Tenant ID *</Label>
                        <Input
                          id="tenantId"
                          value={formData.tenantId}
                          disabled
                          className="bg-muted h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="dataSourceId" className="text-xs">Data Source ID *</Label>
                        <Input
                          id="dataSourceId"
                          value={formData.dataSourceId}
                          disabled
                          className="bg-muted h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Specification Name + Container Name */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="specName" className="text-xs">Spec Name *</Label>
                        <Input
                          id="specName"
                          placeholder="e.g., irc"
                          value={formData.dataCaptureSpecName}
                          onChange={(e) => setFormData({ ...formData, dataCaptureSpecName: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="containerName" className="text-xs">Container Name *</Label>
                        <Input
                          id="containerName"
                          placeholder="e.g., ircs"
                          value={formData.containerName}
                          onChange={(e) => setFormData({ ...formData, containerName: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Version + Is Active */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="version" className="text-xs">Version *</Label>
                        <Input
                          id="version"
                          type="number"
                          min="1"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="isActive" className="text-xs">Is Active</Label>
                        <div className="flex items-center space-x-2 h-8">
                          <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                          <Label htmlFor="isActive" className="text-xs cursor-pointer">
                            {formData.isActive ? 'Active' : 'Inactive'}
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Profile */}
                    <div className="space-y-1">
                      <Label htmlFor="profile" className="text-xs">Profile *</Label>
                      <Input
                        id="profile"
                        value={formData.profile}
                        onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Key Fields Configuration */}
                <AccordionItem value="keys">
                  <AccordionTrigger className="text-sm py-2">Key Fields Configuration</AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pt-2">
                    {/* Source Primary Key Field */}
                    <div className="space-y-1">
                      <Label htmlFor="sourcePrimaryKeyField" className="text-xs">Source Primary Key Field *</Label>
                      <Input
                        id="sourcePrimaryKeyField"
                        placeholder="e.g., id"
                        value={formData.sourcePrimaryKeyField}
                        onChange={(e) => setFormData({ ...formData, sourcePrimaryKeyField: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Partition Key Field + Value */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="partitionKeyField" className="text-xs">Partition Key Field *</Label>
                        <Input
                          id="partitionKeyField"
                          placeholder="e.g., id"
                          value={formData.partitionKeyField}
                          onChange={(e) => setFormData({ ...formData, partitionKeyField: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="partitionKeyValue" className="text-xs">Partition Key Value</Label>
                        <Input
                          id="partitionKeyValue"
                          placeholder="Optional"
                          value={formData.partitionKeyValue}
                          onChange={(e) => setFormData({ ...formData, partitionKeyValue: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Allowed Filters */}
                    <div className="space-y-1">
                      <Label htmlFor="allowedFilters" className="text-xs">Allowed Filters (comma-separated)</Label>
                      <Input
                        id="allowedFilters"
                        placeholder="e.g., id, name, status"
                        value={formData.allowedFiltersText}
                        onChange={(e) => setFormData({ ...formData, allowedFiltersText: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Required Fields */}
                {availableFields.length > 0 && (
                  <AccordionItem value="required">
                    <AccordionTrigger className="text-sm py-2">
                      Required Fields ({formData.requiredFields.length} selected)
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 border rounded-md bg-muted/30">
                        {availableFields.map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${field}`}
                              checked={formData.requiredFields.includes(field)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    requiredFields: [...formData.requiredFields, field]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    requiredFields: formData.requiredFields.filter(f => f !== field)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`required-${field}`} className="text-[10px] cursor-pointer font-mono">
                              {field}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>

          {/* Right Column: Container Schema Editor */}
          <div className="flex-1 flex flex-col space-y-2 pl-4">
            <div className="flex justify-between items-center flex-shrink-0">
              <Label className="text-xs">Container Schema (JSON) *</Label>
              <Badge variant="outline" className="text-[10px]">JSON Schema</Badge>
            </div>
            <div className="flex-1 border rounded-md overflow-hidden">
              <textarea
                className="w-full h-full font-mono text-[11px] p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-muted/20"
                value={formData.containerSchemaText}
                onChange={(e) => setFormData({ ...formData, containerSchemaText: e.target.value })}
                placeholder='Load IRC template or Apicurio schema, or paste JSON schema here...'
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Specification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}