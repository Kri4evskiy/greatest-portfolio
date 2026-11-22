import { DEFAULT_LOCALE, getTechRadarItems } from '@repo/shared-schemas'
import { getKnowledgeTree } from '@/entities/knowledge-content'
import { AUTHOR_PROFILE, AUTHOR_SKILL_GROUPS, COMMERCIAL_EXPERIENCE } from '@/entities/workfolio-profile/author-profile'
import { APP_ROUTES } from '@/shared/i18n/app-routes'
import { buildLocalizedUrl } from '@/shared/lib/seo'

export const dynamic = 'force-static'

export function GET() {
  const tree = getKnowledgeTree(DEFAULT_LOCALE)
  const techRadar = getTechRadarItems(DEFAULT_LOCALE)
  const thisProjectFolder = tree.find((node) => node.segment === 'this-project')
  const domainFolders = tree.filter((node) => node.segment !== 'this-project')

  const lines: string[] = [
    `# ${AUTHOR_PROFILE.fullName.en} — Senior Frontend / Full-Stack TypeScript Engineer & Systems Architect`,
    '',
    `> Production-grade Full-Stack Engineering Portfolio, Interactive CV, and Protected Second-Brain Knowledge Base (${AUTHOR_PROFILE.yearsOfExperience} years of commercial track record building high-load e-commerce platforms for 50,000+ DAU, node-based XYFlow automation builders, real-time D3.js financial dashboards, and enterprise monorepo architectures).`,
    '',
    '## Executive Profile & Core Engineering Positioning',
    '',
    `- **Role & Seniority:** ${AUTHOR_PROFILE.roleTitle.en} (${AUTHOR_PROFILE.yearsOfExperience} Years Commercial Experience, Systems & Frontend Architecture Focus)`,
    `- **Location & Availability:** ${AUTHOR_PROFILE.location.en} — Open to high-impact Senior / Lead / Staff-track Frontend & Full-Stack opportunities`,
    `- **Languages:** ${AUTHOR_PROFILE.spokenLanguages.en}`,
    '- **Signature Engineering Strengths:**',
    '  - **Performance & Scale:** Proven record of cutting LCP/TTI by 15–40% and optimizing memory footprint across high-traffic platforms (50,000+ DAU, 10,000+ SKU catalogs).',
    '  - **Complex Interactive Systems:** Deep specialization in node-based visual builders (`XYFlow` / `React Flow`), real-time financial & RWA tokenization analytics (`D3.js`), and 100% transaction-critical `Stripe Embedded` checkouts.',
    '  - **End-to-End Type Safety & Monorepo Architecture:** Mastery of `Next.js 16 (App Router, RSC, React 19 Compiler)`, `NestJS 12 Native ESM`, `Prisma 7 ORM (Wasm + @prisma/adapter-pg)`, `Zod v4` shared contracts, `TanStack Query v5` (`IndexedDB` offline-first persistence), and Zero-Trust `Edge Web Crypto JWT` security.',
    '  - **Technical Leadership:** Built frontend architecture standards from scratch, led MVP-to-production deliveries in 4 months, and mentored multiple engineers to autonomous ownership.',
    '',
    '## Primary Entry Points & Contact Channels',
    '',
    `- [Interactive Workfolio Home (EN)](${buildLocalizedUrl(APP_ROUTES.home, 'en')}): Full architecture showcase, case studies, Tech Radar (16 ADRs), and living engineering backlog.`,
    `- [Interactive Workfolio Home (UA)](${buildLocalizedUrl(APP_ROUTES.home, 'uk')}): Українська версія портфоліо та бази знань.`,
    `- [Interactive Workfolio Home (RU)](${buildLocalizedUrl(APP_ROUTES.home, 'ru')}): Русскоязычная версия портфолио и базы знаний.`,
    `- [Full Resume / ATS CV & Downloadable PDF](${buildLocalizedUrl(APP_ROUTES.cv, 'en')}): Complete commercial timeline, hard skills matrix, and original PDF resume.`,
    `- [System Observability & API Inspector](${buildLocalizedUrl(APP_ROUTES.systemStatus, 'en')}): Live capabilities matrix, Cursor-paginated SSE telemetry log, and Offset-paginated Knowledge Base leaderboard.`,
    `- [Engineering Knowledge Base Hub](${buildLocalizedUrl(APP_ROUTES.knowledgeBase, 'en')}): Continuously expanding multilingual (EN/UA/RU) engineering handbook and architectural reference (unlockable in 1 click via the Guest Pass RBAC demo).`,
    `- [GitHub Profile](${AUTHOR_PROFILE.contacts.githubUrl}) | [Monorepo Source Code](${AUTHOR_PROFILE.contacts.repoUrl})`,
    `- [LinkedIn](${AUTHOR_PROFILE.contacts.linkedinUrl}) | [Telegram](${AUTHOR_PROFILE.contacts.telegramUrl}) | Email: ${AUTHOR_PROFILE.contacts.email}`,
    '',
    '## Commercial Experience Highlights (2020 – 2026)',
    '',
  ]

  for (const exp of COMMERCIAL_EXPERIENCE) {
    lines.push(`### ${exp.company} — ${exp.engagement.en} (${exp.period.en})`)
    lines.push(`- **Domain:** ${exp.domain.en} | **Projects:** ${exp.projects.join(', ')}`)
    for (const point of exp.highlights.en) {
      lines.push(`- ${point}`)
    }
    lines.push(`- **Stack:** ${exp.technologies.join(', ')}`)
    lines.push('')
  }

  lines.push('## Core Technical Stack & Skill Matrix')
  lines.push('')
  for (const group of AUTHOR_SKILL_GROUPS) {
    lines.push(`- **${group.label.en}:** ${group.skills.join(', ')}`)
  }
  lines.push('')

  lines.push('## 16 Architecture Decision Records (Tech Radar Summary)')
  lines.push('')
  for (const item of techRadar) {
    lines.push(`- **${item.name}** (${item.category} • ${item.level}, ${item.experienceYears} yrs): ${item.adrWhy}`)
  }
  lines.push('')

  lines.push('## Engineering Knowledge Base Structure (Living Second Brain)')
  lines.push('')
  lines.push(
    'The Knowledge Base is a living, continuously expanding multilingual (`EN / UA / RU`) engineering system organized into two distinct pillars:',
  )
  lines.push('')
  lines.push('### 1. Dedicated "This Project" Architectural Blueprint (`/knowledge-base/this-project`)')
  lines.push(
    'Stands apart as a complete, transparent engineering specification of this monorepo itself — documenting every production mechanism, trade-off, and custom subsystem built from scratch:',
  )
  if (thisProjectFolder) {
    const subtopicLabels = thisProjectFolder.children
      .filter((child) => child.type === 'folder')
      .map((child) => `\`${child.label}\``)
    if (subtopicLabels.length > 0) {
      lines.push(`- **Architectural Subsystems Covered:** ${subtopicLabels.join(', ')}.`)
    }
  }
  lines.push(
    '- **Key Deep-Dive Topics:** 5-Tier `FSD-Modular` Next.js 16 architecture, `React 19 Compiler` & atomic Zustand store patterns, Zero-Eval HAST MDX engine with server-side dual-theme `Shiki`, `Edge Web Crypto HS256 JWT` verification, `NestJS 12 ESM` 4-tier enterprise backend, `Prisma 7 Wasm` with resilient In-Memory fallback, `Multi-Stage BuildKit Docker` orchestration, and `A+ CSP / Helmet / Throttler` security hardening.',
  )
  lines.push('')
  lines.push('### 2. Core Frontend, Backend & System Design Deep-Dives (`/knowledge-base`)')
  lines.push(
    'In-depth technical articles (`deep-dive`), rapid-recall references (`cheat-sheet`), and architectural records (`adr`) across core full-stack engineering domains:',
  )
  for (const folder of domainFolders) {
    const subtopics = folder.children
      .filter((child) => child.type === 'folder')
      .map((child) => child.label)
      .join(', ')
    lines.push(
      `- **[${folder.label}](${buildLocalizedUrl(`/knowledge-base/${folder.segment}`, 'en')})**: ${subtopics || 'Core engineering notes and production patterns'}.`,
    )
  }

  lines.push('')
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
