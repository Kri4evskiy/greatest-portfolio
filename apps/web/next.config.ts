import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { getSecurityHeaders } from './config/security-headers.config'
import { resolveNormalizedApiInternalUrl } from './config/utils/url-origin.util'

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const apiInternalUrl = resolveNormalizedApiInternalUrl()

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: {
    compilationMode: 'infer',
    panicThreshold: 'none',
  },
  transpilePackages: ['@repo/ui', '@repo/shared-schemas'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'd3', '@repo/ui', '@repo/shared-schemas'],
  },
  async headers() {
    const cvPdfAssetHeaders = getSecurityHeaders(undefined, undefined, {
      allowSameOriginFraming: true,
    })

    return [
      {
        source: '/(.*)',
        headers: getSecurityHeaders(),
      },
      {
        source: '/cv/:path+',
        headers: cvPdfAssetHeaders,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ]
  },
}

export default withNextIntl(withBundleAnalyzer(nextConfig))
