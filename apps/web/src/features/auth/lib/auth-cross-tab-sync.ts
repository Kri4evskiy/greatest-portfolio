'use client'

const AUTH_SYNC_CHANNEL_NAME = 'workfolio_auth_sync'

export function broadcastAuthSessionChange(): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return
  }
  try {
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME)
    channel.postMessage({ type: 'AUTH_SESSION_CHANGED', timestamp: Date.now() })
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
    channel.onmessage = () => {
      onSessionChange()
    }
  } catch {
    return () => {}
  }

  return () => {
    channel?.close()
  }
}
