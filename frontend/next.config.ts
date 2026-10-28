import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Also makes next/jest transform the package's ESM theme runtime.
  transpilePackages: ["@orchard-cde/design"],
};

export default nextConfig;
