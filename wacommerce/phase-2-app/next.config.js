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
  // Allow production builds to succeed even with TS/lint warnings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
