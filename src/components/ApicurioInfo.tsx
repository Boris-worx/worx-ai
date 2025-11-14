import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Database, ExternalLink } from 'lucide-react';

interface ApicurioInfoProps {
  groupMappings?: Record<string, string>;
}

export function ApicurioInfo({ groupMappings }: ApicurioInfoProps) {
  const defaultMappings = {
    'BFS': 'bfs.online',
    'Bidtools': 'paradigm.mybldr.bidtools',
    'TxServices': 'paradigm.txservices',
    'Quotes': 'paradigm.txservices.quotes',
    'Customers': 'paradigm.txservices.customers',
  };

  const mappings = groupMappings || defaultMappings;
  const registryUrl = 'http://apicurio.52.158.160.62.nip.io';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Apicurio Registry
            </CardTitle>
            <CardDescription>
              Schema registry for data source specifications
            </CardDescription>
          </div>
          <a
            href={`${registryUrl}/ui`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Open Registry UI
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Registry Endpoints:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {registryUrl}/apis/registry/v2
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Group Mappings:</p>
            <div className="space-y-2">
              {Object.entries(mappings).map(([dataSource, groupId]) => (
                <div
                  key={dataSource}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium">{dataSource}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {groupId}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Naming convention: <code className="bg-muted px-1 py-0.5 rounded">{'{organization}.{domain}.{application}'}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Example: <code className="bg-muted px-1 py-0.5 rounded">paradigm.mybldr.bidtools</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
