import type {
  SupportedLocale,
  SystemCapabilities,
  SystemEventLogItem,
  TelemetryEvent,
  TelemetryEventType,
} from '@repo/shared-schemas'

export type ArchitectureNodeId =
  | 'edge-proxy'
  | 'nestjs-api'
  | 'persistence'
  | 'telemetry-tcp'
  | 'redis-cache'
  | 's3-storage'
  | 'telegram-auth'

export interface ArchitectureNodeDescriptor {
  id: ArchitectureNodeId
  active: boolean
  capabilityGated: boolean
  badgeVariant: 'success' | 'info' | 'warning' | 'outline'
  statusKind: 'online' | 'fallback' | 'gated' | 'offline'
  metaValue?: string | undefined
}

export function buildArchitectureNodes(
  capabilities: SystemCapabilities,
  totalEventsProcessed?: number,
): ArchitectureNodeDescriptor[] {
  const isPostgres = capabilities.persistence === 'postgresql'
  const tcpConnected = capabilities.telemetryTcpConnected

  return [
    {
      id: 'edge-proxy',
      active: true,
      capabilityGated: false,
      badgeVariant: 'success',
      statusKind: 'online',
      metaValue: 'HS256 • next-intl',
    },
    {
      id: 'nestjs-api',
      active: capabilities.status === 'ok',
      capabilityGated: false,
      badgeVariant: capabilities.mode === 'production' ? 'success' : 'info',
      statusKind: 'online',
      metaValue: capabilities.mode.toUpperCase(),
    },
    {
      id: 'persistence',
      active: isPostgres,
      capabilityGated: false,
      badgeVariant: isPostgres ? 'success' : 'warning',
      statusKind: isPostgres ? 'online' : 'fallback',
      metaValue: isPostgres ? 'PostgreSQL 16' : 'In-Memory Store',
    },
    {
      id: 'telemetry-tcp',
      active: tcpConnected,
      capabilityGated: false,
      badgeVariant: tcpConnected ? 'success' : 'warning',
      statusKind: tcpConnected ? 'online' : 'fallback',
      metaValue: typeof totalEventsProcessed === 'number' ? `${totalEventsProcessed} events` : 'TCP :4001',
    },
    {
      id: 'redis-cache',
      active: capabilities.integrations.redisCache,
      capabilityGated: !capabilities.integrations.redisCache,
      badgeVariant: capabilities.integrations.redisCache ? 'success' : 'outline',
      statusKind: capabilities.integrations.redisCache ? 'online' : 'gated',
      metaValue: capabilities.integrations.redisCache ? 'REDIS_URL' : 'In-Memory Throttler',
    },
    {
      id: 's3-storage',
      active: capabilities.integrations.s3ObjectStorage,
      capabilityGated: !capabilities.integrations.s3ObjectStorage,
      badgeVariant: capabilities.integrations.s3ObjectStorage ? 'success' : 'outline',
      statusKind: capabilities.integrations.s3ObjectStorage ? 'online' : 'gated',
      metaValue: capabilities.integrations.s3ObjectStorage ? 'R2 / MinIO' : 'Local SSG / FS',
    },
    {
      id: 'telegram-auth',
      active: capabilities.integrations.telegramBotAuth,
      capabilityGated: !capabilities.integrations.telegramBotAuth,
      badgeVariant: capabilities.integrations.telegramBotAuth ? 'success' : 'outline',
      statusKind: capabilities.integrations.telegramBotAuth ? 'online' : 'gated',
      metaValue: capabilities.integrations.telegramBotAuth ? 'Bot Webhook / Poll' : '1-Click Guest Pass',
    },
  ]
}

export function truncateUuid(uuid: string): string {
  if (uuid.length <= 14) {
    return uuid
  }
  return `${uuid.slice(0, 8)}…${uuid.slice(-4)}`
}

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  ru: 'ru-RU',
}

export function formatSystemTimestamp(iso: string, locale: SupportedLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return new Intl.DateTimeFormat(DATE_LOCALE_MAP[locale], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function getTelemetryEventBadgeVariant(type: TelemetryEventType): 'info' | 'success' | 'core' | 'outline' {
  switch (type) {
    case 'GUEST_PASS_ISSUED':
      return 'info'
    case 'ARTICLE_VIEWED':
      return 'core'
    case 'ARTICLE_HELPFUL':
      return 'success'
    case 'SYSTEM_HEARTBEAT':
      return 'outline'
  }
}

export function toSystemEventLogItem(event: TelemetryEvent): SystemEventLogItem {
  return {
    id: event.id,
    type: event.type,
    message: event.message,
    ...(event.actorRole ? { actorRole: event.actorRole } : {}),
    ...(event.slug ? { slug: event.slug } : {}),
    createdAt: event.timestamp,
  }
}

export function mergeLiveEventsWithPages(
  liveEvents: readonly TelemetryEvent[],
  pagesItems: readonly SystemEventLogItem[],
  eventTypeFilter?: TelemetryEventType | undefined,
): { items: SystemEventLogItem[]; liveIds: Set<string> } {
  const liveIds = new Set<string>()
  const seenIds = new Set<string>()
  const merged: SystemEventLogItem[] = []

  for (const liveEvent of liveEvents) {
    if (eventTypeFilter && liveEvent.type !== eventTypeFilter) {
      continue
    }
    if (seenIds.has(liveEvent.id)) {
      continue
    }
    seenIds.add(liveEvent.id)
    liveIds.add(liveEvent.id)
    merged.push(toSystemEventLogItem(liveEvent))
  }

  for (const item of pagesItems) {
    if (seenIds.has(item.id)) {
      continue
    }
    seenIds.add(item.id)
    merged.push(item)
  }

  return { items: merged, liveIds }
}

export function computeOffsetPagination(total: number, limit: number, offset: number) {
  const safeLimit = Math.max(1, limit)
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(totalPages, Math.floor(offset / safeLimit) + 1)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  return {
    currentPage,
    totalPages,
    pageNumbers,
  }
}
