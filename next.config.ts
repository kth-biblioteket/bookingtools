import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow the Playwright test server to use a separate build/dev cache dir
  // so it never collides with the human's dev server running on port 3000.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
