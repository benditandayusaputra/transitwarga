import { expect, test } from '@playwright/test';
import { clickLngLat, sembunyikanUsaha, STASIUN, waitMapIdle } from './utils';

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'hanya untuk project mobile');

  test('panel AI muncul sebagai bottom-sheet, bisa dibuka-tutup; peta bisa di-pan', async ({
    page
  }) => {
    await page.goto('/peta');
    await waitMapIdle(page);

    // buka panel lewat klik stasiun (ikon usaha disembunyikan supaya tap
    // pasti mengenai stasiun; helper menutup kembali kontrolnya)
    await sembunyikanUsaha(page, true);
    await clickLngLat(page, STASIUN.blokM.lnglat, true);

    const panel = page.getByTestId('kawasan-panel');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('ai-panel')).toBeVisible();

    // bottom-sheet: menempel sisi bawah viewport
    const posisi = await panel.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        position: getComputedStyle(el).position,
        menempelBawah: Math.abs(r.bottom - window.innerHeight) < 2
      };
    });
    expect(posisi.position).toBe('fixed');
    expect(posisi.menempelBawah).toBe(true);

    // tutup
    await page.getByTestId('kawasan-panel-close').click();
    await expect(panel).toHaveCount(0);

    // peta tetap bisa di-pan (drag mengubah center)
    const sebelum = await page.evaluate(() => window.__twMap.getCenter());
    const kotak = await page.locator('.maplibregl-canvas').boundingBox();
    const cx = kotak!.x + kotak!.width / 2;
    const cy = kotak!.y + kotak!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 120, cy - 80, { steps: 8 });
    await page.mouse.up();
    const sesudah = await page.evaluate(() => window.__twMap.getCenter());
    expect(Math.hypot(sesudah.lng - sebelum.lng, sesudah.lat - sebelum.lat)).toBeGreaterThan(0.001);
  });
});
