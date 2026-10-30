# 🎨 UI-система, Workfolio Design Language и Storybook (`packages/ui`)

Этот документ описывает дизайн-систему проекта в `packages/ui` (`@repo/ui`) и визуальный язык приложения `apps/web`.

## 1. Визуальный ориентир: Notion Workfolio Aesthetic (`https://www.notion.com/templates/workfolio`)

Стартовая страница портфолио (CV) и База Знаний строятся в эстетике **Notion Workfolio** с инженерным уклоном:
- **Чистая редакционная верстка (Editorial Minimalism):** Высококонтрастная типографика (`Inter` / `Geist Sans` для текста + `Geist Mono` / `JetBrains Mono` для кода, версий, метрик и тегов), много воздуха, тонкие разделители (`border-border/60`), отсутствие дешевых кислотных градиентов и визуального шума.
- **Структура в духе Notion-блоков и баз данных:**
  - Четкая колонка контента (`max-w-4xl` на главной CV, `max-w-7xl` с сайдбаром в Базе знаний).
  - Карточки проектов (Interactive Project Gallery), таймлайн опыта (Experience & Resume), callout-блоки с архитектурными заметками и интерактивная таблица стека в стиле базы данных Notion (`TanStack Table`).
  - Мгновенно считываемые статусы: бейдж доступности (`Available for Senior / Full-Stack roles`), живой индикатор телеметрии (`SSE Live Stream`), номер сборки из `package.json`.

## 2. Архитектура пакета `packages/ui`

- Основан на `Tailwind CSS` + `shadcn/ui` (безголовые примитивы `Radix UI` с полной поддержкой `WAI-ARIA` и клавиатурной навигации).
- Обязательные базовые компоненты:
  - `Button`, `Input`, `Badge`, `Card`, `Dialog` (для модалки Guest Pass и ADR-инспектора), `Tooltip`, `Tabs`, `Skeleton`, `Separator`, `Callout`.
- Все компоненты экспортируются из `packages/ui/src/index.ts` и не содержат бизнес-логики конкретного приложения.

## 3. Изолированная документация в Storybook

- Каждый компонент в `packages/ui/src/components/*` обязан иметь рядом файл `*.stories.tsx`.
- В Storybook настраиваются варианты состояний (`Default`, `Hover`, `Disabled`, `Loading`, `Dark/Light Mode`), чтобы любой рекрутер или тимлид мог открыть витрину UI-кита (`pnpm --filter @repo/ui storybook`) и убедиться в культуре компонентной разработки.

## 4. Система тем (Light / Dark / System Mode — Zero-FOUC)

- **Провайдер и хранение выбора (`next-themes`):**
  - В `apps/web/src/providers/theme-provider.tsx` настроен `NextThemesProvider` с `attribute="class"`, `defaultTheme="system"`, `enableSystem` и `storageKey="workfolio-theme"`.
  - При первом визите применяется системная тема ОС (`prefers-color-scheme`), а при ручном переключении через кнопку `ThemeToggle` (`Sun` / `Moon` в `WorkfolioHeader`) выбор сохраняется в `localStorage['workfolio-theme']` и применяется синхронным микро-скриптом в `<head>` до первого рендера без белой вспышки (`Zero-FOUC`).
- **Семантические HSL-токены (`packages/ui/src/styles/globals.css`):**
  - Никогда не используй захардкоженные светлые/темные HEX-цвета (`#ffffff`, `#f8fafc`, `#0f172a`) для карточек, текста или фонов (включая `D3.js` SVG-графы) — всегда используй семантические переменные `hsl(var(--background))`, `hsl(var(--card))`, `hsl(var(--foreground))`, `hsl(var(--muted-foreground))`, `hsl(var(--border))`.
