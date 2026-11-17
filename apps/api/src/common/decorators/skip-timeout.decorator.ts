import { SetMetadata } from '@nestjs/common'

export const SKIP_TIMEOUT_KEY = 'skipTimeout'

/**
 * Exempts a controller or route handler (e.g. long-lived SSE streams)
 * from the global TimeoutInterceptor.
 */
export const SkipTimeout = () => SetMetadata(SKIP_TIMEOUT_KEY, true)
