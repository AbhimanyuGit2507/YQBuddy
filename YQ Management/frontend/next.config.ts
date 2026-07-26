import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Production configuration
  ...(isProduction && {
    output: 'standalone',
    images: {
      unoptimized: true,
    },
  }),
  
  // API proxy for development
  async rewrites() {
    if (!isProduction) {
      return [];
    }
    return [];
  },
};

export default nextConfig;
