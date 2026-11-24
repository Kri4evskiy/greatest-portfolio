'use client'

import type { TechRadarItem } from '@repo/shared-schemas'
import { Badge, Button } from '@repo/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, BookOpenCheck } from 'lucide-react'

export interface TechRadarColumnLabels {
  colTech: string
  colDomain: string
  colStatus: string
  colExp: string
  inspectBtn: string
  formatYears: (years: number) => string
}

interface CreateTechRadarColumnsParams {
  labels: TechRadarColumnLabels
  onInspectAdr: (item: TechRadarItem) => void
}

export function createTechRadarColumns({
  labels,
  onInspectAdr,
}: CreateTechRadarColumnsParams): ColumnDef<TechRadarItem>[] {
  return [
    {
      accessorKey: 'adrNumber',
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto gap-1 px-1 py-0.5 font-mono text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <span>ADR #</span>
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.original.adrNumber).padStart(2, '0')}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: labels.colTech,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{row.original.summary}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: labels.colDomain,
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-[11px] whitespace-nowrap">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'level',
      header: labels.colStatus,
      cell: ({ row }) => {
        const level = row.original.level
        const variant = level === 'Core' ? 'success' : level === 'Production' ? 'default' : 'warning'
        return (
          <Badge variant={variant} className="font-mono text-[10px]">
            {level}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'experienceYears',
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto gap-1 px-1 py-0.5 font-mono text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <span>{labels.colExp}</span>
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{labels.formatYears(row.original.experienceYears)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">ADR</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onInspectAdr(row.original)}
            className="h-7 gap-1 font-mono text-xs"
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
            <span>{labels.inspectBtn}</span>
          </Button>
        </div>
      ),
    },
  ]
}
