import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "tests/e2e/report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on",
    video: "on",
    screenshot: "on",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "setup",
      testMatch: "auth.setup.ts",
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        storageState: "tests/e2e/.auth/user.json",
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
      },
      dependencies: ["setup"],
    },
  ],
});
