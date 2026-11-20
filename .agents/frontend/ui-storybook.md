# 🎨 UI-система, Workfolio Design Language и Storybook (`packages/ui`)

Этот документ описывает дизайн-систему проекта в `packages/ui` (`@repo/ui`) и визуальный язык приложения `apps/web`.

## 1. Визуальный ориентир: Workfolio Editorial & Mobile-First Aesthetic

Стартовая страница портфолио (CV) и База Знаний строятся в редакционной **Mobile-First Workfolio** эстетике с инженерным уклоном:
- **Чистая редакционная верстка (Editorial Minimalism):** Высококонтрастная типографика (`Inter` через `--font-inter` для UI и статей + `JetBrains Mono` через `--font-jetbrains-mono` для кода, версий, метрик и тегов — self-hosted Zero-CLS `next/font/google` с сабсетами `latin` + `cyrillic` и жесткой политикой CSP `font-src 'self' data:`), много воздуха, тонкие разделители (`border-border/60`), отсутствие дешевых кислотных градиентов и визуального шума.
- **Модульная редакционная структура и таблицы данных:**
  - Четкая колонка контента (`max-w-4xl` на главной CV, `max-w-7xl` с сайдбаром в Базе знаний).
  - Карточки проектов (Interactive Project Gallery), таймлайн опыта (Experience & Resume), callout-блоки с архитектурными заметками и интерактивная таблица стека Tech Radar (`TanStack Table`).
  - Мгновенно считываемые статусы: бейдж доступности (`Available for Senior / Full-Stack roles`) и живой индикатор телеметрии (`SSE Live Stream`).

## 2. Архитектура пакета `packages/ui` (`Tailwind CSS v4`)

- Основан на `Tailwind CSS v4` (CSS-first конфигурация в `packages/ui/src/styles/theme.css`, экспортируемая как `@repo/ui/theme.css` с `@theme inline` и `@custom-variant dark`) + `shadcn/ui` (безголовые примитивы `Radix UI` с полной поддержкой `WAI-ARIA` и клавиатурной навигации).
- Поддерживает нативные CSS-платформенные паттерны без лишнего JS-рантайма: GPU-анимации входа `@starting-style` для `Dialog` и чистые CSS `@keyframes` (`data-state`/`data-side` + `--radix-popper-transform-origin`) для `Popover` и `Tooltip` в `@layer components`, unlayered `prefers-reduced-motion: reduce`, Baseline-правила в `@layer base` (`scrollbar-gutter: stable`, `scroll-padding-top: 5rem`, `text-wrap: balance/pretty`) и `@container` queries (включая `Card`).
- Актуальный каталог базовых компонентов (Single Source of Truth):
  - `Badge`, `Button` (включая компактный `size="icon-sm"` для контролов хедера), `Callout`, `Card`, `Dialog` (используется в модалке Guest Pass, ADR-инспекторе и `CommandPaletteModal`), `Input`, `Popover` (`@radix-ui/react-popover`), `Skeleton`, `Tabs`, `ToggleGroup` (`@radix-ui/react-toggle-group`, используется в `LanguageSwitcher` и `ThemeToggle`), `Tooltip` (`'use client'` + `Portal`, единый `TooltipProvider` в корневом `LocaleRootLayout`).
- Все компоненты экспортируются из `packages/ui/src/index.ts` и не содержат бизнес-логики конкретного приложения. Фиксируется единый `browserslist` (`Chrome >= 111`, `Edge >= 111`, `Firefox >= 128`, `Safari >= 16.4`) в `packages/ui/package.json` и `apps/web/package.json`.

## 3. Изолированная документация в Storybook 10

- Каждый компонент в `packages/ui/src/components/*` обязан иметь рядом файл `*.stories.tsx` (100% покрытие).
- В **Storybook 10** (с нативным плагином `@tailwindcss/vite`, компилирующим `packages/ui/src/styles/globals.css`) настроены 4 пресета оформления (`Warm Paper / Dark / Graphite / Sepia`) и состояния (`Default`, `Hover`, `Disabled`, `Loading`), чтобы любой рекрутер или тимлид мог открыть витрину UI-кита (`pnpm --filter @repo/ui storybook`) и проверить контрастность и компонентную культуру.

## 4. Система 2D-оформления (`Mode × Palette` — Zero-FOUC)

- **Ось 1 — Color Mode (`next-themes`):**
  - В `apps/web/src/shared/providers/theme-provider.tsx` настроен `NextThemesProvider` с `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `storageKey="workfolio-theme"` и `disableTransitionOnChange` (управляет классом `.dark` и `prefers-color-scheme`).
- **Ось 2 — Semantic Palette (`workfolio-palette`):**
  - Поддерживаются палитры `default` (`Warm Paper`), `graphite` и `sepia` через атрибут `html[data-palette]` (`apps/web/src/shared/lib/palette.ts`).
  - В `<head>` корневого `LocaleRootLayout` (`apps/web/src/app/[locale]/layout.tsx`, где также задан `data-scroll-behavior="smooth"`) синхронно встраивается allowlisted скрипт `PALETTE_INIT_SCRIPT` для Zero-FOUC до гидратации.
  - После монтирования корневой `ThemeProvider` выполняет гидратацию стора и кросс-вкладочную синхронизацию `storage` императивно через `uiStore.getState().actions.syncPaletteFromStorage()` (без лишней подписки `useSyncExternalStore`), а `ThemeToggle` в `WorkfolioHeader` собран целиком на переиспользуемых примитивах `@repo/ui` (`Button`, `Tooltip`, `Popover`, `ToggleGroup`).
- **Composition Root & Семантические HSL-токены (`packages/ui/src/styles/theme.css`):**
  - `apps/web/src/app/globals.css` выступает точкой композиции для `@tailwindcss/postcss` (`@import "tailwindcss"; @import "@repo/ui/theme.css";` + `@source` директивы), сохраняя инверсию зависимостей для `@repo/ui`.
  - Никогда не используй захардкоженные палитровые HEX/Tailwind-цвета (`#ffffff`, `emerald-*`, `amber-*`, `slate-*`) для карточек, текста, статусов или фонов (включая `D3.js` SVG-графы) — всегда используй семантические токены (`bg-background`, `bg-surface-subtle`, `bg-card`, `text-foreground`, `text-success`, `text-warning`, `text-info`, `text-destructive`, `hsl(var(--chart-*))`).
