import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
