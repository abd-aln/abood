/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static HTML export
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features not supported by Cloudflare Pages
  experimental: {
    appDir: true,
  }
}

module.exports = nextConfig
