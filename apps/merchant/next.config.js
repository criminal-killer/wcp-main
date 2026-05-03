/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Turso/libsql must run in Node.js runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'drizzle-orm'],
  },
  // Transpile local workspace packages
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
  // Allow production builds to succeed even with TS/lint warnings
  // TODO: Remove once all type errors are fixed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
