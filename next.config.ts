import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdfjs-dist",
    "read-excel-file",
    "sharp",
  ],
};

export default nextConfig;
