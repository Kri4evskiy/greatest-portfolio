import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Explicit DOM cleanup is required because Vitest `globals` is disabled under strict TS7/Biome.
afterEach(() => {
  cleanup()
})
