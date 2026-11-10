import { resolveJwtSecret } from '@repo/shared-schemas'

let cachedSecretValue: string | null = null
let cachedHmacKeyPromise: Promise<CryptoKey> | null = null

function getHmacKey(secret: string): Promise<CryptoKey> {
  if (cachedSecretValue === secret && cachedHmacKeyPromise) {
    return cachedHmacKeyPromise
  }

  cachedSecretValue = secret
  cachedHmacKeyPromise = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return cachedHmacKeyPromise
}

function decodeBase64UrlToBytes(input: string): Uint8Array<ArrayBuffer> | null {
  if (!input || !/^[A-Za-z0-9_-]+$/.test(input)) {
    return null
  }

  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = normalized.length % 4
  if (remainder === 1) {
    return null
  }
  const padded = remainder === 0 ? normalized : `${normalized}${'='.repeat(4 - remainder)}`

  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(new ArrayBuffer(binary.length))
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    return null
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function verifyEdgeJwtHs256(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return false
  }

  try {
    const headerBytes = decodeBase64UrlToBytes(encodedHeader)
    const payloadBytes = decodeBase64UrlToBytes(encodedPayload)
    const signatureBytes = decodeBase64UrlToBytes(encodedSignature)
    if (!headerBytes || !payloadBytes || !signatureBytes) {
      return false
    }

    const decoder = new TextDecoder()
    const headerJson: unknown = JSON.parse(decoder.decode(headerBytes))
    const payloadJson: unknown = JSON.parse(decoder.decode(payloadBytes))

    if (!isPlainObject(headerJson) || headerJson.alg !== 'HS256') {
      return false
    }

    if (!isPlainObject(payloadJson) || typeof payloadJson.exp !== 'number') {
      return false
    }

    if (payloadJson.exp * 1000 <= Date.now()) {
      return false
    }

    const secret = resolveJwtSecret(process.env.JWT_SECRET)
    const hmacKey = await getHmacKey(secret)
    const signingInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    return await crypto.subtle.verify('HMAC', hmacKey, signatureBytes, signingInput)
  } catch {
    return false
  }
}
