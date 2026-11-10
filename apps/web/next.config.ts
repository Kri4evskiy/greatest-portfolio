import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000'

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  reactStrictMode: true,
  reactCompiler: {
    compilationMode: 'infer',
    panicThreshold: 'none',
  },
  transpilePackages: ['@repo/ui', '@repo/shared-schemas'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'd3', '@repo/ui'],
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
