import type { NextConfig } from 'next';

const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';
const enableRedact = process.env.ENABLE_REDACT === 'true';

function withRedactExperimental(config: NextConfig): NextConfig {
  if (!enableRedact) {
    return config;
  }
  // Experimental TanStack Redact synchronous runtime optimization hook (ADR #8)
  return {
    ...config,
    env: {
      ...config.env,
      NEXT_PUBLIC_REDACT_RUNTIME: 'enabled',
    },
  };
}

const baseConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/ui', '@repo/shared-schemas'],
  images: {
    formats: ['image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@repo/ui', 'd3'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default withRedactExperimental(baseConfig);
