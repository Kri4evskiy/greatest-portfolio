'use client'

import { DEFAULT_LOCALE, type SupportedLocale, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Cpu, ShieldCheck, Sparkles, Terminal } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'

type DiagramMode = 'mcp' | 'ai'

interface LocalizedCopy {
  en: string
  uk: string
  ru: string
}

interface DiagramNode {
  id: string
  step: string
  label: string
  sub: LocalizedCopy
  x: number
  y: number
  badge: string
  description: LocalizedCopy
}

interface DiagramEdge {
  fromX: number
  toX: number
  label: string
}

const UI_LABELS = {
  headerTitle: {
    en: 'Interactive Topology: @nestjs/mcp vs @nestjs/ai',
    uk: 'Інтерактивна топологія: @nestjs/mcp проти @nestjs/ai',
    ru: 'Интерактивная топология: @nestjs/mcp против @nestjs/ai',
  },
  clickHint: {
    en: 'Switch mode or click any node to inspect guardrails',
    uk: 'Перемикайте режим або клікайте на вузли схеми',
    ru: 'Переключайте режим или кликайте на любой узел схемы',
  },
  mcpTab: {
    en: '@nestjs/mcp ($0 Token Showcase)',
    uk: '@nestjs/mcp ($0 за токени)',
    ru: '@nestjs/mcp ($0 за токены)',
  },
  aiTab: {
    en: '@nestjs/ai (AiModule + Guarded LLM)',
    uk: '@nestjs/ai (AiModule + LLM агент)',
    ru: '@nestjs/ai (AiModule + LLM агент)',
  },
  mcpBanner: {
    en: 'INBOUND CONTEXT SERVER • $0 SERVER LLM COST • READ-ONLY + THROTTLED',
    uk: 'ВХІДНИЙ MCP-СЕРВЕР • $0 ВИТРАТ НА ТОКЕНИ • READ-ONLY + RATE LIMIT',
    ru: 'ВХОДЯЩИЙ MCP-СЕРВЕР • $0 НА ТОКЕНЫ СЕРВЕРА • READ-ONLY + RATE LIMIT',
  },
  aiBanner: {
    en: 'OUTBOUND LLM ORCHESTRATION • MAX TOKENS + ZOD TOOLS + AUTO-FALLBACK',
    uk: 'ВИХІДНА ОРКЕСТРАЦІЯ LLM • БЮДЖЕТ ТОКЕНІВ + ZOD СХЕМИ + ФОЛБЕК МОДЕЛЕЙ',
    ru: 'ИСХОДЯЩАЯ ОРКЕСТРАЦИЯ LLM • ЛИМИТ ТОКЕНОВ + ZOD СХЕМЫ + ФОЛБЭК МОДЕЛЕЙ',
  },
} as const

const MCP_NODES: readonly DiagramNode[] = [
  {
    id: 'mcp-client',
    step: '01',
    label: 'Cursor / Claude',
    sub: {
      en: 'External IDE Agent',
      uk: 'Зовнішній IDE-клієнт',
      ru: 'Внешний IDE-клиент',
    },
    x: 85,
    y: 120,
    badge: 'Caller Pays LLM',
    description: {
      en: 'A CTO or tech lead connects Cursor, Claude Desktop, or VS Code to the portfolio MCP URL. All LLM token inference happens on the caller side — our server pays $0.',
      uk: 'Тімлід або CTO підключає Cursor чи Claude Desktop до MCP-ендпоінту портфоліо. Уся генерація LLM відбувається на боці клієнта — наш бекенд витрачає $0 на токени.',
      ru: 'Тимлид или CTO подключает Cursor или Claude Desktop к MCP-эндпоинту портфолио. Вся генерация токенов идёт на стороне клиента — наш сервер тратит ровно $0.',
    },
  },
  {
    id: 'mcp-guards',
    step: '02',
    label: 'Guards + Throttler',
    sub: {
      en: '20 req/min • Payload Cap',
      uk: '20 req/хв • Ліміт запиту',
      ru: '20 req/мин • Лимит запроса',
    },
    x: 270,
    y: 120,
    badge: 'Zero-Trust Gate',
    description: {
      en: 'Standard NestJS pipeline (@UseGuards, @nestjs/throttler, Zod pipes) caps request rate, enforces max query length, and blocks any write/admin operations.',
      uk: 'Стандартний конвеєр NestJS (@UseGuards, @nestjs/throttler, Zod-пайпи) обмежує частоту запитів, валідує розмір параметрів і блокує будь-які мутації.',
      ru: 'Стандартный конвейер NestJS (@UseGuards, @nestjs/throttler, Zod-пайпы) режет спам по IP, проверяет лимиты аргументов и гарантирует строго Read-Only доступ.',
    },
  },
  {
    id: 'mcp-server',
    step: '03',
    label: '@nestjs/mcp',
    sub: {
      en: 'Tools & Resources',
      uk: 'Ресурси та Інструменти',
      ru: 'Ресурсы и Инструменты',
    },
    x: 455,
    y: 120,
    badge: 'Streamable HTTP',
    description: {
      en: 'Exposes typed read-only capabilities (list_adrs, search_cv_experience, get_article_tldr) using shared Zod contracts from @repo/shared-schemas.',
      uk: 'Публікує типізовані Read-Only інструменти (list_adrs, search_cv_experience, get_article_tldr) напряму через спільні Zod-схеми з @repo/shared-schemas.',
      ru: 'Публикует типизированные Read-Only инструменты (list_adrs, search_cv_experience, get_article_tldr), переиспользуя единые Zod-контракты из @repo/shared-schemas.',
    },
  },
  {
    id: 'mcp-data',
    step: '04',
    label: '16 ADRs • CV • MDX',
    sub: {
      en: 'Redacted Public Snapshot',
      uk: 'Публічний зріз без NDA',
      ru: 'Публичный срез без NDA',
    },
    x: 635,
    y: 120,
    badge: 'Deterministic JSON',
    description: {
      en: 'Returns deterministic, structured facts from our ADR matrix, commercial CV timeline, and MDX frontmatter while keeping ADMIN-only <Redact /> metrics masked.',
      uk: 'Повертає точні структуровані дані з матриці 16 ADR, досвіду роботи та MDX-метаданих, зберігаючи NDA-поля <Redact /> закритими.',
      ru: 'Отдаёт детерминированные факты из матрицы 16 ADR, коммерческого опыта CV и MDX-метаданных, строго скрывая закрытые метрики под <Redact />.',
    },
  },
]

