import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tenant, ModelSchema, getModelSchemasForTenant } from '../lib/api';
import { useState, useEffect } from 'react';
import { FileJson, Eye, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TenantDetailProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantDetail({ tenant, open, onOpenChange }: TenantDetailProps) {
  const [schemas, setSchemas] = useState<ModelSchema[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<ModelSchema | null>(null);
  const [isSchemaDetailOpen, setIsSchemaDetailOpen] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Load schemas when dialog opens
  useEffect(() => {
    if (open && tenant) {
      loadSchemas();
    }
  }, [open, tenant?.TenantId]);

  const loadSchemas = async () => {
    if (!tenant) return;
    
    setIsLoadingSchemas(true);
    try {
      const schemasData = await getModelSchemasForTenant(tenant.TenantId);
      setSchemas(schemasData);
    } catch (error) {
      console.error('Error loading schemas:', error);
      setSchemas([]);
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  const getStateBadge = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'deprecated':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Deprecated</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  const getRequiredFields = (jsonSchema: any): string[] => {
    return jsonSchema?.required || [];
  };

  const countProperties = (jsonSchema: any): number => {
    return Object.keys(jsonSchema?.properties || {}).length;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{tenant.TenantName}</DialogTitle>
            <DialogDescription>
              Complete tenant information from Cosmos DB
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-150px)] pr-4">
            <div className="space-y-6">
              {/* Primary Information */}
              <div>
                <h3 className="mb-3">Primary Information</h3>
                <Card className="p-4">
                  <dl className="grid grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">Tenant ID</dt>
                      <dd className="font-mono">{tenant.TenantId}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-sm text-muted-foreground mb-1">Tenant Name</dt>
                      <dd>{tenant.TenantName}</dd>
                    </div>
                  </dl>
                </Card>
              </div>

              <Separator />

              {/* Model Schemas Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <h3 className="m-0">Model Schemas</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSchemas}
                    disabled={isLoadingSchemas}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSchemas ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {isLoadingSchemas && (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!isLoadingSchemas && schemas.length === 0 && (
                  <Card className="p-6">
                    <div className="text-center">
                      <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No model schemas found for this tenant</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Schemas will appear here when published to the tenant
                      </p>
                    </div>
                  </Card>
                )}

                {!isLoadingSchemas && schemas.length > 0 && (
                  <div className="space-y-3">
                    <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm">{schemas.length} Model Schema{schemas.length !== 1 ? 's' : ''}</span>
                        </div>
                        <Badge variant="secondary">
                          {schemas.filter(s => s.state === 'active').length} Active
                        </Badge>
                      </div>
                    </Card>

                    <div className="grid gap-3 md:grid-cols-2">
                      {schemas.map((schema) => {
                        const requiredFields = getRequiredFields(schema.jsonSchema);
                        const propertyCount = countProperties(schema.jsonSchema);

                        return (
                          <Card key={schema.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="m-0">{schema.model}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  v{schema.version} • {schema.semver}
                                </p>
                              </div>
                              {getStateBadge(schema.state)}
                            </div>

                            <div className="space-y-1 text-sm mb-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Properties:</span>
                                <span>{propertyCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Required:</span>
                                <span>{requiredFields.length}</span>
                              </div>
                              {requiredFields.length > 0 && (
                                <div className="text-xs text-muted-foreground pt-1">
                                  {requiredFields.slice(0, 3).join(', ')}
                                  {requiredFields.length > 3 && `, +${requiredFields.length - 3} more`}
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-full"
                              onClick={() => {
                                setSelectedSchema(schema);
                                setIsSchemaDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Schema
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Timestamps */}
              {(tenant.CreateTime || tenant.UpdateTime || tenant._ts) && (
                <div>
                  <h3 className="mb-3">Timestamps</h3>
                  <Card className="p-4">
                    <dl className="space-y-3">
                      {tenant.CreateTime && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm text-muted-foreground">Created</dt>
                          <dd className="col-span-2">{formatDate(tenant.CreateTime)}</dd>
                        </div>
                      )}
                      {tenant.UpdateTime && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm text-muted-foreground">Updated</dt>
                          <dd className="col-span-2">{formatDate(tenant.UpdateTime)}</dd>
                        </div>
                      )}
                      {tenant._ts && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm text-muted-foreground">_ts (Unix)</dt>
                          <dd className="col-span-2 font-mono">
                            {tenant._ts}
                            <span className="text-muted-foreground ml-2">
                              ({formatTimestamp(tenant._ts)})
                            </span>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                </div>
              )}

              {/* Cosmos DB Metadata */}
              <div>
                <h3 className="mb-3">Cosmos DB Metadata</h3>
                <Card className="p-4">
                  <dl className="space-y-3">
                    {tenant._rid && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">Resource ID</dt>
                        <dd className="col-span-2 font-mono text-sm break-all">{tenant._rid}</dd>
                      </div>
                    )}
                    {tenant._etag && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">ETag</dt>
                        <dd className="col-span-2 font-mono text-sm break-all">{tenant._etag}</dd>
                      </div>
                    )}
                    {tenant._self && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">Self Link</dt>
                        <dd className="col-span-2 font-mono text-sm break-all">{tenant._self}</dd>
                      </div>
                    )}
                    {tenant._attachments && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">Attachments</dt>
                        <dd className="col-span-2 font-mono text-sm break-all">{tenant._attachments}</dd>
                      </div>
                    )}
                  </dl>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Schema Detail Dialog */}
      {selectedSchema && (
        <Dialog open={isSchemaDetailOpen} onOpenChange={setIsSchemaDetailOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[1200px]">
            {/* Header with metadata in horizontal layout */}
            <div className="space-y-4 pb-4 border-b">
              <div>
                <DialogTitle className="text-2xl mb-1">
                  {selectedSchema.model} - v{selectedSchema.version} ({selectedSchema.semver})
                </DialogTitle>
                <DialogDescription className="text-xs">
                  JSON Schema (Draft 2020-12) • Tenant: {tenant.TenantName}
                </DialogDescription>
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ID</label>
                  <div className="font-mono">{selectedSchema.id}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <div>{getStateBadge(selectedSchema.state)}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Created</label>
                  <div>
                    {new Date(selectedSchema.CreateTime).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Updated</label>
                  <div>
                    {new Date(selectedSchema.UpdateTime).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Two equal columns */}
            <div className="grid grid-cols-2 gap-6 h-[calc(90vh-280px)]">
              {/* Left Column - JSON Schema (50%) */}
              <div className="overflow-y-auto pr-2">
                <h4 className="mb-3">JSON Schema:</h4>
                <ScrollArea className="h-[calc(90vh-340px)] border rounded-md bg-muted p-3">
                  <pre className="text-xs font-mono leading-relaxed">
                    {JSON.stringify(selectedSchema.jsonSchema, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              {/* Right Column - Properties Table (50%) */}
              <div className="overflow-y-auto pl-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="m-0">Properties:</h4>
                  <span className="text-xs text-muted-foreground">
                    {countProperties(selectedSchema.jsonSchema)} fields
                  </span>
                </div>

                {/* Properties Table - Compact */}
                <div className="border rounded-lg overflow-hidden h-[calc(90vh-340px)]">
                  <ScrollArea className="h-full">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Field</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSchema.jsonSchema?.properties || {}).map(([key, value]: [string, any], index) => {
                          const isRequired = getRequiredFields(selectedSchema.jsonSchema).includes(key);
                          return (
                            <tr key={key} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-2 font-mono text-primary">{key}</td>
                              <td className="p-2 text-muted-foreground">{value.type || 'any'}</td>
                              <td className="p-2">
                                <Badge 
                                  variant={isRequired ? 'destructive' : 'secondary'}
                                  className={`text-xs py-0 px-2 ${isRequired ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 text-gray-700'}`}
                                >
                                  {isRequired ? 'required' : 'optional'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
