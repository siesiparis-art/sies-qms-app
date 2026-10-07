import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sies-qms-app",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
