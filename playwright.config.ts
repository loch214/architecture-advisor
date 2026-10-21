import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/** One production server per AI setting: AI off for the main flow, plus AI_MODE=mock fixtures (no AI service is called). */
export const MOCK_PORTS = { ok: 3101, fail: 3102, reorder: 3103 } as const;

const server = (port: number, env: Record<string, string>) => ({
  command: `npm run start -- --port ${port}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: true,
  timeout: 60_000,
  env,
});

/** Set PW_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's own Chromium. */
const channel = process.env.PW_CHANNEL;

/** A few end-to-end checks of the main flow (TESTING_STRATEGY §5), run against a production build. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: [
    server(PORT, { AI_MODE: "off" }),
    ...Object.entries(MOCK_PORTS).map(([mock, port]) => server(port, { AI_MODE: "mock", AI_MOCK: mock })),
  ],
});
