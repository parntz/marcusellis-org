import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {},
  turbopack: {
    root: path.resolve()
  }
};

export default nextConfig;
