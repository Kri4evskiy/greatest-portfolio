import { Skeleton } from '@repo/ui'
import { KnowledgeDirectorySkeleton } from '@/entities/knowledge-article/ui/knowledge-skeletons'

export default function KnowledgeBaseLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-44 rounded-full" />
        </div>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <Skeleton className="h-20 w-full rounded-xl" />

      <KnowledgeDirectorySkeleton />
    </div>
  )
}
