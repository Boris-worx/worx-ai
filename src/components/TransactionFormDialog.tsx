import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Info, FileJson } from 'lucide-react';
import { TRANSACTION_TYPES } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (txnType: string, txnData: any) => Promise<void>;
  defaultTxnType?: string; // If provided, locks to this type (no dropdown)
}

export function TransactionFormDialog({ open, onOpenChange, onSubmit, defaultTxnType }: TransactionFormDialogProps) {
  // If defaultTxnType provided, use it. Otherwise default to first type
  const [txnType, setTxnType] = useState<string>(defaultTxnType || TRANSACTION_TYPES[0] || '');
  const [isUploading, setIsUploading] = useState(false);

  // Update txnType when defaultTxnType changes or dialog opens
  useEffect(() => {
    if (open) {
      setTxnType(defaultTxnType || TRANSACTION_TYPES[0] || '');
    }
  }, [open, defaultTxnType]);

  // Handle file upload and submit
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!txnType) {
      toast.error('Transaction type not set');
      event.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const txnData = JSON.parse(text);
        
        console.log('📤 Uploading transaction:', { txnType, txnData });
        
        // Submit to server
        await onSubmit(txnType, txnData);
        
        // Close dialog on success
        onOpenChange(false);
        
        // Reset file input
        event.target.value = '';
        
      } catch (error: any) {
        console.error('❌ Upload error:', error);
        if (error.message?.includes('JSON')) {
          toast.error('Invalid JSON file. Please check the file format.');
        } else {
          toast.error(`Upload failed: ${error.message}`);
        }
        event.target.value = ''; // Reset input on error
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsUploading(false);
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {defaultTxnType ? `Create ${defaultTxnType} Transaction` : 'Create New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {defaultTxnType 
              ? `Upload a JSON file with ${defaultTxnType} data` 
              : 'Select transaction type and upload JSON file'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Type - only show dropdown if no default provided */}
          {!defaultTxnType ? (
            <div className="space-y-2">
              <Label>Transaction Type *</Label>
              <Select key={txnType} value={txnType} onValueChange={setTxnType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="bg-[#ffffff] border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Creating transaction for:</div>
              <div className="text-lg font-medium">{txnType}</div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Upload a JSON file containing the transaction data. 
              The transaction will be created immediately upon file selection.
            </AlertDescription>
          </Alert>

          {/* Upload Button */}
          <div className="space-y-3">
            <Button
              className="w-full h-32 border-2 border-dashed border-[#D8D9DA] bg-white dark:bg-card hover:bg-white dark:hover:bg-card hover:border-[#636769]"
              variant="outline"
              disabled={!txnType || isUploading}
              onClick={() => document.getElementById('json-upload')?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <>
                    <FileJson className="h-10 w-10 text-[#1D6BCD]" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileJson className="h-10 w-10 text-[#1D6BCD]" />
                    <div className="text-sm">
                      <span className="text-[#1D6BCD] underline">Link</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {txnType ? 'JSON (max. 5MB)' : 'Select type first'}
                    </span>
                  </>
                )}
              </div>
            </Button>
            <input
              id="json-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!txnType || isUploading}
            />
          </div>

          {/* Example JSON Format */}
          {txnType === 'Customer' && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Example JSON format:</Label>
              <div className="bg-[#ffffff] border rounded-lg p-3">
                <pre className="text-xs overflow-auto">
{`{
  "CustomerId": "CUST123",
  "Name": "Company Name",
  "Address": {
    "Street": "123 Main St",
    "City": "Springfield",
    "State": "IL",
    "Zip": "62701"
  },
  "Status": "Active"
}`}
                </pre>
              </div>
            </div>
          )}

          {txnType && txnType !== 'Customer' && (
            <p className="text-xs text-muted-foreground text-center">
              Upload a JSON file with {txnType} transaction data
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}