const MCP_EDGES: readonly DiagramEdge[] = [
  { fromX: 155, toX: 200, label: 'HTTP / SSE' },
  { fromX: 340, toX: 385, label: 'Zod Guard' },
  { fromX: 525, toX: 565, label: 'Read-Only' },
]

const AI_NODES: readonly DiagramNode[] = [
  {
    id: 'ai-controller',
    step: '01',
    label: 'Controller + Cookie',
    sub: {
      en: 'HttpOnly Guest Pass',
      uk: 'HttpOnly Guest Pass',
      ru: 'HttpOnly Guest Pass',
    },
    x: 85,
    y: 120,
    badge: 'JwtRolesGuard',
    description: {
      en: 'Protected NestJS endpoint verifies the HttpOnly kb_access_token cookie first so anonymous bots cannot burn paid LLM tokens.',
      uk: 'Захищений контролер NestJS спершу перевіряє HttpOnly куку kb_access_token, щоб анонімні боти не могли витрачати платний баланс LLM.',
      ru: 'Защищённый контроллер NestJS проверяет HttpOnly куку kb_access_token до вызова нейросети, чтобы боты не сжигали платный баланс токенов.',
    },
  },
  {
    id: 'ai-module',
    step: '02',
    label: 'AiModule.forRoot',
    sub: {
      en: 'Timeout • Pricing • Cap',
      uk: 'Таймаут • Ціна • Ліміт',
      ru: 'Таймаут • Цена • Лимит',
    },
    x: 270,
    y: 120,
    badge: 'maxOutputTokens',
    description: {
      en: 'Centralizes model registry, hard maxOutputTokens ceilings, request timeouts (30s), retries, and real-time input/output token cost tracking.',
      uk: 'Централізує реєстр моделей, жорсткі стелі maxOutputTokens, таймаути (30s), ретраї та автоматичний підрахунок вартості вхідних/вихідних токенів.',
      ru: 'Централизует реестр моделей, жёсткий потолок maxOutputTokens, таймауты (30s), ретраи и подсчёт стоимости каждого запроса из коробки.',
    },
  },
  {
    id: 'ai-tools',
    step: '03',
    label: '@AgentFunction',
    sub: {
      en: 'inputSchema: Zod',
      uk: 'inputSchema: Zod',
      ru: 'inputSchema: Zod',
    },
    x: 455,
    y: 120,
    badge: 'Auto-Discovery',
    description: {
      en: 'Decorated NestJS provider methods are auto-discovered by AiModule and validated at runtime against Zod schemas before executing business logic.',
      uk: 'Методи сервісів із декоратором @AgentFunction автоматично знаходяться модулем AiModule і валідуються через Zod-схеми перед викликом.',
      ru: 'Методы сервисов с декоратором @AgentFunction автоматически обнаруживаются AiModule и валидируются через Zod-схемы перед выполнением.',
    },
  },
  {
    id: 'ai-providers',
    step: '04',
    label: 'Claude ➔ GPT',
    sub: {
      en: 'Primary + Auto-Fallback',
      uk: 'Основна + Фолбек LLM',
      ru: 'Основная + Фолбэк LLM',
    },
    x: 635,
    y: 120,
    badge: 'Paid API Stream',
    description: {
      en: 'Streams responses via pipeTextStreamToResponse() and transparently fails over from the primary model (Anthropic) to backup (OpenAI) on 5xx/rate-limit errors.',
      uk: 'Стрімить відповідь через pipeTextStreamToResponse() і прозоро перемикається з основної моделі (Anthropic) на резервну (OpenAI) при збоях 5xx.',
      ru: 'Стримит ответ через pipeTextStreamToResponse() и прозрачно переключается с основной модели (Anthropic) на резервную (OpenAI) при ошибках 5xx или 429.',
    },
  },
]

