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
  'testing',
  'system-design',
  'others',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategoryEnum>

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  'this-project': 'This Project',
  react: 'React',
  typescript: 'TypeScript',
  nestjs: 'NestJS',
  'nestjs-prisma': 'NestJS & Prisma',
  'architecture-devops': 'Architecture & Docker',
  'databases-sql': 'Databases & SQL',
  testing: 'Testing',
  'system-design': 'System Design',
  others: 'Others',
}

const LOCALIZED_CATEGORY_LABELS: Record<SupportedLocale, Record<KnowledgeCategory, string>> = {
  en: {
    'this-project': 'This Project',
    react: 'React',
    typescript: 'TypeScript',
    nestjs: 'NestJS',
    'nestjs-prisma': 'NestJS & Prisma',
    'architecture-devops': 'Architecture & Docker',
    'databases-sql': 'Databases & SQL',
    testing: 'Testing',
    'system-design': 'System Design',
    others: 'Others',
  },
  uk: {
    'this-project': 'Цей проєкт',
    react: 'React',
    typescript: 'TypeScript',
    nestjs: 'NestJS',
    'nestjs-prisma': 'NestJS та Prisma',
    'architecture-devops': 'Архітектура та Docker',
    'databases-sql': 'Бази даних та SQL',
    testing: 'Тестування',
    'system-design': 'System Design',
    others: 'Інше',
  },
  ru: {
    'this-project': 'Этот проект',
    react: 'React',
    typescript: 'TypeScript',
    nestjs: 'NestJS',
    'nestjs-prisma': 'NestJS и Prisma',
    'architecture-devops': 'Архитектура и Docker',
    'databases-sql': 'Базы данных и SQL',
    testing: 'Тестирование',
    'system-design': 'System Design',
    others: 'Другое',
  },
}

const LOCALIZED_SUBTOPIC_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'monorepo-docker': 'Monorepo, Configs & Docker',
    'design-system': 'Design System & Navigation',
    'mobile-first-ui': 'Design System & Navigation',
    'knowledge-engine': 'MDX & Search Engine',
    'frontend-architecture': 'RSC, Compiler & Edge Auth',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Hooks & Lifecycle',
    'zod-contracts': 'Strict TS & Zod',
    'adr-catalog': 'ADR Catalog',
    'state-management': 'State & Offline Cache',
    security: 'Security & Zero-Trust',
    microservices: 'Microservices & SSE',
    'offline-bundle': 'IndexedDB & Bundle',
    'ai-mcp': 'NestJS AI & MCP',
    'core-di': 'DI & Modules',
    'guards-pipes': 'Guards, Pipes & Interceptors',
    backend: 'Backend Testing',
    indexing: 'Indexing & Query Plans',
  },
  uk: {
    'monorepo-docker': 'Монорепо, Конфіги та Docker',
    'design-system': 'Дизайн-система та Навігація',
    'mobile-first-ui': 'Дизайн-система та Навігація',
    'knowledge-engine': 'Рушій MDX та Пошук',
    'frontend-architecture': 'RSC, Compiler та Edge Auth',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Хуки та життєвий цикл',
    'zod-contracts': 'Суворий TS та Zod',
    'adr-catalog': 'Каталог ADR',
    'state-management': 'Стейт та Offline-кеш',
    security: 'Безпека та Zero-Trust',
    microservices: 'Мікросервіси та SSE',
    'offline-bundle': 'IndexedDB та Бандл',
    'ai-mcp': 'NestJS AI та MCP',
    'core-di': 'DI та Модулі',
    'guards-pipes': 'Гварди, Пайпи та Інтерсептори',
    backend: 'Тестування бекенду',
    indexing: 'Індексація та плани запитів',
  },
  ru: {
    'monorepo-docker': 'Монорепо, Конфиги и Docker',
    'design-system': 'Дизайн-система и Навигация',
    'mobile-first-ui': 'Дизайн-система и Навигация',
    'knowledge-engine': 'Движок MDX и Поиск',
    'frontend-architecture': 'RSC, Compiler и Edge Auth',
    compiler: 'React Compiler',
    'react-19': 'React 19',
    'react-18-vs-19': 'React 18 vs 19',
    hooks: 'Хуки и жизненный цикл',
    'zod-contracts': 'Строгий TS и Zod',
    'adr-catalog': 'Каталог ADR',
    'state-management': 'Стейт и Offline-кэш',
    security: 'Безопасность и Zero-Trust',
    microservices: 'Микросервисы и SSE',
    'offline-bundle': 'IndexedDB и Бандл',
    'ai-mcp': 'NestJS AI и MCP',
    'core-di': 'DI и Модули',
    'guards-pipes': 'Гварды, Пайпы и Интерсепторы',
    backend: 'Тестирование бэкенда',
    indexing: 'Индексация и планы запросов',
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
  updatedAt: z.iso.datetime(),
})
export type ArticleMeta = z.infer<typeof ArticleMetaSchema>

export const ArticleReactionBodySchema = z.object({
  category: KnowledgeCategoryEnum.optional().default('typescript'),
})
export type ArticleReactionBody = z.infer<typeof ArticleReactionBodySchema>

export const ArticleReactionInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9-]+$/i, 'Invalid article slug format'),
  category: KnowledgeCategoryEnum,
})
export type ArticleReactionInput = z.infer<typeof ArticleReactionInputSchema>
