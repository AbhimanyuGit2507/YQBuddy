import type { NextConfig } from "next";
// @ts-expect-error next-pwa doesn't have types for some reason
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options */
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig);
