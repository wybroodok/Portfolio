import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served as a sub-app of the Portfolio under /Kinetik. basePath makes Next emit
  // every route and asset URL under that prefix so the Portfolio's Express server
  // can reverse-proxy /Kinetik → this standalone Next server.
  basePath: "/Kinetik",
  experimental: {
    // Server Actions are stable in Next 15; raise the body limit for rich text.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
