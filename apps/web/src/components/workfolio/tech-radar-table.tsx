'use client';

import { trackEvent } from '@/lib/analytics';
import { useUIStore } from '@/store/use-ui-store';
import { TECH_RADAR_ITEMS, type TechCategory, type TechRadarItem } from '@repo/shared-schemas';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, BookOpenCheck, Compass, Layers, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

const CATEGORIES: ReadonlyArray<TechCategory | 'ALL'> = [
  'ALL',
  'Frontend',
  'Backend',
  'Database & Storage',
  'DevOps & DX',
  'Architecture',
];

export function TechRadarTable() {
  const categoryFilter = useUIStore((s) => s.techRadarCategoryFilter);
  const searchQuery = useUIStore((s) => s.techRadarSearch);
  const selectedAdrItem = useUIStore((s) => s.selectedAdrItem);
  const setCategoryFilter = useUIStore((s) => s.setTechRadarCategoryFilter);
  const setSearchQuery = useUIStore((s) => s.setTechRadarSearch);
  const openAdrInspector = useUIStore((s) => s.openAdrInspector);
  const closeAdrInspector = useUIStore((s) => s.closeAdrInspector);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'adrNumber', desc: false }]);

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return TECH_RADAR_ITEMS.filter((item) => {
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.summary.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [categoryFilter, searchQuery]);

  const columns = useMemo<ColumnDef<TechRadarItem>[]>(
    () => [
      {
        accessorKey: 'adrNumber',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>ADR #</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{String(row.original.adrNumber).padStart(2, '0')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Технология / Инструмент',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm text-foreground">{row.original.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{row.original.summary}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Домен',
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[11px] whitespace-nowrap">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'level',
        header: 'Статус',
        cell: ({ row }) => {
          const level = row.original.level;
          const variant =
            level === 'Core' ? 'success' : level === 'Production' ? 'default' : 'warning';
          return (
            <Badge variant={variant} className="font-mono text-[10px]">
              {level}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'experienceYears',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>Опыт</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.experienceYears}+ лет</span>
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
              onClick={() => {
                openAdrInspector(row.original);
                trackEvent('adr_popover_inspected', {
                  adrNumber: row.original.adrNumber,
                  name: row.original.name,
                });
              }}
              className="h-7 gap-1 font-mono text-xs"
            >
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>Почему / Где / Как</span>
            </Button>
          </div>
        ),
      },
    ],
    [openAdrInspector],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section id="tech-radar" className="scroll-mt-20 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">
              Tech Radar Database (15 Architecture Decision Records)
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Интерактивная база данных в стиле Notion на движке{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">TanStack Table</code>.
            Нажмите <strong>«Почему / Где / Как»</strong> на любой строке для просмотра ADR.
          </p>
        </div>
        <Badge variant="outline" className="w-fit font-mono text-xs">
          Показано: {filteredData.length} из {TECH_RADAR_ITEMS.length}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const active = categoryFilter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {category === 'ALL' ? 'Все домены (15)' : category}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по стеку или ADR..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3.5 py-2.5 font-mono text-xs font-semibold text-muted-foreground"
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
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Ничего не найдено по вашему запросу.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={selectedAdrItem !== null}
        onOpenChange={(open) => {
          if (!open) closeAdrInspector();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          {selectedAdrItem ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    ADR-{String(selectedAdrItem.adrNumber).padStart(2, '0')}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {selectedAdrItem.category}
                  </Badge>
                  <Badge variant="success" className="font-mono text-xs">
                    {selectedAdrItem.experienceYears}+ лет опыта • {selectedAdrItem.level}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 text-xl">{selectedAdrItem.name}</DialogTitle>
                <DialogDescription>{selectedAdrItem.summary}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm">
                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>1. ПОЧЕМУ ВЫБРАНО (WHY)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{selectedAdrItem.adrWhy}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    <span>2. ГДЕ ПРИМЕНЕНО В МОНОРЕПОЗИТОРИИ (WHERE)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedAdrItem.adrWhere}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    <span>3. КАК РЕАЛИЗОВАНО (HOW)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{selectedAdrItem.adrHow}</p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
