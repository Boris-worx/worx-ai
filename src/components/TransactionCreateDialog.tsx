import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Info, AlertCircle } from 'lucide-react';
import { TRANSACTION_TYPES, formatTransactionType } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface TransactionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (txnType: string, txnData: any) => Promise<void>;
  defaultTxnType?: string; // If provided, locks to this type
}

export function TransactionCreateDialog({ open, onOpenChange, onSubmit, defaultTxnType }: TransactionCreateDialogProps) {
  const [txnType, setTxnType] = useState<string>(defaultTxnType || TRANSACTION_TYPES[0]);
  const [jsonText, setJsonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string>('');

  // Update txnType when defaultTxnType changes or dialog opens
  useEffect(() => {
    if (open) {
      setTxnType(defaultTxnType || TRANSACTION_TYPES[0]);
      // Set default JSON template
      setJsonText(getDefaultTemplate(defaultTxnType || TRANSACTION_TYPES[0]));
      setJsonError('');
    }
  }, [open, defaultTxnType]);

  // Get default JSON template based on transaction type
  const getDefaultTemplate = (type: string): string => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const templates: Record<string, any> = {
      Customer: {
        CustomerId: 'CUST' + Date.now(),
        Name: 'Example Company Inc',
        BillAcctId: null,
        InvoiceAcctId: null,
        CustomerType: null,
        AccountType: null,
        SortedName: null,
        Address: {
          Street: '123 Main Street',
          City: 'New York',
          State: 'NY',
          Zip: '10001',
          Country: 'USA'
        },
        Phone1: '+1-555-0123',
        Phone2: null,
        Status: 'Active',
        PortalEnabled: null,
        IsPayInAdvance: null,
        InvoiceMethod: null,
        InvoiceMethodDesc: null,
        StatementMethod: null,
        StatementMethodDesc: null,
        Location: null,
        CreditLocation: null,
        Market: null,
        IsTaxable: null,
        TaxCode: null,
        TaxStatus: null,
        UseContractLimit: null,
        ConvertPricing: null,
        RequirePO: null,
        RequireBuyer: null,
        RequireValidJob: null,
        RequireCostCode: null,
        RequireSignature: null,
        AllowAddJob: null,
        AllowBackOrder: null,
        AllowPromoPricing: null,
        AllowEmployeePricing: null,
        AllowRetailDiscountPricing: null,
        PricingMethod: null,
        IsInCityLimits: null,
        HasChameleonSalesperson: null,
        Salespeople: null,
        ChameleonSalespeople: null,
        CostCodes: null,
        Buyers: null,
        Contracts: null,
        Tags: null,
        Notes: null,
        Preferences: null,
        Metadata: null,
        AdditionalData: null,
        Loyalty: null,
        Orders: null,
        PaymentMethods: null,
        CustomFields: null,
        AuditTrail: null,
        Relationships: null,
        Attachments: null,
        SourceId: null,
        SourceCreateTime: null,
        SourceUpdateTime: null,
        SourceETag: null,
        SourceSeqId: null
      },
      Location: {
        LocationId: 'LOC' + Date.now(),
        Name: 'Main Warehouse',
        Address: {
          Street: '456 Industrial Blvd',
          City: 'Chicago',
          State: 'IL',
          Zip: '60601',
          Country: 'USA'
        },
        Phone1: '+1-555-0456',
        Phone2: null,
        Status: 'Active',
        Notes: null,
        SourceId: null,
        SourceCreateTime: null,
        SourceUpdateTime: null,
        SourceETag: null,
        SourceSeqId: null
      },
      Quote: {
        quoteId: 'QUOTE-' + Date.now(),
        customerId: null,
        customerRequestedByDate: nextMonth + 'T00:00:00.000Z',
        exportNotes: 'Quote notes',
        categories: [
          {
            categoryId: '35',
            name: null,
            description: null
          },
          {
            categoryId: '37',
            name: null,
            description: null
          }
        ],
        accountNumber: '',
        erpUserId: 'ONLINE',
        isPublished: false
      },
      QuoteDetails: {
        quoteDetailId: 'QD-' + Date.now(),
        quoteId: null,
        lineNumber: 1,
        itemId: null,
        itemDescription: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        totalPrice: 0,
        notes: null
      },
      QuotePack: {
        quotePackId: 'QP-' + Date.now(),
        quoteId: null,
        packName: '',
        packDescription: '',
        totalAmount: 0,
        quoteDetails: [],
        isActive: true
      },
      QuotePackOrder: {
        quotePackOrderId: 'QPO-' + Date.now(),
        quotePackId: null,
        orderId: null,
        orderDate: today + 'T00:00:00.000Z',
        customerId: null,
        totalAmount: 0,
        status: 'pending',
        notes: null
      },
      ReasonCode: {
        reasonCodeId: 'RC-' + Date.now(),
        code: '',
        description: '',
        category: '',
        isActive: true
      }
    };

    // If type not found, return generic template
    const template = templates[type] || {
      Id: type + '-' + Date.now(),
      Name: '',
      Status: 'Active',
      Description: '',
      CreatedDate: today
    };

    return JSON.stringify(template, null, 2);
  };

  // Validate JSON
  const validateJson = (text: string): boolean => {
    if (!text.trim()) {
      setJsonError('JSON data is required');
      return false;
    }

    try {
      JSON.parse(text);
      setJsonError('');
      return true;
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`);
      return false;
    }
  };

  // Handle transaction type change
  const handleTypeChange = (newType: string) => {
    setTxnType(newType);
    // Update template when type changes
    if (!jsonText.trim() || jsonText === getDefaultTemplate(txnType)) {
      setJsonText(getDefaultTemplate(newType));
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateJson(jsonText)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const txnData = JSON.parse(jsonText);
      
      console.log('📤 Creating transaction:', { txnType, txnData });
      
      await onSubmit(txnType, txnData);
      
      // Reset form and close dialog
      setJsonText(getDefaultTemplate(txnType));
      setJsonError('');
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('❌ Create error:', error);
      toast.error(`Failed to create transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setJsonText(getDefaultTemplate(txnType));
    setJsonError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {defaultTxnType ? `Create ${defaultTxnType} Transaction` : 'Create New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {defaultTxnType 
              ? `Add a new ${defaultTxnType} transaction to the data plane` 
              : 'Add a new transaction to the data plane'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
          {/* Transaction Type */}
          {!defaultTxnType ? (
            <div className="space-y-2">
              <Label htmlFor="txnType">Transaction Type *</Label>
              <Select value={txnType} onValueChange={handleTypeChange}>
                <SelectTrigger id="txnType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTransactionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Creating transaction for type: <strong>{txnType}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* JSON Data */}
          <div className="space-y-2">
            <Label htmlFor="jsonData">Transaction Data (JSON) *</Label>
            <Textarea
              id="jsonData"
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError('');
              }}
              onBlur={() => validateJson(jsonText)}
              placeholder="Enter transaction data as JSON..."
              className="font-mono text-sm min-h-[300px] max-h-[400px] resize-y whitespace-pre overflow-x-auto"
            />
            {jsonError && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}
          </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!jsonError}
            className="bg-[#1D6BCD] hover:bg-[#1557A8]"
          >
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
