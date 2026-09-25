import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  pageSize?: number;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyField, 
  emptyMessage = "No data available",
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
  pageSize = 10
}: DataTableProps<T>) {
  
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

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

  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(String(row[keyField])));
  const someSelected = paginatedData.some(row => selectedIds.has(String(row[keyField])));

  return (
    <div className="flex flex-col rounded-xl border border-border bg-base">
      <div className="overflow-x-auto">
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
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={enableSelection ? columns.length + 1 : columns.length} className="px-6 py-8 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
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
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/30">
          <div className="text-sm text-text-muted">
            Showing {data.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, data.length)} of {data.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show windows of pages
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm transition-colors ${currentPage === pageNum ? 'bg-primary text-white' : 'hover:bg-surface'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
    </div>
  );
}
