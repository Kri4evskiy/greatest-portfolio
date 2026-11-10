import { z } from 'zod'
import type { SupportedLocale } from './locale.schema.js'

export const KnowledgeCategoryEnum = z.enum([
  'this-project',
  'react',
  'typescript',
  'nestjs',
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
  nestjs: 'NestJS',
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
    nestjs: 'NestJS',
    'nestjs-prisma': 'NestJS & Prisma',
    'architecture-devops': 'Architecture & Docker',
    'databases-sql': 'PostgreSQL & SQL',
    'system-design': 'System Design',
  },
  uk: {
    'this-project': 'Цей проєкт',
    react: 'React',
    typescript: 'TypeScript',
    nestjs: 'NestJS',
    'nestjs-prisma': 'NestJS та Prisma',
    'architecture-devops': 'Архітектура та Docker',
    'databases-sql': 'PostgreSQL та SQL',
    'system-design': 'System Design',
  },
  ru: {
    'this-project': 'Этот проект',
    react: 'React',
    typescript: 'TypeScript',
    nestjs: 'NestJS',
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
    'knowledge-engine': 'MDX 2.0 & Search Engine',
    'frontend-architecture': 'Tokens, RSC & Edge Hardening',
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
    'ai-mcp': 'NestJS AI & MCP',
    'core-di': 'DI & Modules',
    'guards-pipes': 'Guards, Pipes & Interceptors',
  },
  uk: {
    'monorepo-docker': 'Монорепо та Docker',
    'mobile-first-ui': 'Mobile-First та Навігація',
    'knowledge-engine': 'MDX 2.0 та Пошуковий Рушій',
    'frontend-architecture': 'Токени, RSC та Edge-захист',
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
    'ai-mcp': 'NestJS AI та MCP',
    'core-di': 'DI та Модулі',
    'guards-pipes': 'Гварди, Пайпи та Інтерсептори',
  },
  ru: {
    'monorepo-docker': 'Монорепо и Docker',
    'mobile-first-ui': 'Mobile-First и Навигация',
    'knowledge-engine': 'Движок MDX 2.0 и Поиск',
    'frontend-architecture': 'Токены, RSC и Edge-защита',
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
    'ai-mcp': 'NestJS AI и MCP',
    'core-di': 'DI и Модули',
    'guards-pipes': 'Гварды, Пайпы и Интерсепторы',
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

export const KnowledgeNoteFormatEnum = z.enum(['cheat-sheet', 'deep-dive', 'adr'])
export type KnowledgeNoteFormat = z.infer<typeof KnowledgeNoteFormatEnum>

const LOCALIZED_FORMAT_LABELS: Record<SupportedLocale, Record<KnowledgeNoteFormat, string>> = {
  en: {
    'cheat-sheet': 'Cheat Sheet',
    'deep-dive': 'Deep Dive',
    adr: 'ADR',
  },
  uk: {
    'cheat-sheet': 'Шпаргалка',
    'deep-dive': 'Глибокий розбір',
    adr: 'ADR',
  },
  ru: {
    'cheat-sheet': 'Шпаргалка',
    'deep-dive': 'Глубокий разбор',
    adr: 'ADR',
  },
}

export function getKnowledgeFormatLabel(format: KnowledgeNoteFormat, locale: SupportedLocale = 'en'): string {
  return LOCALIZED_FORMAT_LABELS[locale]?.[format] ?? LOCALIZED_FORMAT_LABELS.en[format]
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
