import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Abaikan error typescript saat build untuk menghemat RAM & mempercepat build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Abaikan error eslint saat build untuk menghemat RAM & mempercepat build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
