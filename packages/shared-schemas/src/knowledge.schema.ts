import { z } from 'zod'
import type { SupportedLocale } from './locale.schema.js'

export const KnowledgeCategoryEnum = z.enum([
  'this-project',
  'react',
  'typescript',
  'nestjs-prisma',
  'architecture-devops',
  'databases-sql',
  'system-design',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategoryEnum>

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  'this-project': 'This Project',
  react: 'React',
  typescript: 'TypeScript',
  'nestjs-prisma': 'NestJS & Prisma',
  'architecture-devops': 'Architecture & Docker',
  'databases-sql': 'PostgreSQL & SQL',
  'system-design': 'System Design',
}

const LOCALIZED_CATEGORY_LABELS: Record<SupportedLocale, Record<KnowledgeCategory, string>> = {
  en: {
    'this-project': 'This Project',
    react: 'React',
    typescript: 'TypeScript',
    'nestjs-prisma': 'NestJS & Prisma',
    'architecture-devops': 'Architecture & Docker',
    'databases-sql': 'PostgreSQL & SQL',
    'system-design': 'System Design',
  },
  uk: {
    'this-project': 'Цей проєкт',
    react: 'React',
    typescript: 'TypeScript',
    'nestjs-prisma': 'NestJS та Prisma',
    'architecture-devops': 'Архітектура та Docker',
    'databases-sql': 'PostgreSQL та SQL',
    'system-design': 'System Design',
  },
  ru: {
    'this-project': 'Этот проект',
    react: 'React',
    typescript: 'TypeScript',
    'nestjs-prisma': 'NestJS и Prisma',
    'architecture-devops': 'Архитектура и Docker',
    'databases-sql': 'PostgreSQL и SQL',
    'system-design': 'System Design',
  },
}

const LOCALIZED_SUBTOPIC_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'monorepo-docker': 'Monorepo & Docker',
    'mobile-first-ui': 'Mobile-First & Navigation',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Hooks & Lifecycle',
    'zod-contracts': 'Strict TS & Zod',
    'adr-catalog': 'ADR Catalog',
    'state-management': 'State & Offline Cache',
    security: 'Zero-Trust Auth & JWT',
    microservices: 'Microservices & SSE',
    'offline-bundle': 'IndexedDB & Bundle',
  },
  uk: {
    'monorepo-docker': 'Монорепо та Docker',
    'mobile-first-ui': 'Mobile-First та Навігація',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Хуки та життєвий цикл',
    'zod-contracts': 'Суворий TS та Zod',
    'adr-catalog': 'Каталог ADR',
    'state-management': 'Стейт та Offline-кеш',
    security: 'Zero-Trust Auth та JWT',
    microservices: 'Мікросервіси та SSE',
    'offline-bundle': 'IndexedDB та Бандл',
  },
  ru: {
    'monorepo-docker': 'Монорепо и Docker',
    'mobile-first-ui': 'Mobile-First и Навигация',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Хуки и жизненный цикл',
    'zod-contracts': 'Строгий TS и Zod',
    'adr-catalog': 'Каталог ADR',
    'state-management': 'Стейт и Offline-кэш',
    security: 'Zero-Trust Auth и JWT',
    microservices: 'Микросервисы и SSE',
    'offline-bundle': 'IndexedDB и Бандл',
  },
}

export function getKnowledgeCategoryLabel(category: KnowledgeCategory, locale: SupportedLocale = 'en'): string {
  return LOCALIZED_CATEGORY_LABELS[locale]?.[category] ?? KNOWLEDGE_CATEGORY_LABELS[category]
}

export function formatKnowledgeSegmentLabel(segment: string, locale: SupportedLocale = 'en'): string {
  const categoryParsed = KnowledgeCategoryEnum.safeParse(segment)
  if (categoryParsed.success) {
    return getKnowledgeCategoryLabel(categoryParsed.data, locale)
  }

  const knownSubtopic = LOCALIZED_SUBTOPIC_LABELS[locale]?.[segment]
  if (knownSubtopic) {
    return knownSubtopic
  }

  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const ArticleMetaSchema = z.object({
  slug: z.string().min(1),
  category: KnowledgeCategoryEnum,
  viewsCount: z.number().int().nonnegative(),
  helpfulCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
})
export type ArticleMeta = z.infer<typeof ArticleMetaSchema>

export const ArticleReactionInputSchema = z.object({
  slug: z.string().min(1),
  category: KnowledgeCategoryEnum,
})
export type ArticleReactionInput = z.infer<typeof ArticleReactionInputSchema>
