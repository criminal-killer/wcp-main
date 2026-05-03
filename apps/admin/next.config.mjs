/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Prevent webpack from trying to bundle native Node modules.
  // @libsql/client and drizzle-orm use Node.js APIs incompatible with
  // the webpack bundler — they must run in the Node.js runtime, not Edge/browser.
  experimental: {
    serverComponentsExternalPackages: [
      '@libsql/client',
      'drizzle-orm',
      'libsql',
    ],
  },
  // Transpile local workspace packages (packages/db, packages/shared)
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
