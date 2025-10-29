import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tenant } from '../lib/api';

interface TenantSelectorProps {
  tenants: Tenant[];
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
  isSuperUser: boolean;
  userTenantId?: string;
}

export function TenantSelector({ 
  tenants, 
  activeTenantId, 
  onTenantChange, 
  isSuperUser,
  userTenantId 
}: TenantSelectorProps) {
  // Find active tenant
  const activeTenant = tenants.find(t => t.TenantId === activeTenantId);
  const activeTenantName = activeTenantId === 'global' 
    ? 'Global Tenant' 
    : activeTenant?.TenantName || 'Unknown';

  // If user is not a SuperUser, show their tenant as read-only
  if (!isSuperUser) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded border border-input flex-1 sm:flex-none sm:w-auto min-w-[180px]">
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate">{activeTenantName}</span>
      </div>
    );
  }

  // SuperUser can select tenant
  return (
    <Select value={activeTenantId} onValueChange={onTenantChange}>
      <SelectTrigger className="rounded px-4 py-2 flex-1 sm:flex-none sm:w-[200px] h-auto">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <SelectValue>
            <span className="truncate">{activeTenantName}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Global Tenant</span>
              <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
            </div>
          </SelectItem>
          {tenants.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Supplier Tenants
              </div>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.TenantId} value={tenant.TenantId}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate max-w-[200px]" title={tenant.TenantName}>
                      {tenant.TenantName}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
    </Select>
  );
}
