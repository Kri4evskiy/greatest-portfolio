'use client'

import { type ColumnDef, metaHelper, type RowData, tableFeatures, useTable } from '@tanstack/react-table'

export interface ObservabilityColumnMeta {
  headerClassName?: string
  cellClassName?: string
}

/**
 * Tree-shaken TanStack Table v9 feature set for server-paginated observability tables:
 * registers zero client-side sorting/filtering/pagination bundles and scopes
 * `ColumnMeta` typing strictly to this table via `metaHelper`.
 */
export const observabilityTableFeatures = tableFeatures({
  columnMeta: metaHelper<ObservabilityColumnMeta>(),
})

export type ObservabilityTableFeatures = typeof observabilityTableFeatures
export type ObservabilityColumnDef<TData extends RowData> = ColumnDef<ObservabilityTableFeatures, TData>

interface ObservabilityDataTableProps<TData extends RowData> {
  data: readonly TData[]
  columns: ObservabilityColumnDef<TData>[]
  emptyState: string
  getRowId?: (row: TData) => string
  getRowClassName?: (row: TData) => string
  minTableWidthClass?: string
  isDimmed?: boolean
  tableTestId?: string
}

/**
 * Isolated TanStack Table v9 boundary:
 * `useTable` returns a stable table object backed by TanStack Store atoms.
 * Isolating it here with `'use no memo'` keeps parent dashboard cards fully
 * compiled by React Compiler while ensuring `table.getRowModel()` always reads fresh rows.
 */
export function ObservabilityDataTable<TData extends RowData>({
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

  const table = useTable({
    features: observabilityTableFeatures,
    data,
    columns,
    ...(getRowId ? { getRowId } : {}),
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
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
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
                {row.getAllCells().map((cell) => {
                  const cellClassName = cell.column.columnDef.meta?.cellClassName
                  return (
                    <td key={cell.id} className={cellClassName ?? 'px-3 py-2.5 align-top'}>
                      <table.FlexRender cell={cell} />
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
