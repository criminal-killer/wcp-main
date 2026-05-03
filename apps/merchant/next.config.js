/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Turso/libsql must run in Node.js runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'drizzle-orm', 'libsql'],
  },
  // Transpile local workspace packages
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
}

module.exports = nextConfig
