/**
 * @file next.config.js
 * @description Next.js 15 configuration for Business & Politics Simulation MMO
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Production-ready Next.js configuration with strict TypeScript,
 * optimized images, security headers, and custom server support.
 */

const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack configuration to pin workspace root and silence multi-lockfile warnings
  turbopack: {
    // Absolute path to the application root
    root: __dirname,
  },

  // Ensure test-only Mongo memory server tooling is never bundled into the
  // runtime/server build. This prevents dev-time warnings about mismatched
  // mongodb versions between the app (6.x) and mongodb-memory-server (4.x).
  webpack: (config, { isServer }) => {
    if (typeof config.externals === 'undefined') {
      config.externals = [];
    }

    if (isServer) {
      config.externals.push('mongodb-memory-server', 'mongodb-memory-server-core');
    }

    return config;
  },
};

module.exports = nextConfig;
