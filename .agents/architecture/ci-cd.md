# ⚙️ CI/CD Pipeline (GitHub Actions + Turborepo)

Этот документ — единственный источник правды для работы с пайплайном непрерывной интеграции (`GitHub Actions`) в монорепозитории.

---

## 1. Структура файлов CI/CD

- **Workflow:** `.github/workflows/ci.yml` — главный CI-конвейер (триггеры: `push` в `main`, `pull_request` в `main`, `workflow_dispatch`, права строго `permissions: contents: read`).
- **Composite Action:** `.github/actions/setup-workspace/action.yml` — единый переиспользуемый шаг подготовки окружения (`pnpm` из `packageManager`, `Node.js 22`, кэш `pnpm store`, `pnpm install --frozen-lockfile`, опциональная кодогенерация `prepare-codegen`).
- **Граф задач и глобальные зависимости:** `turbo.json` (`globalDependencies: ["tsconfig.base.json", "pnpm-workspace.yaml"]`, `globalEnv: ["API_INTERNAL_URL"]`, задачи `build`, `build-storybook`, `typecheck`, `lint`).

> Папка `.github/` **не** входит в `.gitignore` и коммитится в Git — оттуда GitHub Actions автоматически считывает конфигурацию.

---

## 2. Граф задач (DAG), роли Jobs и почему выбрана модульная архитектура

```text
  [lint] (Biome 2.6, shallow) ──────┐
                                    ├──▶ [build] (Turborepo + .turbo + .next/cache)
  [typecheck] (TS + Codegen) ───────┤
                                    └──▶ [storybook] (@repo/ui via Turborepo)
  [security] (Compose + pnpm audit) ───▶ независимый supply-chain шлюз (без node_modules)

  --- Планируемое расширение (без ломки графа) ---
  [unit-tests] (Vitest) ───────────────▶ параллельно Stage 1 (рядом с lint / typecheck)
  [e2e] (Playwright) ──────────────────▶ Stage 2/3 с needs: [ lint, typecheck, build ]
```

| Job         | Назначение                                         | Зависимости (`needs`) | `fetch-depth`        | Установка deps         | Ключевая логика (PR vs `main`)                                                        |
| :---------- | :------------------------------------------------- | :-------------------- | :------------------- | :--------------------- | :------------------------------------------------------------------------------------ |
| `lint`      | Форматирование и статанализ `Biome 2.6`            | —                     | `1`                  | Да                     | `pnpm run lint` (весь репозиторий за ~150 мс)                                         |
| `security`  | `docker compose config -q` + `pnpm audit`          | —                     | `1`                  | **Нет**                | Валидация Compose и `pnpm audit --prod --audit-level=high` по `pnpm-lock.yaml`        |
| `typecheck` | Строгий `tsc --noEmit` (с кодогенерацией)          | —                     | PR: `0`, `main`: `1` | Да + `prepare-codegen` | PR: `turbo run typecheck --affected`; `main`: `pnpm run typecheck`                    |
| `build`     | Продакшен-сборка через `Turborepo`                 | `lint`, `typecheck`   | PR: `0`, `main`: `1` | Да                     | PR: `turbo run build --affected`; `main`: полный билд + кэши `.turbo` и `.next/cache` |
| `storybook` | Сборка витрины UI-кита `@repo/ui` (`Storybook 10`) | `lint`, `typecheck`   | PR: `0`, `main`: `1` | Да                     | PR: `turbo run build-storybook --affected`; `main`: `turbo run build-storybook`       |

### Почему выбран Multi-Job DAG, а не один объединённый «быстрый» job

Слияние всех шагов в один монолитный job экономит ~15–30 секунд на повторной инициализации VM-раннера (`checkout` + `setup-workspace`), но **осознанно отклонено** в пользу многоджобного DAG:

