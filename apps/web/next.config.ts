import type { NextConfig } from 'next';
import path from 'node:path';

/**
 * STATIC_EXPORT=1 → export statique pour GitHub Pages (basePath /recomp, sans route API :
 * le coach bascule alors automatiquement sur le moteur déterministe côté client).
 * Sans la variable → mode serveur complet (dev local, Vercel), avec /api/coach.
 */
const isStatic = process.env.STATIC_EXPORT === '1';
const basePath = process.env.BASE_PATH ?? (isStatic ? '/recomp' : '');

const nextConfig: NextConfig = {
  transpilePackages: ['@recomp/engine', '@recomp/ai'],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  ...(isStatic
    ? { output: 'export', basePath, assetPrefix: basePath + '/', trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
