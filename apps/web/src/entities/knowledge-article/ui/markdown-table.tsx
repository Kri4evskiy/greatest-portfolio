import type { MdxInlineNode } from '@/entities/knowledge-content'
import { renderInlineAst } from './inline-ast'

interface MdxMarkdownTableProps {
  tableKey: string
  headers: readonly MdxInlineNode[][]
  alignments: ReadonlyArray<'left' | 'center' | 'right'>
  rows: readonly MdxInlineNode[][][]
}

export function MdxMarkdownTable({ tableKey, headers, alignments, rows }: MdxMarkdownTableProps) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((headerInlines, colIdx) => {
              const align = alignments[colIdx] ?? 'left'
              const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
              const thKey = `${tableKey}-th-${colIdx}`
              return (
                <th
                  key={thKey}
                  className={`px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground ${alignClass}`}
                >
                  {renderInlineAst(headerInlines, thKey)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, rowIdx) => {
            const trKey = `${tableKey}-tr-${rowIdx}`
            return (
              <tr key={trKey} className="transition-colors hover:bg-muted/25">
                {row.map((cellInlines, colIdx) => {
                  const align = alignments[colIdx] ?? 'left'
                  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                  const tdKey = `${trKey}-td-${colIdx}`
                  return (
                    <td key={tdKey} className={`px-3.5 py-2.5 align-top text-muted-foreground ${alignClass}`}>
                      {renderInlineAst(cellInlines, tdKey)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
