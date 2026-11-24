'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { normalizeKbRedirectPath } from '@/shared/i18n/app-routes'
import { trackEvent } from '@/shared/lib/analytics'
import { useIsGuestPassModalOpen, useUIActions } from '@/shared/store/use-ui-store'

const LazyGuestPassModal = dynamic(() => import('./guest-pass-modal').then((m) => m.GuestPassModal), {
  ssr: false,
})

/**
 * Lightweight always-mounted trigger shell that listens for `?unlock=knowledge-base`
 * redirects and lazily downloads `GuestPassModal` (RHF + Zod + Radix Dialog) on demand.
 */
export function GuestPassModalLoader() {
  const searchParams = useSearchParams()
  const isOpen = useIsGuestPassModalOpen()
  const { openGuestPassModal: openModal } = useUIActions()
  const [hasLoaded, setHasLoaded] = useState(false)
  const handledUnlockQueryRef = useRef<string | null>(null)

  useEffect(() => {
    const unlockParam = searchParams.get('unlock')
    const redirectParam = searchParams.get('redirect')
    const querySignature = `${unlockParam ?? ''}:${redirectParam ?? ''}`

    if (unlockParam === 'knowledge-base') {
      if (handledUnlockQueryRef.current === querySignature) {
        return
      }
      handledUnlockQueryRef.current = querySignature
      openModal(normalizeKbRedirectPath(redirectParam))
      trackEvent('guest_pass_modal_opened', { source: 'middleware_redirect' })
    } else {
      handledUnlockQueryRef.current = null
    }
  }, [searchParams, openModal])

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [hasLoaded, isOpen])

  if (!isOpen && !hasLoaded) {
    return null
  }

  return <LazyGuestPassModal />
}
