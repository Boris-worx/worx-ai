import { X, Building2, Database, Receipt, Briefcase, FileCode, Calendar, Tag, User, CheckCircle, XCircle, Table } from 'lucide-react';
import { SearchResult } from './GlobalSearch';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface GlobalSearchDetailProps {
  item: SearchResult;
  onClose: () => void;
}

export function GlobalSearchDetail({ item, onClose }: GlobalSearchDetailProps) {
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'tenant':
        return <Building2 className="h-6 w-6" />;
      case 'datasource':
        return <Database className="h-6 w-6" />;
      case 'transaction':
        return <Receipt className="h-6 w-6" />;
      case 'application':
        return <Briefcase className="h-6 w-6" />;
      case 'model':
        return <FileCode className="h-6 w-6" />;
      case 'dataplane':
        return <Table className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'tenant':
        return 'Tenant';
      case 'datasource':
        return 'Data Source';
      case 'transaction':
        return 'Transaction';
      case 'application':
        return 'Application';
      case 'model':
        return 'Model Schema';
      case 'dataplane':
        return 'Data Plane';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const renderDetailContent = () => {
    switch (item.type) {
      case 'tenant':
        return (
          <div className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Tenant ID" value={item.data.TenantId} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Tenant Name" value={item.data.TenantName} />
            {item.data.Description && (
              <DetailRow icon={<FileCode className="h-4 w-4" />} label="Description" value={item.data.Description} />
            )}
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(item.data.CreateTime)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDate(item.data.UpdateTime)} />
          </div>
        );

      case 'datasource':
        return (
          <div className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Datasource ID" value={item.data.DatasourceId} />
            <DetailRow icon={<Database className="h-4 w-4" />} label="Datasource Name" value={item.data.DatasourceName} />
            <DetailRow icon={<FileCode className="h-4 w-4" />} label="Type" value={item.data.DatasourceType} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Tenant ID" value={item.data.TenantId} />
            {item.data.Description && (
              <DetailRow icon={<FileCode className="h-4 w-4" />} label="Description" value={item.data.Description} />
            )}
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(item.data.CreateTime)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDate(item.data.UpdateTime)} />
          </div>
        );

      case 'transaction':
        const txnData = item.data.Txn as any;
        return (
          <div className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Transaction ID" value={item.data.TxnId} />
            <DetailRow icon={<Receipt className="h-4 w-4" />} label="Type" value={item.data.TxnType} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(item.data.CreateTime)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDate(item.data.UpdateTime)} />
            
            {/* Transaction Data */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Transaction Data</div>
              <div className="space-y-3">
                {Object.entries(txnData).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )
                      ) : typeof value === 'object' ? (
                        JSON.stringify(value, null, 2)
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'application':
        return (
          <div className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Application ID" value={item.data.id} />
            <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Application Name" value={item.data.ApplicationName} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Tenant ID" value={item.data.TenantId} />
            {item.data.Description && (
              <DetailRow icon={<FileCode className="h-4 w-4" />} label="Description" value={item.data.Description} />
            )}
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Version" value={item.data.Version} />
            <div className="flex items-center gap-3 py-2">
              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={item.data.Status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800'}>
                {item.data.Status}
              </Badge>
            </div>
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(item.data.CreateTime)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDate(item.data.UpdateTime)} />
          </div>
        );

      case 'model':
        return (
          <div className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Model ID" value={item.data.id} />
            <DetailRow icon={<FileCode className="h-4 w-4" />} label="Model Name" value={item.data.ModelName} />
            <DetailRow icon={<Receipt className="h-4 w-4" />} label="Transaction Type" value={item.data.TransactionType} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Tenant ID" value={item.data.TenantId} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(item.data.CreateTime)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDate(item.data.UpdateTime)} />
            
            {/* Schema */}
            {item.data.Schema && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Schema</div>
                <pre className="bg-gray-50 dark:bg-gray-800 p-3 overflow-x-auto text-xs font-mono border border-gray-200 dark:border-gray-700">
                  {JSON.stringify(item.data.Schema, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );

      case 'dataplane':
        return (
          <div className="space-y-4">
            {item.dataPlaneType && (
              <DetailRow icon={<Table className="h-4 w-4" />} label="Data Type" value={item.dataPlaneType} />
            )}
            
            {/* All Data Fields */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Data Fields</div>
              <div className="space-y-3">
                {Object.entries(item.data).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )
                      ) : typeof value === 'object' && value !== null ? (
                        <pre className="bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value || 'N/A')
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[rgb(101,121,255)] text-white px-6 py-4 flex items-center justify-between border-b-0 z-10">
          <div className="flex items-center gap-3">
            {getIcon(item.type)}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {getTypeLabel(item.type)}
              </div>
              <div className="font-bold text-lg">{item.title}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderDetailContent()}
        </div>
      </div>
    </>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2 min-w-[120px]">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 flex-1 break-words">
        {value}
      </div>
    </div>
  );
}