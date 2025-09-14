/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/abood',
  assetPrefix: '/abood/',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig
