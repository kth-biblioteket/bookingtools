import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow the Playwright test server to use a separate build/dev cache dir
  // so it never collides with the human's dev server running on port 3000.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Next.js blocks cross-origin requests to dev-only assets/endpoints by
  // default (e.g. Server Actions), which silently breaks all client
  // interactivity when testing on a phone via the dev machine's LAN IP
  // instead of localhost — the page renders fine (static HTML), but every
  // onClick that depends on hydrated JS does nothing. Allowlisting the LAN
  // origin fixes that for local network testing.
  allowedDevOrigins: ["192.168.1.110"],
  // Set only for a production Docker build served under a Traefik
  // PathPrefix instead of at a domain's root. Must be set to the same value
  // both at build time (bakes basePath into asset URLs — see the
  // `BASE_PATH` build arg in Dockerfile) and at container runtime (`next
  // start` re-reads this config and won't route/serve under the prefix
  // otherwise) — see the BASE_PATH env var in docker-compose.prod.yml.
  ...(process.env.BASE_PATH ? { basePath: process.env.BASE_PATH } : {}),
};

export default nextConfig;
