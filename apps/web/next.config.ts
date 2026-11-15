import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { getSecurityHeaders } from './config/security-headers.config'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000'

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
    optimizePackageImports: ['lucide-react', 'd3', '@repo/ui'],
  },
  async headers() {
    const cvPageHeaders = getSecurityHeaders(undefined, undefined, {
      allowSelfObjectAndFrame: true,
    })
    const cvPdfAssetHeaders = getSecurityHeaders(undefined, undefined, {
      allowSelfObjectAndFrame: true,
      allowSameOriginFraming: true,
    })

    return [
      {
        source: '/(.*)',
        headers: getSecurityHeaders(),
      },
      {
        source: '/cv',
        headers: cvPageHeaders,
      },
      {
        source: '/:locale(en|ua|uk|ru)/cv',
        headers: cvPageHeaders,
      },
      {
        source: '/cv/:path*',
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