1. **Чёткая изоляция сигналов (Fail-Fast DX):** В UI GitHub PR Checks сразу видно, _что_ именно упало — стиль (`Biome`), уязвимость (`pnpm audit`), типы (`tsc`), прод-сборка (`Next.js`/`NestJS`) или `Storybook` — без пролистывания единого лога на тысячи строк. Кроме того, `build` и `storybook` (`needs: [ lint, typecheck ]`) даже не стартуют при сломанных типах или линтере.
2. **Разделение прав и профилей окружения:** `security` вообще не устанавливает `node_modules` и довольствуется `fetch-depth: 1`; `lint` не тратит время на Prisma/Next кодогенерацию; и только графовые джобы (`typecheck`, `build`, `storybook`) на PR берут полную историю `fetch-depth: 0` для `--affected`.
3. **Независимые Required Status Checks для Branch Protection:** Каждый job становится самостоятельной обязательной проверкой при настройке правил защиты ветки `main`.
4. **Прямая совместимость с будущими `Vitest` и `Playwright`:** Завтрашние unit-тесты (`Vitest`) добавляются параллельно Stage 1 (`lint` / `typecheck`), а послезавтрашний E2E (`Playwright` со своим кэшем браузеров Chromium и сервисом БД) вешается на `needs: [ lint, typecheck, build ]`, не утяжеляя `lint`, `security` и `storybook`.

---

## 3. Ключевые инженерные решения (Enterprise / Fintech Grade)

### 3.1. `concurrency`: изоляция PR и нулевые потери на `main`

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- **На `pull_request`:** группа строится по номеру PR (`CI-42`). Разные PR **никогда** не мешают друг другу, а новый коммит в том же PR отменяет устаревший прогон.
- **На `main`:** используется уникальный `github.run_id` и `cancel-in-progress: false`. GitHub Actions в одной concurrency-группе держит максимум **1 активный + 1 ожидающий** прогон, поэтому статичная группа `main` при 3+ быстрых мерджах выбросила бы промежуточный коммит из очереди. С `run_id` каждый коммит в `main` гарантированно проходит аудит-прогон.

### 3.2. `fetch-depth: 0` против `fetch-depth: 1` и граф `Turborepo --affected`

- **Почему не `paths:`-фильтры GitHub Actions:** пропуск job через `paths:` вешает обязательные проверки Branch Protection в состоянии _Waiting_ и рискует не перепроверить `apps/api` / `apps/web` при правке общего пакета `packages/shared-schemas`.
- **Как работает `--affected` на PR (`fetch-depth: 0`):**
  - Изменение только в `apps/api/**` → проверяется и собирается **только `@repo/api`** (`web` и `storybook` пропускаются с кодом `0`, честно отдавая `Success`).
  - Изменение в `packages/shared-schemas/**` → Turborepo автоматически перепроверяет `@repo/shared-schemas`, `@repo/api`, `@repo/telemetry-ms` и `@repo/web`.
  - Изменение в `packages/ui/**` → пересобираются `@repo/ui` (`build-storybook`) и `@repo/web`.
  - Изменение `tsconfig.base.json` или `pnpm-workspace.yaml` → `globalDependencies` в `turbo.json` помечает все пакеты затронутыми.
- **Фикс `pull_request` в Detached HEAD (`TURBO_SCM_BASE`):** на раннерах GitHub Actions `actions/checkout` при `pull_request` забирает только merge-ветку `refs/pull/<n>/merge` в detached `HEAD` (без локальной ветки `main` и даже без ref `origin/main`). Чтобы Turborepo не падал в ошибку/предупреждение `Unable to resolve base branch`, в PR-команды `typecheck`, `build` и `storybook` явно передаётся базовый SHA коммита целевой ветки: `TURBO_SCM_BASE="${{ github.event.pull_request.base.sha }}"` (при `fetch-depth: 0` он гарантированно присутствует в истории).

### 3.3. Подготовка кодогенерации перед `typecheck` (`prepare-codegen: 'true'`)

- В `turbo.json` задача `typecheck` имеет `"dependsOn": ["^typecheck"]`, а не `^build`, чтобы пакеты проверялись параллельно.
- На чистом раннере после `checkout` отсутствуют `packages/shared-schemas/dist/index.d.ts`, сгенерированный `@prisma/client` и `.next/types/*` (который импортирует `apps/web/next-env.d.ts` после `next typegen`).
- Поэтому job `typecheck` передаёт `prepare-codegen: 'true'` в `setup-workspace`:
  1. `pnpm --filter @repo/shared-schemas build`
  2. `pnpm --filter @repo/api prisma:generate`
  3. `pnpm --filter @repo/web exec next typegen`
- Для `build` отдельный `prepare-codegen` не нужен: задача `build` в `turbo.json` сама идёт по `"dependsOn": ["^build"]` (сначала собирает `@repo/shared-schemas`, затем `@repo/api` запускает `"prisma generate && tsc -p tsconfig.build.json"`, затем собирается `@repo/web`).

