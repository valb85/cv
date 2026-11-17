import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // better-sqlite3 is a native module and puppeteer-core resolves its own
  // files at runtime; keep both external to the server bundle.
  serverExternalPackages: ['better-sqlite3', 'puppeteer-core'],
};

export default nextConfig;
