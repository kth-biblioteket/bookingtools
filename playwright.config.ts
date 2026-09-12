import { defineConfig, devices } from "@playwright/test";

const TEST_DATABASE_URL = "postgresql://kth_grupprum:kth_grupprum@localhost:5434/kth_grupprum_test";
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bash -c "export NVM_DIR=\\"$HOME/.nvm\\" && source \\"$NVM_DIR/nvm.sh\\" && nvm use 22 && next dev -p ${PORT}"`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      PORT: String(PORT),
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