### 3.4. `pnpm 12`, `allowBuilds`, кэши и `security`

- Используются мажорные версии экшенов с поддержкой рантайма Node 24 (`actions/checkout@v6`, `actions/setup-node@v6`, `actions/cache@v5`, `pnpm/action-setup@v5`), чтобы исключить deprecation-предупреждения о Node 20.
- `pnpm/action-setup@v5` ставится **до** `actions/setup-node@v6` (`cache: pnpm`) и считывает версию из `"packageManager": "pnpm@12.18.0"` в корневом `package.json`.
- `pnpm install --frozen-lockfile` запускается **без** `--ignore-scripts`, чтобы срабатывал белый список `allowBuilds` из `pnpm-workspace.yaml`, а переменная `LEFTHOOK: 0` отключает установку git-хуков в CI.
- **Слои кэша и защита от Cache Poisoning:** в `build` кэшируются `.turbo` и `apps/web/.next/cache` через `actions/cache@v5`. Благодаря политике изоляции кэшей GitHub Actions, PR могут _читать_ кэш `main` через `restore-keys`, но **не могут** перезаписывать кэш базовой ветки. (`storybook` пока не восстанавливает `.turbo` ради простоты конфига; при росте UI-кита туда легко добавить аналогичный шаг или перейти на Turborepo Remote Caching через `TURBO_TOKEN` + `TURBO_TEAM`.)
- **Порядок шагов в `security`:** сначала офлайн-валидация `docker compose config --quiet`, затем `pnpm audit --prod --audit-level=high` (аудит прод-графа по `pnpm-lock.yaml` без `node_modules` с высоким соотношением сигнал/шум).
- Если `security` сработает на уязвимость (как было с `GHSA-mrhx-c7xc-m3w5` в `zod < 4.6.6` до миграции на `zod@^4.6.7`), нужно обновить пакет в `pnpm-lock.yaml` или — только как временный документированный компромисс для ложных/недостижимых срабатываний — добавить GHSA в блок `audit:` (`audit.ignore` в `pnpm-workspace.yaml`, либо командой `pnpm audit --ignore <GHSA>`; старый ключ `auditConfig` в `pnpm 12` устарел).

---

## 4. Расширение под тесты (`Vitest`, `Playwright`), hardening и CD

- **`unit-tests` (`Vitest`):** добавить job в Stage 1 (параллельно с `lint`, `security` и `typecheck`) с `uses: ./.github/actions/setup-workspace`, `prepare-codegen: "true"` (при необходимости импорта из `@repo/shared-schemas` / Prisma) и `fetch-depth: ${{ github.event_name == 'pull_request' && '0' || '1' }}` (именно строкой `'0'`, так как число `0` в выражениях GitHub Actions считается falsy!) для `turbo run test --affected`.
- **`e2e` (`Playwright`):** добавить job после `build` (`needs: [ lint, typecheck, build ]`) с кэшем браузеров Playwright, сборкой или поднятием тестируемого контура (`web` + `api` / тестовый Postgres service container или In-Memory fallback), прогоном RBAC/MDX-сценариев (`GuestPassModal` -> `HttpOnly` cookie -> `<Redact />`) и загрузкой отчёта/трейсов (`actions/upload-artifact`) только при `failure()`.
- **Харденинг CI и гигиена безопасности (следующие улучшения):**
  1. **Регулярный скан CVE (`schedule` + Dependabot):** добавить еженедельный `schedule: - cron: ...` для триггера `security` и `.github/dependabot.yml` (для экосистем `npm` и `github-actions`), чтобы новые уязвимости ловились даже в недели без коммитов.
  2. **`persist-credentials: false` на `actions/checkout@v6`:** дополнительная Defense-in-Depth изоляция токена `.git/config` поверх уже заданного `permissions: contents: read`.
  3. **`actionlint` в `lint`:** лёгкая проверка синтаксиса `.github/workflows/*.yml`, которую `Biome` не инспектирует.
  4. **Pinning экшенов по commit SHA (опционально):** жёсткая фиксация SHA-хэшей сторонних экшенов в паре с Dependabot для максимальной supply-chain неизменяемости.
- **CD (деплой сервисов):** выносить отдельными workflow per-service (`web` на Vercel с Remote Cache, `api` и `telemetry-ms` через `docker/*.Dockerfile` с `turbo prune`), чтобы правка фронтенда или статей `.mdx` не перезапускала сборку Docker-образов бэкенда.
