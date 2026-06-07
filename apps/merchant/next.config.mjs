/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Turso/libsql must run in Node.js runtime, not Edge
  serverExternalPackages: ['@libsql/client', 'drizzle-orm', 'libsql', '@mastra/core', '@mastra/core/agent', '@mastra/core/tools'],
  // Transpile local workspace packages
  transpilePackages: ['@chatevo/db', '@chatevo/shared'],
}

export default nextConfig
