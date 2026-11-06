---

name: mobile-first-workfolio
description: Architectural and UX guidelines for maintaining and extending the Mobile-First Workfolio CV, 3-Tier Multi-Slug MDX 2.0 Knowledge Base, Cmd+K search, and Living Engineering Backlog.
---

# Mobile-First Workfolio & 3-Tier Second Brain Skill

Use this skill whenever adding UI sections, Knowledge Base topics/articles, navigation controls, or planning the Notion Workfolio visual redesign in `apps/web`.

## 1. Sticky Header & Ergonomic Section Navigation (`360px` First)

- **Keep `WorkfolioHeader` minimal:** Never place in-page section links (`About`, `Projects`, `Experience`, `Tech Radar`, `Roadmap`) inside the top sticky bar. Keep only:
  1. Author brand (`SK / Stanislav Krychevskyi`)
  2. Global `Cmd+K` search trigger
  3. Theme & compact `< sm` Language triggers
  4. `Base of Knowledge` RBAC button + single contextual quick jump (`ADR` on CV, `CV` inside Knowledge Base)
- **Use `PageSectionNavigator` + `useSectionNavigation` for in-page sections:**
  - Whenever adding a new home-page `<section id="...">` (with `scroll-mt-20`), register its ID in `WORKFOLIO_SECTION_IDS` (`apps/web/src/hooks/use-section-navigation.ts`) and `PageSectionNavigator`.
  - Always trigger in-page jumps via `scrollToSection(id)` (programmatic `element.scrollIntoView` + `history.replaceState`) so repeated clicks on the same `#hash` never stall in Next.js App Router.
  - Keep `pb-20 xl:pb-10` on `WorkfolioFooter` so the mobile thumb-zone floating pill (`bottom-4 right-4`) never overlaps footer links or telemetry.

## 2. Responsive Data Views (`< md` Cards vs `>= md` Tables / Canvases)

- **Dense tables (`TanStack Table`):** Provide a stacked `Card View` (`md:hidden`) for smartphones and render the full table on `hidden md:block`.
- **Interactive SVG / Canvas visualizations (`D3.js`, `XYFlow`):** Wrap wide diagrams in `overflow-x-auto` with `min-w-[540px]` so node labels remain legible on `360px` screens instead of shrinking into unreadable micro-text.

## 3. 3-Tier Multi-Slug Knowledge Base (`Topic -> Subtopic -> Articles`)

- Store localized notes in `apps/web/content/<topic>/<subtopic>/<slug>.{en,uk,ru}.mdx`.
- Register human-readable localized subtopic titles in `LOCALIZED_SUBTOPIC_LABELS` inside `packages/shared-schemas/src/knowledge.schema.ts` (and run `pnpm --filter @repo/shared-schemas build`).
- Every `.mdx` frontmatter must include:
  - `title`, `sidebarLabel` (concise 2–4 words for single-line sidebar rendering), `summary`, `category`, `format` (`"cheat-sheet" | "deep-dive" | "adr"`), `tags: [...]`, `readingTime`, `publishedAt`, `order`, and `tldr` (2–4 actionable bullets).
- **RSC Payload Discipline:** Never pass full `article.blocks` AST arrays to Client Components (`CommandPaletteModal`, `KnowledgeDirectoryExplorer`). Strip AST blocks on the server and serialize lightweight frontmatter/TOC projections only.

## 4. Living Engineering Backlog & Trade-offs (`engineering-roadmap.ts`)

- Whenever the author proposes a new feature idea, identifies tech debt, or decides to defer an over-engineered solution, record it in `apps/web/src/data/engineering-roadmap.ts` with:
  - `status` (`'planned' | 'evaluating' | 'deferred' | 'shipped'`)
  - `rationale` (why prioritized next or why deferred)
  - `pros` (concrete engineering/product value) and `constraints` (bundle size, maintenance cost, security, or UX trade-offs).
