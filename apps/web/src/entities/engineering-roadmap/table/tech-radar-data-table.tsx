'use client'

import type { TechRadarItem } from '@repo/shared-schemas'
import {
  type ColumnDef,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'

/**
 * Tree-shaken TanStack Table v9 feature set for the desktop Tech Radar table:
 * registers only `rowSortingFeature` + explicit `sortFn_*` comparators (no unused filtering/pinning/grouping code).
 */
export const techRadarTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
})

export type TechRadarTableFeatures = typeof techRadarTableFeatures
export type TechRadarColumnDef = ColumnDef<TechRadarTableFeatures, TechRadarItem>

interface DesktopTechRadarDataTableProps {
  data: readonly TechRadarItem[]
  columns: TechRadarColumnDef[]
  emptyResultLabel: string
}

/**
 * Isolated TanStack Table v9 boundary:
 * `useTable` returns a stable table object backed by TanStack Store atoms.
 * Isolating it here with `'use no memo'` allows the parent `TechRadarTable`
 * (filters, mobile card stack, and ADR dialog) to be fully compiled by React Compiler.
 */
export function DesktopTechRadarDataTable({ data, columns, emptyResultLabel }: DesktopTechRadarDataTableProps) {
  'use no memo'

  const table = useTable({
    features: techRadarTableFeatures,
    data,
    columns,
    initialState: {
      sorting: [{ id: 'adrNumber', desc: false }],
    },
  })

  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-xs md:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3.5 py-2.5 font-mono text-xs font-semibold text-muted-foreground">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border/70">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/30">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-3 align-middle">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                {emptyResultLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
