import { z } from 'zod'
import type { SupportedLocale } from './locale.schema.js'

export const KnowledgeCategoryEnum = z.enum([
  'this-project',
  'typescript',
  'react',
  'nestjs-prisma',
  'architecture-devops',
  'databases-sql',
  'system-design',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategoryEnum>

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  'this-project': 'This Project (Workfolio)',
  typescript: 'TypeScript & Contracts',
  react: 'React 18 vs 19 & Next.js',
  'nestjs-prisma': 'NestJS, Prisma & Security',
  'architecture-devops': 'Architecture, Docker & Redact',
  'databases-sql': 'PostgreSQL, SQL & Caching',
  'system-design': 'System Design & Patterns',
}

const LOCALIZED_CATEGORY_LABELS: Record<SupportedLocale, Record<KnowledgeCategory, string>> = {
  en: {
    'this-project': 'This Project (Workfolio)',
    typescript: 'TypeScript & Contracts',
    react: 'React 18 vs 19 & Next.js',
    'nestjs-prisma': 'NestJS, Prisma & Security',
    'architecture-devops': 'Architecture, Docker & Redact',
    'databases-sql': 'PostgreSQL, SQL & Caching',
    'system-design': 'System Design & Patterns',
  },
  uk: {
    'this-project': 'Цей проєкт (Workfolio)',
    typescript: 'TypeScript та Контракти',
    react: 'React 18 vs 19 та Next.js',
    'nestjs-prisma': 'NestJS, Prisma та Безпека',
    'architecture-devops': 'Архітектура, Docker та Redact',
    'databases-sql': 'PostgreSQL, SQL та Кешування',
    'system-design': 'System Design та Патерни',
  },
  ru: {
    'this-project': 'Этот проект (Workfolio)',
    typescript: 'TypeScript и Контракты',
    react: 'React 18 vs 19 и Next.js',
    'nestjs-prisma': 'NestJS, Prisma и Безопасность',
    'architecture-devops': 'Архитектура, Docker и Redact',
    'databases-sql': 'PostgreSQL, SQL и Кэширование',
    'system-design': 'System Design и Паттерны',
  },
}

const LOCALIZED_SUBTOPIC_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'monorepo-docker': 'Monorepo, pnpm 12 & Docker',
    'mobile-first-ui': 'Mobile-First UI & Navigation',
    hooks: 'Hooks & Lifecycle',
    compiler: 'React Compiler & Rendering',
    'state-management': 'State & Offline Cache',
    security: 'Zero-Trust Auth & RBAC',
    microservices: 'Microservices & SSE',
  },
  uk: {
    'monorepo-docker': 'Монорепозиторій, pnpm 12 та Docker',
    'mobile-first-ui': 'Mobile-First UI та Навігація',
    hooks: 'Хуки та життєвий цикл',
    compiler: 'React Compiler та Рендер',
    'state-management': 'Стейт та Offline-кеш',
    security: 'Zero-Trust Auth та RBAC',
    microservices: 'Мікросервіси та SSE',
  },
  ru: {
    'monorepo-docker': 'Монорепозиторий, pnpm 12 и Docker',
    'mobile-first-ui': 'Mobile-First UI и Навигация',
    hooks: 'Хуки и жизненный цикл',
    compiler: 'React Compiler и Рендер',
    'state-management': 'Стейт и Offline-кэш',
    security: 'Zero-Trust Auth и RBAC',
    microservices: 'Микросервисы и SSE',
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
