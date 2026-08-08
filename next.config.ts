import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdfjs-dist",
    "tesseract.js",
    "read-excel-file",
    "sharp",
  ],
};

export default nextConfig;
