'use client'

import { Button, Callout } from '@repo/ui'
import { Lock, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCachedAuth } from '@/shared/hooks/use-cached-auth'
import { APP_ROUTES } from '@/shared/i18n/app-routes'
import { useUIActions } from '@/shared/store/use-ui-store'

/**
 * Adaptive status banner on `/knowledge-base`:
 * - Guests see a clear explanation of the Hybrid KB boundary (`This Project` public,
 *   domain notes gated) with an in-place 1-Click Guest Pass trigger.
 * - Authenticated visitors see the verified Edge Proxy + IndexedDB callout.
 */
export function KnowledgeAccessCallout() {
  const t = useTranslations('KnowledgeBase')
  const { isUnlocked } = useCachedAuth()
  const { openGuestPassModal } = useUIActions()

  if (isUnlocked) {
    return (
      <Callout variant="success" title={t('calloutTitle')} icon={<ShieldCheck className="h-4 w-4" />}>
        {t('calloutBody')}
      </Callout>
    )
  }

  return (
    <Callout variant="info" title={t('guestCalloutTitle')} icon={<Lock className="h-4 w-4" />}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">{t('guestCalloutBody')}</p>
        <Button
          type="button"
          size="sm"
          onClick={() => openGuestPassModal(APP_ROUTES.knowledgeBase)}
          className="h-8 shrink-0 gap-1.5 font-mono text-xs"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{t('unlockInPlaceCta')}</span>
        </Button>
      </div>
    </Callout>
  )
}
