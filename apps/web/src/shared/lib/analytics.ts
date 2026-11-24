import { resolvePublicPosthogHost } from '@/shared/config/env'

export type AnalyticsEventName =
  | 'guest_pass_modal_opened'
  | 'guest_pass_unlocked'
  | 'adr_popover_inspected'
  | 'article_read'
  | 'article_helpful_clicked'
  | 'command_palette_article_selected'
  | 'cv_pdf_downloaded'
  | 'language_switched'
  | 'theme_toggled'
  | 'palette_changed'

export function trackEvent(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  const posthogHost = resolvePublicPosthogHost()

  if (!posthogKey) {
    // Graceful no-op in local development when NEXT_PUBLIC_POSTHOG_KEY is unset
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[PostHog Telemetry No-Op] ${event}`, properties ?? {})
    }
    return
  }

  void fetch(`${posthogHost}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: posthogKey,
      event,
      properties: {
        distinct_id: 'portfolio-visitor',
        ...properties,
      },
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {
    // Non-blocking analytics
  })
}

/**
 * Production-only client exception hook for Sentry / observability.
 * Guarantees that development/test exceptions NEVER leak to Sentry.
 */
export function captureClientException(
  error: unknown,
  context?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[Sentry Dev No-Op — disabled outside production]', error, context ?? {})
    return
  }

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  if (!sentryDsn) {
    return
  }

  // Integration hook for `@sentry/nextjs` (`Sentry.captureException(error, { extra: context })`)
  void sentryDsn
}
