/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
  experimental: {
    optimizePackageImports: [],
  },
}
export default nextConfig
