import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel-optimized configuration */
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  
  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },
  
  // Image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'thesimgov.com',
      },
      {
        protocol: 'https',
        hostname: '*.thesimgov.com',
      },
    ],
  },
  
  // Ensure trailing slashes are consistent
  trailingSlash: false,
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Strict mode for React
  reactStrictMode: true,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // Suppress source map warnings from node_modules
  // These are cosmetic warnings from Next.js/mongoose internals
  webpack: (config, { isServer }) => {
    // Ignore source-map-loader warnings for node_modules
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { message: /source map/ },
    ];
    return config;
  },
};

export default nextConfig;
