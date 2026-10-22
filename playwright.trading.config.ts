import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/trading/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "tests/trading/report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "cd ml && ./.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8100",
      url: "http://127.0.0.1:8100/health",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "npm run dev -- --port 3100",
      url: "http://localhost:3100/deepbridge",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NEXT_PUBLIC_TRADING_API_URL: "http://127.0.0.1:8100" },
    },
  ],
});