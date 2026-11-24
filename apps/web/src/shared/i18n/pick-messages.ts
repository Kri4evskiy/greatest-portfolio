import type { AbstractIntlMessages } from 'next-intl'

/**
 * Slices a full `getMessages()` dictionary down to the specific client namespaces
 * actually consumed by a route subtree, keeping server-only and off-route copy
 * out of the serialized RSC HTML payload.
 */
export function pickIntlMessages(messages: AbstractIntlMessages, namespaces: readonly string[]): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {}
  for (const namespace of namespaces) {
    if (Object.hasOwn(messages, namespace)) {
      const value = messages[namespace]
      if (value !== undefined) {
        picked[namespace] = value
      }
    }
  }
  return picked
}
