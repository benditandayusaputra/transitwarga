import { expect, test } from '@playwright/test';
import { clickLngLat, JSON_CORS_HEADERS, sembunyikanUsaha, STASIUN, waitMapIdle } from './utils';

const NARASI_BERBAHAYA =
  'Narasi tetap dari mock. <script>window.__xss = true<' + '/script> <img src=x onerror=alert(1)>';

test.describe('panel-kawasan', () => {
  test('klik kawasan memunculkan panel indikator; narasi AI dirender sebagai teks', async ({
    page,
    isMobile
  }) => {
    // Mock /api/summary di level jaringan (deterministik, payload berisi tag script)
    await page.route('**/api/summary/**', (route) => {
      const kawasanId = route.request().url().split('/').pop()!;
      return route.fulfill({
        headers: JSON_CORS_HEADERS,
        body: JSON.stringify({
          kawasan_id: kawasanId,
          data_version: '2026-01-01',
          narasi: NARASI_BERBAHAYA,
          indikator: { n_usaha: 7, harga_median: 15000, pct_digital: 42, tipologi: 'potensi' }
        })
      });
    });

    await page.goto('/peta');
    await waitMapIdle(page);

    // marker ikon usaha bisa menutupi titik stasiun: sembunyikan dulu
    await sembunyikanUsaha(page, isMobile ?? false);
    await clickLngLat(page, STASIUN.blokM.lnglat);

    const panel = page.getByTestId('kawasan-panel');
    await expect(panel).toBeVisible();
    // indikator kawasan (dari agregat) tampil
    await expect(panel.locator('dl').first().locator('dd')).toHaveCount(4);

    // narasi mock tampil APA ADANYA sebagai teks: tag tidak dieksekusi/disuntik
    const narasi = page.getByTestId('ai-summary');
    await expect(narasi).toBeVisible();
    await expect(narasi).toContainText('<script>');
    await expect(narasi.locator('script, img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as { __xss?: boolean }).__xss)).toBeUndefined();

    // perbesar jadi dialog penuh -> lebih nyaman dibaca; lalu perkecil kembali
    await page.getByTestId('kawasan-perbesar').click();
    const dialog = page.getByTestId('kawasan-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('ai-summary')).toContainText('<script>');
    await page.getByTestId('kawasan-perkecil').click();
    await expect(dialog).toHaveCount(0);
    await expect(panel).toBeVisible();
  });
});
