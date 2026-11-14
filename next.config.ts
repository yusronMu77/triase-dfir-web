import path from 'node:path';
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  // Do not name the server stack in responses (X-Powered-By: Next.js); e2e WEB-DEMO-002.
  poweredByHeader: false,
  transpilePackages: ['@astria/ui'],
  turbopack: {
    root: path.resolve(import.meta.dirname, '..'),
    resolveAlias: {
      react: './web/node_modules/react',
      'react-dom': './web/node_modules/react-dom',
    },
  },
  outputFileTracingRoot: path.resolve(import.meta.dirname, '..'),
  // Local development without Caddy: set ASTRIA_API_ORIGIN (for example the api container's published address)
  // so the browser keeps calling same-origin /api/v1. Unset in production, where Caddy routes /api/v1/*.
  async rewrites() {
    const origin = process.env.ASTRIA_API_ORIGIN?.trim().replace(/\/+$/, '');
    return origin ? [{ source: '/api/v1/:path*', destination: `${origin}/api/v1/:path*` }] : [];
  },
};
export default nextConfig;
