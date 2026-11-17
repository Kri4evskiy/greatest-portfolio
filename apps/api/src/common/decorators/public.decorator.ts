import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Marks a controller or route handler as publicly accessible,
 * allowing global or route-level auth guards to bypass authentication.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
