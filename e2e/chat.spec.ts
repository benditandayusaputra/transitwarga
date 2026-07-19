import { expect, test } from '@playwright/test';
import {
  clickLngLat,
  JSON_CORS_HEADERS,
  sembunyikanUsaha,
  SSE_HEADERS,
  sseBody,
  STASIUN,
  waitMapIdle
} from './utils';

test.describe('chat-menggerakkan-peta', () => {
  test('delta streaming tampil, map_action menggerakkan viewport & highlight; target asing diabaikan', async ({
    page,
    isMobile
  }) => {
    let panggilan = 0;
    await page.route('**/api/chat', (route) => {
      panggilan += 1;
      if (panggilan === 1) {
        return route.fulfill({
          headers: SSE_HEADERS,
          body: sseBody([
            { event: 'delta', data: { text: 'Kawasan Senayan ' } },
            { event: 'delta', data: { text: 'paling menonjol ' } },
            { event: 'delta', data: { text: 'berdasarkan kepadatan.' } },
            {
              event: 'map_action',
              data: { type: 'highlight_kawasan', target: [STASIUN.senayan.id] }
            },
            { event: 'done', data: { usage: {} } }
          ])
        });
      }
      return route.fulfill({
        headers: SSE_HEADERS,
        body: sseBody([
          { event: 'delta', data: { text: 'Aksi kedua menunjuk kawasan asing.' } },
          {
            event: 'map_action',
            data: { type: 'highlight_kawasan', target: ['kawasan-tidak-dikenal'] }
          },
          { event: 'done', data: { usage: {} } }
        ])
      });
    });
    await page.route('**/api/summary/**', (route) =>
      route.fulfill({
        headers: JSON_CORS_HEADERS,
        body: JSON.stringify({
          kawasan_id: 'x',
          data_version: 'x',
          narasi: 'ringkasan tetap',
          indikator: { n_usaha: 1, harga_median: 1, pct_digital: 1, tipologi: 'potensi' }
        })
      })
    );

    await page.goto('/peta');
    await waitMapIdle(page);

    // buka panel AI lewat klik stasiun (ikon usaha disembunyikan dulu supaya
    // klik pasti mengenai stasiun/buffer, bukan marker usaha)
    await sembunyikanUsaha(page, isMobile ?? false);
    await clickLngLat(page, STASIUN.blokM.lnglat);
    await expect(page.getByTestId('ai-panel')).toBeVisible();

    // pertanyaan pertama -> narasi dirangkai dari beberapa delta + peta bergerak
    await page.getByTestId('chat-input').fill('kawasan mana yang menonjol?');
    await page.getByTestId('chat-kirim').click();
    await expect(
      page.getByTestId('chat-messages').locator('[data-role="assistant"]').last()
    ).toHaveText('Kawasan Senayan paling menonjol berdasarkan kepadatan.');

    await expect
      .poll(() => page.evaluate(() => JSON.stringify(window.__twMap.getFilter('kawasan-highlight'))))
      .toContain(STASIUN.senayan.id);
    await expect
      .poll(async () => {
        const c = await page.evaluate(() => window.__twMap.getCenter());
        return Math.hypot(c.lng - STASIUN.senayan.lnglat[0], c.lat - STASIUN.senayan.lnglat[1]);
      })
      .toBeLessThan(0.01);

    // pertanyaan kedua -> aksi target asing diabaikan tanpa error UI
    await page.getByTestId('chat-input').fill('coba aksi tidak valid');
    await page.getByTestId('chat-kirim').click();
    await expect(
      page.getByTestId('chat-messages').locator('[data-role="assistant"]').last()
    ).toHaveText('Aksi kedua menunjuk kawasan asing.');
    await expect(page.getByTestId('chat-error')).toHaveCount(0);
    const highlight = await page.evaluate(() =>
      JSON.stringify(window.__twMap.getFilter('kawasan-highlight'))
    );
    expect(highlight).not.toContain('kawasan-tidak-dikenal');
  });
});
