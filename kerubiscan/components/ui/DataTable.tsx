import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  enableSelection?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyField, 
  emptyMessage = "No data available",
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange
}: DataTableProps<T>) {
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      const allIds = new Set(data.map(row => String(row[keyField])));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = data.length > 0 && data.every(row => selectedIds.has(String(row[keyField])));
  const someSelected = data.some(row => selectedIds.has(String(row[keyField])));

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-base">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface/50 border-b border-border">
          <tr>
            {enableSelection && (
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-border bg-surface text-primary focus:ring-primary/50"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((col, i) => (
              <th key={i} className={`px-6 py-4 font-semibold text-text-muted ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={enableSelection ? columns.length + 1 : columns.length} className="px-6 py-8 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const rowKey = String(row[keyField]) || i.toString();
              const isSelected = selectedIds.has(rowKey);
              
              return (
                <tr key={rowKey} className={`hover:bg-surface/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                  {enableSelection && (
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-border bg-surface text-primary focus:ring-primary/50"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowKey, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((col, j) => (
                    <td key={j} className={`px-6 py-4 text-white ${col.className || ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(row) 
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
