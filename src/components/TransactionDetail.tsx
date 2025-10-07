import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Transaction } from '../lib/api';

interface TransactionDetailProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetail({ transaction, open, onOpenChange }: TransactionDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{transaction.TransactionName}</DialogTitle>
          <DialogDescription>
            Transaction ID: {transaction.TransactionId}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request JSON</TabsTrigger>
            <TabsTrigger value="response">Response JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="mt-4">
            <Card className="p-4">
              <ScrollArea className="h-[400px] w-full">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  <code>
                    {JSON.stringify(transaction.RequestJSON, null, 2) || 'No request data'}
                  </code>
                </pre>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="mt-4">
            <Card className="p-4">
              <ScrollArea className="h-[400px] w-full">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  <code>
                    {JSON.stringify(transaction.ResponseJSON, null, 2) || 'No response data'}
                  </code>
                </pre>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Metadata */}
        {(transaction.CreateTime || transaction._etag) && (
          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            {transaction.CreateTime && (
              <div>Created: {new Date(transaction.CreateTime).toLocaleString()}</div>
            )}
            {transaction._etag && (
              <div className="font-mono">ETag: {transaction._etag}</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}