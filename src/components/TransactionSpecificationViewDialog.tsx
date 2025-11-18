import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { TransactionSpecification } from '../lib/api';

interface TransactionSpecificationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specification: TransactionSpecification | null;
}

export function TransactionSpecificationViewDialog({
  open,
  onOpenChange,
  specification
}: TransactionSpecificationViewDialogProps) {
  if (!specification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{specification.SpecName}</span>
            <Badge variant={specification.Status === 'Active' ? 'default' : 'secondary'}>
              {specification.Status || 'Active'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Specification ID</p>
                  <p className="font-mono">{specification.TransactionSpecId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p>{specification.Version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Application ID</p>
                  <p className="font-mono">{specification.ApplicationId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenant ID</p>
                  <p className="font-mono">{specification.TenantId}</p>
                </div>
                {specification.CreateTime && (
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(specification.CreateTime).toLocaleString()}</p>
                  </div>
                )}
                {specification.UpdateTime && (
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{new Date(specification.UpdateTime).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {specification.Description && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm">{specification.Description}</p>
                </div>
              </>
            )}

            <Separator />

            {/* JSON Schema */}
            <div className="space-y-3">
              <h3 className="font-semibold">JSON Schema</h3>
              <div className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(specification.JsonSchema, null, 2)}
                </pre>
              </div>
            </div>

            {/* Schema Properties Summary */}
            {specification.JsonSchema?.properties && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Properties Summary</h3>
                  <div className="space-y-2">
                    {Object.entries(specification.JsonSchema.properties).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-start gap-3 text-sm">
                        <code className="bg-muted px-2 py-1 rounded min-w-[120px]">{key}</code>
                        <div className="flex-1">
                          <span className="text-muted-foreground">Type:</span>{' '}
                          <span>{value.type || 'any'}</span>
                          {value.format && (
                            <>
                              {' '}
                              <span className="text-muted-foreground">Format:</span>{' '}
                              <span>{value.format}</span>
                            </>
                          )}
                          {value.enum && (
                            <>
                              {' '}
                              <span className="text-muted-foreground">Enum:</span>{' '}
                              <span className="font-mono text-xs">[{value.enum.join(', ')}]</span>
                            </>
                          )}
                          {specification.JsonSchema.required?.includes(key) && (
                            <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Required Fields */}
            {specification.JsonSchema?.required && specification.JsonSchema.required.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Required Fields</h3>
                  <div className="flex flex-wrap gap-2">
                    {specification.JsonSchema.required.map((field: string) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
