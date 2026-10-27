import type { NextConfig } from 'next';

const enableRedact = process.env.ENABLE_REDACT === 'true';

function withRedactExperimental(config: NextConfig): NextConfig {
  if (!enableRedact) {
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

const baseConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/ui', '@repo/shared-schemas'],
  images: {
    formats: ['image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@repo/ui', 'd3'],
  },
};

export default withRedactExperimental(baseConfig);
