import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'gomoonbeam.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'userogue.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Increase timeout to 2 minutes for long-running AI tasks
      executionTimeout: 120,
    },
  },
};

export default nextConfig;
