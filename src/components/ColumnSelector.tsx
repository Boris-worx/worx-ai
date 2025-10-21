import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { FilterIcon } from './icons/FilterIcon';
import { Badge } from './ui/badge';
import { RotateCcw } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  locked?: boolean; // For columns that can't be disabled (like ID)
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  availableFields?: string[]; // All available fields from data
  onReset?: () => void; // Callback to reset to default columns
}

export function ColumnSelector({ columns, onColumnsChange, availableFields = [], onReset }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);

  const enabledCount = useMemo(() => {
    return columns.filter(col => col.enabled).length;
  }, [columns]);

  const handleToggle = (key: string) => {
    const updated = columns.map(col => {
      if (col.key === key && !col.locked) {
        return { ...col, enabled: !col.enabled };
      }
      return col;
    });
    onColumnsChange(updated);
  };

  const handleSelectAll = () => {
    const updated = columns.map(col => ({ ...col, enabled: true }));
    onColumnsChange(updated);
  };

  const handleDeselectAll = () => {
    const updated = columns.map(col => {
      if (col.locked) return col;
      return { ...col, enabled: false };
    });
    onColumnsChange(updated);
  };

  // Group columns by category
  const coreColumns = columns.filter(col => 
    ['TxnId', 'Name', 'CreateTime'].includes(col.key)
  );
  
  const otherColumns = columns.filter(col => 
    !['TxnId', 'Name', 'CreateTime'].includes(col.key)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <FilterIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Columns</span>
          <Badge variant="secondary" className="ml-1">
            {enabledCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium mb-1">Customize Columns</h4>
          <p className="text-xs text-muted-foreground">
            {enabledCount} of {columns.length} columns selected
          </p>
        </div>

        <div className="p-3 border-b bg-muted/50 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 h-8"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1 h-8"
            >
              Clear
            </Button>
          </div>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="w-full h-8 gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Default
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          <div className="p-3">
            {/* Core Columns */}
            {coreColumns.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  Core Fields
                </div>
                <div className="space-y-2">
                  {coreColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={column.enabled}
                        onCheckedChange={() => handleToggle(column.key)}
                        disabled={column.locked}
                      />
                      <Label
                        htmlFor={`column-${column.key}`}
                        className={`flex-1 text-sm cursor-pointer ${
                          column.locked ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {column.label}
                        {column.locked && (
                          <span className="ml-2 text-xs text-muted-foreground">(required)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Columns */}
            {otherColumns.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Additional Fields
                  </div>
                  <div className="space-y-2">
                    {otherColumns.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`column-${column.key}`}
                          checked={column.enabled}
                          onCheckedChange={() => handleToggle(column.key)}
                          disabled={column.locked}
                        />
                        <Label
                          htmlFor={`column-${column.key}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          {column.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {availableFields.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {availableFields.length} field(s) available in data
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
