import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Upload, X, FileJson } from 'lucide-react';
import { createTransaction, Transaction } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (transaction: Transaction) => void;
}

export function TransactionForm({ open, onOpenChange, onSuccess }: TransactionFormProps) {
  const [transactionName, setTransactionName] = useState('');
  const [requestJSON, setRequestJSON] = useState<any>(null);
  const [responseJSON, setResponseJSON] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const requestFileRef = useRef<HTMLInputElement>(null);
  const responseFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    file: File | undefined,
    setter: (value: any) => void,
    type: 'request' | 'response'
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setter(json);
        toast.success(`${type === 'request' ? 'Request' : 'Response'} JSON loaded successfully`);
      } catch (error) {
        toast.error(`Invalid JSON file for ${type}`);
        console.error('JSON parse error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    // Validation
    if (!transactionName.trim()) {
      toast.error('Please enter a transaction name');
      return;
    }

    if (!requestJSON) {
      toast.error('Please upload Request JSON file');
      return;
    }

    if (!responseJSON) {
      toast.error('Please upload Response JSON file');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTransaction = await createTransaction(
        transactionName,
        requestJSON,
        responseJSON
      );
      toast.success(`Transaction "${newTransaction.TransactionName}" created successfully`);
      onSuccess(newTransaction);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTransactionName('');
    setRequestJSON(null);
    setResponseJSON(null);
    if (requestFileRef.current) requestFileRef.current.value = '';
    if (responseFileRef.current) responseFileRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[500px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter transaction details and upload JSON files for request and response schemas
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Transaction Name */}
          <div className="grid gap-2">
            <Label htmlFor="transactionName">Transaction Name</Label>
            <Input
              id="transactionName"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
              placeholder="e.g., Customer, Invoice, Payment"
            />
          </div>

          {/* Request JSON Upload */}
          <div className="grid gap-2">
            <Label>API Request JSON</Label>
            <Card className="p-4 border-dashed">
              {!requestJSON ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileJson className="h-10 w-10 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload JSON file containing the API request structure
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Request JSON
                  </Button>
                  <input
                    ref={requestFileRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], setRequestJSON, 'request')}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Request JSON loaded</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRequestJSON(null);
                        if (requestFileRef.current) requestFileRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
                    {JSON.stringify(requestJSON, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>

          {/* Response JSON Upload */}
          <div className="grid gap-2">
            <Label>Transaction Response JSON</Label>
            <Card className="p-4 border-dashed">
              {!responseJSON ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileJson className="h-10 w-10 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload JSON file containing the transaction response structure
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => responseFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Response JSON
                  </Button>
                  <input
                    ref={responseFileRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], setResponseJSON, 'response')}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Response JSON loaded</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResponseJSON(null);
                        if (responseFileRef.current) responseFileRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
                    {JSON.stringify(responseJSON, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}