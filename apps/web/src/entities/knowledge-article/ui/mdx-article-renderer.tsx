import { highlightCodeServer, type MdxBlock } from '@/entities/knowledge-content'
import { collectCodeBlocksRecursively, renderBlockList } from './article-blocks'

export { renderInlineAst, renderInlineMarkdown } from './inline-ast'

export async function MdxArticleRenderer({ blocks }: { blocks: readonly MdxBlock[] }) {
  // Highlight all code blocks (including nested ones inside callouts/lists) in parallel at SSG time (0 KB client JS)
  const codeTargets: Array<{ pathKey: string; code: string; language: string }> = []
  collectCodeBlocksRecursively(blocks, 'root', codeTargets)

  const highlightedByPath = new Map<string, string>()
  await Promise.all(
    codeTargets.map(async (target) => {
      const html = await highlightCodeServer(target.code, target.language)
      highlightedByPath.set(target.pathKey, html)
    }),
  )

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
      {renderBlockList(blocks, 'root', highlightedByPath)}
    </div>
  )
}
