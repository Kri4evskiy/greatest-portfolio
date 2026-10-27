'use client';

import { useUIStore } from '@/store/use-ui-store';
import { TECH_RADAR_ITEMS, type TechCategory, type TechRadarItem } from '@repo/shared-schemas';
import { Badge, Button, Input } from '@repo/ui';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, BookOpenCheck, Search } from 'lucide-react';
import * as React from 'react';

const CATEGORIES: ReadonlyArray<'All' | TechCategory> = [
  'All',
  'Frontend',
  'Backend',
  'Database & Storage',
  'DevOps & DX',
  'Architecture',
];

export function TechRadarTable(): React.JSX.Element {
  const openAdrInspector = useUIStore((s) => s.openAdrInspector);
  const [selectedCategory, setSelectedCategory] = React.useState<'All' | TechCategory>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'adrNumber', desc: false }]);

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TECH_RADAR_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.adrWhy.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const columns = React.useMemo<ColumnDef<TechRadarItem>[]>(
    () => [
      {
        accessorKey: 'adrNumber',
        header: '#',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{String(row.original.adrNumber).padStart(2, '0')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Технология / Стек',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.summary}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Домен',
        cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
      },
      {
        accessorKey: 'level',
        header: 'Статус',
        cell: ({ row }) => {
          const level = row.original.level;
          const variant =
            level === 'Core' ? 'core' : level === 'Production' ? 'production' : 'experimental';
          return <Badge variant={variant}>{level}</Badge>;
        },
      },
      {
        accessorKey: 'experienceYears',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
          >
            <span>Опыт</span>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.experienceYears} лет</span>
        ),
      },
      {
        id: 'adrAction',
        header: 'Архитектурное решение (ADR)',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openAdrInspector(row.original)}
            className="h-7 text-xs"
          >
            <BookOpenCheck className="h-3.5 w-3.5 text-emerald-600" />
            Почему в стеке? (ADR)
          </Button>
        ),
      },
    ],
    [openAdrInspector],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Notion Database Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по 15 ADR и стеку..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Notion Database Table View */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3.5 py-2.5 text-xs font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/70">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Технологии по вашему запросу не найдены.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
