import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Info, Save } from 'lucide-react';
import { Transaction } from '../lib/api';

interface TransactionEditDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (txnId: string, txnType: string, txnData: any, etag: string) => Promise<void>;
}

export function TransactionEditDialog({ transaction, open, onOpenChange, onSubmit }: TransactionEditDialogProps) {
  const [txnDataJson, setTxnDataJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load transaction data when dialog opens
  useEffect(() => {
    if (open && transaction) {
      setTxnDataJson(JSON.stringify(transaction.Txn, null, 2));
      setJsonError('');
    }
  }, [open, transaction]);

  // Validate JSON on change
  const handleJsonChange = (value: string) => {
    setTxnDataJson(value);
    
    try {
      JSON.parse(value);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON');
    }
  };

  // Validate and submit
  const handleSubmit = async () => {
    try {
      const txnData = JSON.parse(txnDataJson);
      setJsonError('');
      
      if (!transaction._etag) {
        throw new Error('Transaction ETag is missing');
      }
      
      setIsSubmitting(true);
      await onSubmit(transaction.TxnId!, transaction.TxnType, txnData, transaction._etag);
      
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('JSON')) {
        setJsonError('Invalid JSON syntax');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {transaction.TxnType} Transaction</DialogTitle>
          <DialogDescription>
            Modify transaction data in JSON format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
          {/* Transaction Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-xs space-y-1">
                <div><strong>ID:</strong> {transaction.TxnId}</div>
                <div><strong>Type:</strong> {transaction.TxnType}</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Transaction Data (JSON) */}
          <div className="space-y-2">
            <Label>Transaction Data (JSON) *</Label>
            <Textarea
              value={txnDataJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder='{\n  "field1": "value1",\n  "field2": "value2"\n}'
              className="font-mono text-xs h-[300px] resize-none"
            />
            {jsonError && (
              <p className="text-sm text-destructive">{jsonError}</p>
            )}
          </div>

          {/* API Request Preview */}
          {!jsonError && txnDataJson.trim() && (
            <div className="space-y-2">
              <Label>API Request Preview</Label>
              <div className="bg-muted rounded-lg p-4 max-h-[200px] overflow-auto">
                <pre className="text-xs">
{`PUT /1.0/txns/${transaction.TxnId}
If-Match: ${transaction._etag}
Content-Type: application/json

{
  "TxnType": "${transaction.TxnType}",
  "Txn": ${txnDataJson}
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!txnDataJson.trim() || !!jsonError || isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}