const AI_EDGES: readonly DiagramEdge[] = [
  { fromX: 155, toX: 200, label: 'streamText()' },
  { fromX: 340, toX: 385, label: 'Tool Call' },
  { fromX: 525, toX: 565, label: 'Fallback' },
]

export function NestAiMcpDiagram({ defaultMode = 'mcp' }: { defaultMode?: DiagramMode | undefined }) {
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale: SupportedLocale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE

  const [mode, setMode] = useState<DiagramMode>(defaultMode)
  const [selectedIndex, setSelectedIndex] = useState<number>(defaultMode === 'ai' ? 1 : 2)

  const nodes = mode === 'mcp' ? MCP_NODES : AI_NODES
  const edges = mode === 'mcp' ? MCP_EDGES : AI_EDGES
  const activeNode = nodes[selectedIndex] ?? nodes[0]

  if (!activeNode) {
    return null
  }

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 shrink-0 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">{UI_LABELS.headerTitle[locale]}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">{UI_LABELS.clickHint[locale]}</p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => {
              setMode('mcp')
              setSelectedIndex(2)
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
              mode === 'mcp'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Terminal className="h-3 w-3 shrink-0" />
            <span>{UI_LABELS.mcpTab[locale]}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ai')
              setSelectedIndex(1)
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
              mode === 'ai'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>{UI_LABELS.aiTab[locale]}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox="0 0 720 195"
          className="h-auto w-full min-w-[580px]"
          role="img"
          aria-label={UI_LABELS.headerTitle[locale]}
        >
          <defs>
            <marker
              id="nest-flow-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="hsl(var(--chart-1))" />
            </marker>
          </defs>

          {/* Top architectural lane banner */}
          <rect
            x="16"
            y="10"
            width="688"
            height="28"
            rx="6"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          <text
            x="360"
            y="28"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="10"
            fontWeight="700"
            fill="hsl(var(--muted-foreground))"
          >
            {mode === 'mcp' ? UI_LABELS.mcpBanner[locale] : UI_LABELS.aiBanner[locale]}
          </text>

          {/* Directed Edges */}
          {edges.map((edge) => {
            const midX = (edge.fromX + edge.toX) / 2
            return (
              <g key={`${mode}-${edge.fromX}`}>
                <line
                  x1={edge.fromX}
                  y1={120}
                  x2={edge.toX}
                  y2={120}
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="2"
                  markerEnd="url(#nest-flow-arrow)"
                />
                <text
                  x={midX}
                  y={108}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="9"
                  fontWeight="600"
                  fill="hsl(var(--muted-foreground))"
                >
                  {edge.label}
                </text>
              </g>
            )
          })}

          {/* Interactive Nodes */}
          {nodes.map((node, idx) => {
            const isSelected = idx === selectedIndex
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG interactive group node inside architecture diagram
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedIndex(idx)
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  x={-69}
                  y={-38}
                  width={138}
                  height={76}
                  rx={10}
                  fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                  stroke={isSelected ? 'hsl(var(--chart-1))' : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={0}
                  y={-18}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="9"
                  fontWeight="700"
                  fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--chart-1))'}
                >
                  {`STEP ${node.step}`}
                </text>
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="10.5"
                  fontWeight="700"
                  fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                >
                  {node.label}
                </text>
                <text
                  x={0}
                  y={18}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="8.5"
                  fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
                >
                  {node.sub[locale]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected Node Inspector */}
      <div className="mt-2 rounded-lg border border-border/80 bg-muted/40 p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
            <span>
              {activeNode.step}. {activeNode.label} — {activeNode.sub[locale]}
            </span>
          </div>
          <Badge variant={mode === 'mcp' ? 'success' : 'secondary'} className="font-mono text-[10px]">
            {activeNode.badge}
          </Badge>
        </div>
        <p className="mt-1.5 leading-relaxed text-muted-foreground">{activeNode.description[locale]}</p>
      </div>
    </div>
  )
}
