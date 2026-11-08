import path from 'node:path';
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@astria/ui'],
  turbopack: {
    root: path.resolve(import.meta.dirname, '..'),
    resolveAlias: {
      react: './web/node_modules/react',
      'react-dom': './web/node_modules/react-dom',
    },
  },
  outputFileTracingRoot: path.resolve(import.meta.dirname, '..'),
};
export default nextConfig;
