import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Table, Tbody, Td, Th, Thead, Tr } from "./table";
import { EmptyState } from "./empty-state";
import { TableSkeleton } from "../patterns/loading";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  toolbar?: ReactNode;
  /** Enable row checkboxes for bulk actions. */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  /** Row density class (from DensityToggle helpers). */
  densityClassName?: string;
};

/**
 * Lightweight data table pattern (no tanstack-table dep yet).
 * Refs: Studio datatable-component — harvest IA only.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  emptyTitle = "No rows",
  emptyDescription,
  className,
  toolbar,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  densityClassName,
}: DataTableProps<T>) {
  const allIds = rows.map(getRowId);
  const allSelected =
    selectable && allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  function toggleAll() {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(allSelected ? [] : allIds);
  }

  function toggleOne(id: string) {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}
      {loading ? (
        <TableSkeleton rows={5} columns={Math.max(columns.length, 3)} />
      ) : rows.length === 0 ? (
        <EmptyState>
          <strong className="block text-[var(--foreground)]">{emptyTitle}</strong>
          {emptyDescription ? (
            <span className="mt-1 block">{emptyDescription}</span>
          ) : null}
        </EmptyState>
      ) : (
        <Table className={densityClassName}>
          <Thead>
            <Tr>
              {selectable ? (
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </Th>
              ) : null}
              {columns.map((col) => (
                <Th key={col.id} className={col.className}>
                  {col.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              return (
                <Tr key={id}>
                  {selectable ? (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleOne(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </Td>
                  ) : null}
                  {columns.map((col) => (
                    <Td key={col.id} className={col.className}>
                      {col.cell(row)}
                    </Td>
                  ))}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
