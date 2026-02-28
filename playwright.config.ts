import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node --import tsx/esm src/test-server.ts",
    url: "http://localhost:3001/health",
    reuseExistingServer: !process.env["CI"],
    timeout: 120000,
    env: {
      PORT: "3001",
      MONGOMS_DOWNLOAD_DIR: "./.cache/mongodb-binaries",
      MONGOMS_VERSION: "7.0.14",
    },
  },
});

