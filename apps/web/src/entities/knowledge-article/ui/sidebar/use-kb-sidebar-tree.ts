'use client'

import { useEffect, useMemo } from 'react'
import type { KnowledgeTreeFolderNode, KnowledgeTreeNode } from '@/entities/knowledge-content'
import { APP_ROUTES, buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { useExpandedKbFolders, useUIActions } from '@/shared/store/use-ui-store'

function collectAllFolderKeys(nodes: readonly KnowledgeTreeNode[]): string[] {
  const keys: string[] = []
  const walk = (list: readonly KnowledgeTreeNode[]) => {
    for (const item of list) {
      if (item.type === 'folder') {
        keys.push(item.pathKey)
        walk(item.children)
      }
    }
  }
  walk(nodes)
  return keys
}

export function useKbSidebarTree(tree: readonly KnowledgeTreeFolderNode[], pathname: string, isUnlocked: boolean) {
  const expandedFolders = useExpandedKbFolders()
  const { hydrateKbFoldersFromSession, expandKbAncestors, collapseAllKbFolders, expandAllKbFolders } = useUIActions()

  const { publicRoots, protectedRoots } = useMemo(() => {
    const pub: KnowledgeTreeFolderNode[] = []
    const prot: KnowledgeTreeFolderNode[] = []
    for (const rootNode of tree) {
      if (isPublicKnowledgeBasePath(buildKnowledgeBasePath(rootNode.pathKey))) {
        pub.push(rootNode)
      } else {
        prot.push(rootNode)
      }
    }
    return { publicRoots: pub, protectedRoots: prot }
  }, [tree])

  const allFolderKeys = useMemo(() => collectAllFolderKeys(tree), [tree])
  const expandableFolderKeys = useMemo(
    () => collectAllFolderKeys(isUnlocked ? tree : publicRoots),
    [isUnlocked, publicRoots, tree],
  )
  const hasAnyExpanded = useMemo(
    () => expandableFolderKeys.some((key) => Boolean(expandedFolders[key])),
    [expandableFolderKeys, expandedFolders],
  )

  useEffect(() => {
    hydrateKbFoldersFromSession()
  }, [hydrateKbFoldersFromSession])

  // Automatically expand only the active ancestor chain when opening a Topic, Subtopic, or Article
  useEffect(() => {
    const kbPrefix = `${APP_ROUTES.knowledgeBase}/`
    if (!pathname.startsWith(kbPrefix)) return
    const rel = pathname.slice(kbPrefix.length)
    const segments = rel.split('/').filter(Boolean)
    if (segments.length === 0) return

    const folderKeySet = new Set(allFolderKeys)
    const ancestorKeys: string[] = []
    for (let i = 0; i < segments.length; i += 1) {
      const candidate = segments.slice(0, i + 1).join('/')
      if (folderKeySet.has(candidate)) {
        ancestorKeys.push(candidate)
      }
    }
    if (ancestorKeys.length > 0) {
      expandKbAncestors(ancestorKeys)
    }
  }, [pathname, allFolderKeys, expandKbAncestors])

  const toggleAllFolders = () => {
    if (hasAnyExpanded) {
      collapseAllKbFolders()
    } else {
      expandAllKbFolders(expandableFolderKeys)
    }
  }

  return {
    publicRoots,
    protectedRoots,
    hasAnyExpanded,
    toggleAllFolders,
  }
}
