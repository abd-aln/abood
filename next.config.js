/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static HTML export
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features not supported by Cloudflare Pages
  experimental: {
    appDir: true,
    esmExternals: "loose" // Add this to handle ESM/CJS conflicts
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Add polyfills and resolve issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
    };
    return config;
  },
}

module.exports = nextConfig
