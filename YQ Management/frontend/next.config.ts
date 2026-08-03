import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // @ts-expect-error skipWaiting is commonly used but missing from types
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options */
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig);
