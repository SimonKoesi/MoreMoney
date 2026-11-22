import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-libsql', '@libsql/client'],
  poweredByHeader: false,
};
export default config;
