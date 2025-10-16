import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshIcon } from './icons/RefreshIcon';
import { ViewIcon } from './icons/ViewIcon';
import { FileJson, RefreshCw, Eye, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ModelSchema, getAllModelSchemas } from '../lib/api';
import { TransactionFormDialog } from './TransactionFormDialog';
import { toast } from 'sonner@2.0.3';

export function ModelSchemaView() {
  const [globalSchemas, setGlobalSchemas] = useState<ModelSchema[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selectedSchemaForDetail, setSelectedSchemaForDetail] = useState<ModelSchema | null>(null);
  const [isSchemaDetailOpen, setIsSchemaDetailOpen] = useState(false);

  // Load schemas on mount
  useEffect(() => {
    loadGlobalSchemas();
  }, []);

  // Load global ModelSchemas
  const loadGlobalSchemas = async () => {
    setIsLoadingSchemas(true);
    setSchemaError(null);
    try {
      const schemas = await getAllModelSchemas();
      setGlobalSchemas(schemas);
      if (schemas.length === 0) {
        setSchemaError('No schemas found. ModelSchema API may not be enabled yet.');
      } else {
        toast.success(`Loaded ${schemas.length} schema(s)`);
      }
    } catch (error: any) {
      setSchemaError(error.message || 'Failed to load schemas');
      setGlobalSchemas([]);
      if (error.message !== 'CORS_BLOCKED') {
        toast.error(`Failed to load schemas: ${error.message}`);
      }
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  // Get state badge
  const getStateBadge = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
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
    <div className="w-full max-w-[1440px] mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <CardTitle className="flex items-center gap-2 font-bold pt-[0px] pr-[0px] pb-[5px] pl-[0px] text-lg md:text-xl">
                Global Transaction Spec
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                All available Transaction Spec from <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] md:text-xs">GET /1.0/txns?TxnType=ModelSchema</code>
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={loadGlobalSchemas}
                disabled={isLoadingSchemas}
                className="rounded-[4px]"
              >
                <RefreshIcon className={`h-4 w-4 ${isLoadingSchemas ? 'animate-spin' : ''} md:mr-2`} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {isLoadingSchemas && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading schemas from BFS API...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoadingSchemas && schemaError && (
            <Card className="p-8 bg-muted border-2 border-dashed">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="mb-2">Could not load schemas</h3>
                <p className="text-muted-foreground mb-4">{schemaError}</p>
                <Button variant="outline" size="sm" onClick={loadGlobalSchemas} className="rounded-full">
                  <RefreshIcon className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Success State */}
          {!isLoadingSchemas && !schemaError && globalSchemas.length > 0 && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>{globalSchemas.length} Model Schema{globalSchemas.length !== 1 ? 's' : ''} Available</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {globalSchemas.filter(s => s.state === 'active').length} Active
                    </Badge>
                    {globalSchemas.filter(s => s.state === 'deprecated').length > 0 && (
                      <Badge variant="destructive">
                        {globalSchemas.filter(s => s.state === 'deprecated').length} Deprecated
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>

              {/* Schema Cards Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {globalSchemas.map((schema) => {
                  const requiredFields = getRequiredFields(schema.jsonSchema);
                  const propertyCount = countProperties(schema.jsonSchema);

                  return (
                    <Card key={schema.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="m-0">{schema.model}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            v{schema.version} • {schema.semver}
                          </p>
                        </div>
                        {getStateBadge(schema.state)}
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Properties:</span>
                          <span className="font-medium">{propertyCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Required Fields:</span>
                          <span className="font-medium">{requiredFields.length}</span>
                        </div>
                        {requiredFields.length > 0 && (
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            Required: {requiredFields.slice(0, 3).join(', ')}
                            {requiredFields.length > 3 && `, +${requiredFields.length - 3}`}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mb-3 pb-3 border-b">
                        <div>Created: {new Date(schema.CreateTime).toLocaleDateString()}</div>
                        <div>Updated: {new Date(schema.UpdateTime).toLocaleDateString()}</div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-[4px]"
                        onClick={() => {
                          setSelectedSchemaForDetail(schema);
                          setIsSchemaDetailOpen(true);
                        }}
                      >
                        <ViewIcon className="h-4 w-4 mr-2" />
                        View Full Schema
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Detail Dialog */}
      {selectedSchemaForDetail && (
        <Dialog open={isSchemaDetailOpen} onOpenChange={setIsSchemaDetailOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[1200px]">
            {/* Header with metadata in horizontal layout */}
            <div className="space-y-4 pb-4 border-b">
              <div>
                <DialogTitle className="text-2xl mb-1">
                  {selectedSchemaForDetail.model} - v{selectedSchemaForDetail.version} ({selectedSchemaForDetail.semver})
                </DialogTitle>
                <DialogDescription className="text-xs">
                  JSON Schema (Draft 2020-12)
                </DialogDescription>
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ID</label>
                  <div className="font-mono">{selectedSchemaForDetail.id}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <div>{getStateBadge(selectedSchemaForDetail.state)}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Created</label>
                  <div>
                    {new Date(selectedSchemaForDetail.CreateTime).toLocaleString('en-US', {
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
                    {new Date(selectedSchemaForDetail.UpdateTime).toLocaleString('en-US', {
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
                    {JSON.stringify(selectedSchemaForDetail.jsonSchema, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              {/* Right Column - Properties Table (50%) */}
              <div className="overflow-y-auto pl-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="m-0">Properties:</h4>
                  <span className="text-xs text-muted-foreground">
                    {countProperties(selectedSchemaForDetail.jsonSchema)} fields
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
                        {Object.entries(selectedSchemaForDetail.jsonSchema?.properties || {}).map(([key, value]: [string, any], index) => {
                          const isRequired = getRequiredFields(selectedSchemaForDetail.jsonSchema).includes(key);
                          return (
                            <tr key={key} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-2 font-[Inter] text-[rgb(0,0,0)]">{key}</td>
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
    </div>
  );
}
