'use client'

import type { TechRadarItem } from '@repo/shared-schemas'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

interface DesktopTechRadarDataTableProps {
  data: TechRadarItem[]
  columns: ColumnDef<TechRadarItem>[]
  emptyResultLabel: string
}

/**
 * Isolated TanStack Table v8 boundary:
 * `useReactTable` returns a stable object reference with interior mutability,
 * which `babel-plugin-react-compiler` marks as `knownIncompatible`.
 * Isolating it here with `'use no memo'` allows the parent `TechRadarTable`
 * (filters, mobile card stack, and ADR dialog) to be fully compiled by React Compiler.
 */
export function DesktopTechRadarDataTable({ data, columns, emptyResultLabel }: DesktopTechRadarDataTableProps) {
  'use no memo'

  const [sorting, setSorting] = useState<SortingState>([{ id: 'adrNumber', desc: false }])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-xs md:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3.5 py-2.5 font-mono text-xs font-semibold text-muted-foreground">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border/70">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
