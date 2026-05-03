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
    serverComponentsExternalPackages: ['@libsql/client', 'drizzle-orm'],
  },
  // Transpile local workspace packages
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
