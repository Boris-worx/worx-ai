import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Separator } from './ui/separator';
import { FilterIcon } from './icons/FilterIcon';
import { Badge } from './ui/badge';
import { RotateCcw, Check, Eraser } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  locked?: boolean; // For columns that can't be disabled (like ID)
  isEmpty?: boolean; // For columns that have no data
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  availableFields?: string[]; // All available fields from data
  onReset?: () => void; // Callback to reset to default columns
  emptyColumns?: string[]; // List of column keys that are empty
}

export function ColumnSelector({ columns, onColumnsChange, availableFields = [], onReset, emptyColumns = [] }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>(columns);
  const [hasChanges, setHasChanges] = useState(false);

  // Update temp columns when columns prop changes (e.g., when switching transaction types)
  useEffect(() => {
    setTempColumns(columns);
    setHasChanges(false);
  }, [columns]);

  const enabledCount = useMemo(() => {
    // Count only enabled columns that are not empty (will actually be displayed)
    return columns.filter(col => col.enabled && (col.locked || !col.isEmpty)).length;
  }, [columns]);

  const tempEnabledCount = useMemo(() => {
    // Count only enabled columns that are not empty (will actually be displayed)
    return tempColumns.filter(col => col.enabled && (col.locked || !col.isEmpty)).length;
  }, [tempColumns]);

  // Count only visible columns (not empty)
  const visibleColumnsCount = useMemo(() => {
    return tempColumns.filter(col => !col.isEmpty).length;
  }, [tempColumns]);

  const handleToggle = (key: string) => {
    const updated = tempColumns.map(col => {
      if (col.key === key && !col.locked && !col.isEmpty) {
        return { ...col, enabled: !col.enabled };
      }
      return col;
    });
    setTempColumns(updated);
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const updated = tempColumns.map(col => {
      // Don't enable empty columns
      if (col.isEmpty) return col;
      return { ...col, enabled: true };
    });
    setTempColumns(updated);
    setHasChanges(true);
  };

  const handleDeselectAll = () => {
    const updated = tempColumns.map(col => {
      if (col.locked) return col;
      return { ...col, enabled: false };
    });
    setTempColumns(updated);
    setHasChanges(true);
  };

  const handleApply = () => {
    onColumnsChange(tempColumns);
    setHasChanges(false);
    setOpen(false);
    toast.success(`Column settings saved (${tempEnabledCount} columns selected)`);
  };

  const handleCancel = () => {
    setTempColumns(columns);
    setHasChanges(false);
    setOpen(false);
  };

  // Group columns by category (use tempColumns for UI)
  // Filter out columns with no data
  const coreColumns = tempColumns.filter(col => 
    ['TxnId', 'Name', 'CreateTime'].includes(col.key) && !col.isEmpty
  );
  
  const otherColumns = tempColumns.filter(col => 
    !['TxnId', 'Name', 'CreateTime'].includes(col.key) && !col.isEmpty
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
          <span className="hidden sm:inline"></span>
          <Badge variant="secondary" className="ml-1">
            {enabledCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 max-h-[min(600px,80vh)] flex flex-col" align="end">
        <div className="p-3 border-b flex-shrink-0">
          <h4 className="font-medium mb-0.5">Customize Columns</h4>
          <p className="text-xs text-muted-foreground">
            {tempEnabledCount} of {visibleColumnsCount} columns selected
          </p>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="p-2">
            {/* Core Columns */}
            {coreColumns.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
                  Core Fields
                </div>
                <div className="space-y-1.5">
                  {coreColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={column.enabled}
                        onCheckedChange={() => handleToggle(column.key)}
                        disabled={column.locked || column.isEmpty}
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
                <Separator className="my-2.5" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
                    Additional Fields
                  </div>
                  <div className="space-y-1.5">
                    {otherColumns.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`column-${column.key}`}
                          checked={column.enabled}
                          onCheckedChange={() => handleToggle(column.key)}
                          disabled={column.locked || column.isEmpty}
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
        </div>

        {/* Control buttons */}
        <div className="p-2 border-t bg-muted/50 flex-shrink-0">
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
              className="h-8 px-3"
              title="Clear selection"
            >
              <Eraser className="h-3.5 w-3.5" />
            </Button>
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReset();
                  setHasChanges(false);
                  setOpen(false);
                }}
                className="h-8 px-3"
                title="Reset to Default"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Apply/Cancel buttons */}
        <div className="p-2 border-t bg-background space-y-1.5 flex-shrink-0">
          <Button
            onClick={handleApply}
            className="w-full gap-2"
            disabled={!hasChanges}
          >
            <Check className="h-4 w-4" />
            Apply ({tempEnabledCount} columns)
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
