import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@recomp/engine', '@recomp/ai'],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
