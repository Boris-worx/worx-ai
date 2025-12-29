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
        <DialogContent className="w-full max-w-[600px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{tenant.TenantName}</DialogTitle>
            <DialogDescription>
              Complete tenant information from Cosmos DB
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-6">
              {/* Primary Information */}
              <div>
                <h3 className="mb-3">Primary Information</h3>
                <Card className="p-4">
                  <dl className="grid grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">Tenant ID</dt>
                      <dd>
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
                          {tenant.TenantId}
                        </code>
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-sm text-muted-foreground mb-1">Tenant Name</dt>
                      <dd className="text-sm">{tenant.TenantName}</dd>
                    </div>
                  </dl>
                </Card>
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
                          <dd className="text-sm col-span-2">{formatDate(tenant.CreateTime)}</dd>
                        </div>
                      )}
                      {tenant.UpdateTime && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm text-muted-foreground">Updated</dt>
                          <dd className="text-sm col-span-2">{formatDate(tenant.UpdateTime)}</dd>
                        </div>
                      )}
                      {tenant._ts && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm text-muted-foreground">_ts (Unix)</dt>
                          <dd className="text-sm col-span-2">
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
                        <dd className="text-sm col-span-2 text-sm break-all">{tenant._rid}</dd>
                      </div>
                    )}
                    {tenant._etag && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">ETag</dt>
                        <dd className="text-sm col-span-2 text-sm break-all">{tenant._etag}</dd>
                      </div>
                    )}
                    {tenant._self && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">Self Link</dt>
                        <dd className="text-sm col-span-2 text-sm break-all">{tenant._self}</dd>
                      </div>
                    )}
                    {tenant._attachments && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-muted-foreground">Attachments</dt>
                        <dd className="text-sm col-span-2 text-sm break-all">{tenant._attachments}</dd>
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
          <DialogContent className="max-w-[90vw] w-[1200px] overflow-hidden">
            {/* Header with metadata in horizontal layout */}
            <div className="space-y-4 pb-4 border-b flex-shrink-0">
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
            <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
              {/* Left Column - JSON Schema (50%) */}
              <div className="overflow-y-auto pr-2">
                <h4 className="mb-3">JSON Schema:</h4>
                <ScrollArea className="h-full border rounded-md bg-[#ffffff] p-3">
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
                <div className="border rounded-lg overflow-hidden h-full">
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