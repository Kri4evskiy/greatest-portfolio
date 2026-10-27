import type { NextConfig } from 'next';

const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
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

export default nextConfig;
