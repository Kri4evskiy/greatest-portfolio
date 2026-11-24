'use client'

const AUTH_SYNC_CHANNEL_NAME = 'workfolio_auth_sync'

function createTabSenderId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Unique per-tab identifier so a BroadcastChannel message fired by login/logout
// only invalidates OTHER browser tabs and never triggers redundant same-tab refetches.
const CURRENT_TAB_SENDER_ID = createTabSenderId()

interface AuthSyncMessage {
  type: 'AUTH_SESSION_CHANGED'
  senderId: string
  timestamp: number
}

function isForeignAuthSyncMessage(data: unknown): data is AuthSyncMessage {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  const candidate = data as Partial<AuthSyncMessage>
  return (
    candidate.type === 'AUTH_SESSION_CHANGED' &&
    typeof candidate.senderId === 'string' &&
    candidate.senderId !== CURRENT_TAB_SENDER_ID
  )
}

export function broadcastAuthSessionChange(): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return
  }
  try {
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME)
    const message: AuthSyncMessage = {
      type: 'AUTH_SESSION_CHANGED',
      senderId: CURRENT_TAB_SENDER_ID,
      timestamp: Date.now(),
    }
    channel.postMessage(message)
    channel.close()
  } catch {
    // Ignore BroadcastChannel errors in restricted webviews
  }
}

export function subscribeAuthSessionChange(onSessionChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {}
  }

  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (isForeignAuthSyncMessage(event.data)) {
        onSessionChange()
      }
    }
  } catch {
    return () => {}
  }

  return () => {
    channel?.close()
  }
}
