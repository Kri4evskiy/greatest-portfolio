import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Experimental TanStack Redact wrapper (ADR-08 & Step 6.3).
 * Activates alternative lightweight runtime optimizations when ENABLE_REDACT=true,
 * with safe fallback to standard Next.js React 19 compiler pipeline.
 */
function withRedact(config: NextConfig): NextConfig {
  if (process.env.ENABLE_REDACT !== 'true') {
    return config;
  }

  return {
    ...config,
    env: {
      ...config.env,
      NEXT_PUBLIC_REDACT_RUNTIME: 'enabled',
    },
  };
}

const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@repo/shared-schemas'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'd3', '@repo/ui'],
  },
  env: {
    NEXT_PUBLIC_REDACT_RUNTIME:
      process.env.ENABLE_REDACT === 'true' ? 'enabled' : 'standard-react-19',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(withRedact(nextConfig));
