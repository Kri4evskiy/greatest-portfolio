'use client'

import { type ColumnDef, flexRender, getCoreRowModel, type RowData, useReactTable } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}

interface ObservabilityDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  emptyState: string
  getRowId?: (row: TData) => string
  getRowClassName?: (row: TData) => string
  minTableWidthClass?: string
  isDimmed?: boolean
  tableTestId?: string
}

/**
 * Isolated TanStack Table v8 boundary:
 * `useReactTable` returns a stable object reference with interior mutability,
 * which `babel-plugin-react-compiler` marks as `knownIncompatible`.
 * Isolating it here with `'use no memo'` keeps parent dashboard cards fully
 * compiled by React Compiler while unifying table rendering across modules.
 */
export function ObservabilityDataTable<TData>({
  data,
  columns,
  emptyState,
  getRowId,
  getRowClassName,
  minTableWidthClass = 'min-w-[560px]',
  isDimmed = false,
  tableTestId,
}: ObservabilityDataTableProps<TData>) {
  'use no memo'

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-border/80 transition-opacity ${
        isDimmed ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <table data-testid={tableTestId} className={`w-full ${minTableWidthClass} border-collapse text-left text-xs`}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-border/70 bg-surface-subtle font-mono text-[11px] text-muted-foreground"
            >
              {headerGroup.headers.map((header) => {
                const headerClassName = header.column.columnDef.meta?.headerClassName
                return (
                  <th key={header.id} className={headerClassName ?? 'px-3 py-2.5 font-medium'}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border/60">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  getRowClassName
                    ? getRowClassName(row.original)
                    : 'bg-background transition-colors hover:bg-surface-subtle/60'
                }
              >
                {row.getVisibleCells().map((cell) => {
                  const cellClassName = cell.column.columnDef.meta?.cellClassName
                  return (
                    <td key={cell.id} className={cellClassName ?? 'px-3 py-2.5 align-top'}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-xs text-muted-foreground">
                {emptyState}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
