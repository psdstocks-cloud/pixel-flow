// Before (WRONG for App Router)
const beforeNextConfigExample = {
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
  // ...
}

// After (CORRECT for App Router)
const nextConfig = {
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}
