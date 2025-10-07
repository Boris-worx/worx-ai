import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tenant } from '../lib/api';

interface TenantDetailProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantDetail({ tenant, open, onOpenChange }: TenantDetailProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{tenant.TenantName}</DialogTitle>
          <DialogDescription>
            Complete tenant information from Cosmos DB
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
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
                      <dd className="col-span-2 font-mono text-sm break-all">
                        {tenant._etag}
                        <Badge variant="secondary" className="ml-2">
                          Concurrency Control
                        </Badge>
                      </dd>
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
                      <dd className="col-span-2 font-mono text-sm">{tenant._attachments}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            </div>

            {/* Raw JSON */}
            <div>
              <h3 className="mb-3">Raw JSON</h3>
              <Card className="p-4 bg-muted">
                <pre className="text-xs overflow-x-auto">
                  <code>{JSON.stringify(tenant, null, 2)}</code>
                </pre>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}