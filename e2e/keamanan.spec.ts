import { expect, test } from '@playwright/test';
import { waitMapIdle } from './utils';

// Origin yang boleh memuat script (selaras CSP di web/security-headers.js).
const SCRIPT_ORIGIN_DIIZINKAN = ['http://localhost:4173', 'https://challenges.cloudflare.com'];

test.describe('keamanan-ringan', () => {
  test('response dokumen membawa header CSP & X-Content-Type-Options', async ({ page }) => {
    const res = await page.goto('/peta');
    const headers = res!.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('geolocation=()');
  });

  test('halaman tidak memuat script dari origin asing di luar daftar', async ({ page }) => {
    const scriptAsing: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() !== 'script') return;
      const origin = new URL(req.url()).origin;
      if (!SCRIPT_ORIGIN_DIIZINKAN.includes(origin)) scriptAsing.push(req.url());
    });
    await page.goto('/peta');
    await waitMapIdle(page);
    await page.goto('/analisis');
    await page.getByTestId('indikator-kawasan').waitFor();
    expect(scriptAsing).toEqual([]);
  });
});
