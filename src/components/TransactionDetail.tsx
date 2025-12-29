import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Transaction, formatTransactionType } from '../lib/api';

interface TransactionDetailProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetail({ transaction, open, onOpenChange }: TransactionDetailProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Transaction Detail
            <Badge variant="secondary">{formatTransactionType(transaction.TxnType)}</Badge>
          </DialogTitle>
          <DialogDescription>
            View transaction details and data
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-6">
            {/* Metadata - Always Visible */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Transaction ID</div>
                    <code className="text-xs bg-[#ffffff] border px-2 py-1 rounded block">
                      {transaction.TxnId || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Type</div>
                    <Badge variant="outline">{formatTransactionType(transaction.TxnType)}</Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Created</div>
                    <div>{formatDate(transaction.CreateTime)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Updated</div>
                    <div>{formatDate(transaction.UpdateTime)}</div>
                  </div>
                </div>

                {transaction._etag && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">ETag</div>
                      <code className="text-xs bg-[#ffffff] border px-2 py-1 rounded block break-all">
                        {transaction._etag}
                      </code>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Accordion for Collapsible Sections */}
            <Accordion type="multiple" defaultValue={['txn-data']} className="w-full space-y-2">
              {/* Transaction Data (Txn) */}
              <AccordionItem value="txn-data" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="font-medium">Transaction Data (Txn)</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="bg-[#ffffff] border rounded-lg p-4 overflow-x-auto">
                    <pre className="text-[11px] font-mono leading-relaxed whitespace-pre">
                      {JSON.stringify(transaction.Txn, null, 2)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Raw API Response */}
              <AccordionItem value="raw-response" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="font-medium">Raw API Response</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="bg-[#ffffff] border rounded-lg p-4 overflow-x-auto">
                    <pre className="text-[11px] font-mono leading-relaxed whitespace-pre">
                      {JSON.stringify(transaction, null, 2)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* API Usage Examples */}
              <AccordionItem value="api-examples" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="font-medium">API Usage Examples</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">GET Request:</div>
                      <div className="bg-[#ffffff] border rounded-lg p-3">
                        <code className="text-[11px] font-mono">
                          GET /1.0/txns?TxnType={transaction.TxnType}
                        </code>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">POST Request:</div>
                      <div className="bg-[#ffffff] border rounded-lg p-3 overflow-x-auto">
                        <pre className="text-[11px] font-mono leading-relaxed whitespace-pre">
{`POST /1.0/txns
Content-Type: application/json

{
  "TxnType": "${transaction.TxnType}",
  "Txn": ${JSON.stringify(transaction.Txn, null, 2).split('\n').join('\n  ')}
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}