import path from "path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
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
      name: "unit",
      testMatch: "unit/**/*.spec.ts",
    },
    {
      name: "setup",
      testMatch: "e2e/auth.setup.ts",
    },
    {
      name: "chromium",
      testMatch: "e2e/**/*.spec.ts",
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
