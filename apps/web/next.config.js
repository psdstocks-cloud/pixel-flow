/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pixel-flow/database'],
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://apis.google.com https://*.railway.app https://pixel-flow-production.up.railway.app",
              "frame-src 'self' https://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
