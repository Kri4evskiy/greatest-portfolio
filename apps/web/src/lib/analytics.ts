export type AnalyticsEventName =
  | 'guest_pass_modal_opened'
  | 'guest_pass_unlocked'
  | 'adr_popover_inspected'
  | 'article_read'
  | 'article_helpful_clicked'
  | 'language_switched'

export function trackEvent(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

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
