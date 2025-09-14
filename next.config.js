/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'static',
  distDir: 'out',
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
