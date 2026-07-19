import { defineConfig, devices } from '@playwright/test';

/**
 * E2E TransitWarga (blueprint fase 6).
 *
 * webServer: build preview web (jalankan `pnpm e2e` dari root — script itu
 * mem-build web dulu) + wrangler dev api. Tanpa .dev.vars, API otomatis memakai
 * provider mock deterministik dan melewati Turnstile — tidak butuh API key.
 *
 * Smoke test produksi (fase 7): set E2E_BASE_URL (URL web produksi) — server
 * lokal tidak dinyalakan; jalankan subset, mis.
 *   E2E_BASE_URL=https://transitwarga.vercel.app npx playwright test \
 *     e2e/muat-peta.spec.ts e2e/keamanan.spec.ts --project=chromium
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] }
    }
  ],
  // Saat menguji URL produksi (E2E_BASE_URL di-set), server lokal tidak dinyalakan.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm --filter web preview --port 4173',
          port: 4173,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000
        },
        {
          command: 'pnpm --filter api exec wrangler dev --port 8787',
          port: 8787,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000
        }
      ]
});
