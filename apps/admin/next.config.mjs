/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Turso/libsql must run in Node.js runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: [
      '@libsql/client',
      'drizzle-orm',
      'libsql',
    ],
  },
  // Transpile local workspace packages (packages/db, packages/shared)
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
}

export default nextConfig
