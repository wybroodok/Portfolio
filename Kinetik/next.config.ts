import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions are stable in Next 15; raise the body limit for rich text.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
