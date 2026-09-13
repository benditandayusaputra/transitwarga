import { expect, test } from '@playwright/test';
import { clickLngLat, countRendered, jumpTo, STASIUN, waitMapIdle } from './utils';

test.describe('interaksi-wajib-lomba', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/peta');
    await waitMapIdle(page);
  });

  test('toggle layer control menyembunyikan layer', async ({ page }) => {
    await page.getByTestId('btn-panel-layer').click();
    await page.getByTestId('layer-toggle-transit').click();
    await expect
      .poll(() => page.evaluate(() => window.__twMap.getLayoutProperty('transit-circle', 'visibility')))
      .toBe('none');

    await page.getByTestId('layer-toggle-transit').click();
    await expect
      .poll(() => page.evaluate(() => window.__twMap.getLayoutProperty('transit-circle', 'visibility')))
      .toBe('visible');
  });

  test('filter jenis_tempat mengubah jumlah titik ter-render', async ({ page, isMobile }) => {
    // di layar sempit panel filter default tertutup: buka lewat toolbar
    if (isMobile) await page.getByTestId('btn-panel-filter').click();
    await jumpTo(page, STASIUN.blokM.lnglat, 14);
    const sebelum = await countRendered(page, 'usaha-icon');
    expect(sebelum).toBeGreaterThan(0);

    // pilih jenis yang bukan mayoritas supaya jumlah pasti berubah
    const distribusi = await page.evaluate(() => {
      const feats = window.__twMap.queryRenderedFeatures({ layers: ['usaha-icon'] } as never);
      const per: Record<string, number> = {};
      for (const f of feats) {
        const j = String(f.properties.jenis_tempat);
        per[j] = (per[j] ?? 0) + 1;
      }
      return per;
    });
    const jenisMinoritas = Object.entries(distribusi)
      .filter(([, n]) => n < sebelum)
      .sort((a, b) => a[1] - b[1])[0]?.[0];
    expect(jenisMinoritas, 'butuh lebih dari satu jenis usaha di viewport').toBeTruthy();

    await page.getByTestId(`filter-jenis-${jenisMinoritas}`).click();
    await expect.poll(() => countRendered(page, 'usaha-icon')).toBe(distribusi[jenisMinoritas!]);

    await page.getByTestId('filter-reset').click();
    await expect.poll(() => countRendered(page, 'usaha-icon')).toBe(sebelum);
  });

  test('pencarian lokasi memusatkan peta ke hasil terpilih', async ({ page }) => {
    await page.getByTestId('search-input').fill('Harmoni');
    const hasil = page.getByTestId('search-result').first();
    await expect(hasil).toBeVisible();
    await hasil.click();
    // peta terbang ke Harmoni Central (-6.1665, 106.8194) dan panel kawasan terbuka
    await expect
      .poll(async () => {
        const c = await page.evaluate(() => window.__twMap.getCenter());
        return Math.hypot(c.lng - 106.8194, c.lat - -6.1665);
      })
      .toBeLessThan(0.005);
    await expect(page.getByTestId('kawasan-panel')).toBeVisible();
  });

  test('ganti basemap realtime; layer proyek tetap terpasang', async ({ page }) => {
    await page.getByTestId('btn-panel-layer').click();
    await page.getByTestId('basemap-satellite').click();
    // getStyle() bisa undefined sesaat di tengah pergantian style
    await expect
      .poll(() => page.evaluate(() => window.__twMap.getStyle()?.name ?? ''))
      .toBe('Satellite');
    await expect.poll(() => countRendered(page, 'kawasan-buffer-fill')).toBeGreaterThan(0);

    await page.getByTestId('basemap-dark').click();
    await expect
      .poll(() => page.evaluate(() => window.__twMap.getStyle()?.name ?? ''))
      .toBe('Dark Mapid');
    await expect.poll(() => countRendered(page, 'kawasan-buffer-fill')).toBeGreaterThan(0);
  });

  test('klik titik usaha memunculkan popup dengan nama', async ({ page }) => {
    await jumpTo(page, STASIUN.blokM.lnglat, 15);

    // pilih titik yang tidak tertutup overlay UI (search, toolbar, panel)
    const box = await page.getByTestId('map-container').boundingBox();
    const overlays: { x: number; y: number; width: number; height: number }[] = [];
    for (const sel of [
      '[data-testid="search-input"]',
      'nav[aria-label="Kontrol peta"]',
      'nav[aria-label="Kontrol peta ponsel"]',
      '[data-testid="filter-bar"]',
      '[data-testid="asisten-dock"]',
      '.maplibregl-ctrl-top-right',
      '.maplibregl-ctrl-bottom-left',
      '.maplibregl-ctrl-bottom-right'
    ]) {
      // page.$ tidak menunggu elemen muncul: overlay yang tidak ada dilewati
      const el = await page.$(sel);
      const bb = el ? await el.boundingBox() : null;
      if (bb) overlays.push(bb);
    }
    const target = await page.evaluate(
      ({ overlays, asal, tinggi }) => {
        const aman = (px: number, py: number) =>
          overlays.every(
            (o) =>
              px < o.x - 10 || px > o.x + o.width + 10 || py < o.y - 10 || py > o.y + o.height + 10
          );
        const feats = window.__twMap.queryRenderedFeatures({ layers: ['usaha-icon'] } as never);
        for (const f of feats) {
          const p = window.__twMap.project(f.geometry.coordinates);
          const px = asal.x + p.x;
          const py = asal.y + p.y;
          if (px > 20 && py > asal.y + 20 && py < asal.y + tinggi - 40 && aman(px, py)) {
            return { lnglat: f.geometry.coordinates, nama: String(f.properties.nama) };
          }
        }
        return null;
      },
      { overlays, asal: { x: box!.x, y: box!.y }, tinggi: box!.height }
    );
    expect(target, 'butuh titik usaha ter-render yang bebas overlay').not.toBeNull();

    // ikon pin ber-anchor bawah: klik di tengah badan pin, bukan ujungnya
    await clickLngLat(page, target!.lnglat, false, { dy: -10 });
    await expect(page.getByTestId('usaha-popup')).toBeVisible();
    await expect(page.getByTestId('usaha-popup').locator('h3')).toHaveText(target!.nama);

    // tahap 2 (DuckDB): foto tempat tampil dan benar-benar termuat
    const foto = page.getByTestId('foto-usaha');
    await expect(foto).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() => foto.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  });
});
