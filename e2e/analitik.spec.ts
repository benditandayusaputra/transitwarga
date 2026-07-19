import { expect, test } from '@playwright/test';

test.describe('analitik', () => {
  test('menampilkan indikator dan compare dua kawasan menghasilkan dua kolom angka', async ({
    page
  }) => {
    await page.goto('/analisis');
    const kartu = page.getByTestId('indikator-kawasan').locator('dd');
    await expect(kartu).toHaveCount(4);
    for (const teks of await kartu.allTextContents()) {
      expect(teks.trim()).not.toBe('');
    }
    // DuckDB aktif -> pesan fallback tidak tampil dan grafik ada
    await expect(page.getByTestId('fallback-message')).toHaveCount(0);

    await page.getByTestId('compare-select-a').selectOption('mrt-blok-m');
    await page.getByTestId('compare-select-b').selectOption('tj-harmoni');
    const tabel = page.getByTestId('compare-table');
    await expect(tabel).toBeVisible();
    await expect(tabel.locator('thead th')).toHaveCount(3); // label + 2 kawasan
    // enam metrik x dua kolom angka
    await expect(tabel.locator('tbody td')).toHaveCount(12);
    for (const teks of await tabel.locator('tbody td').allTextContents()) {
      expect(teks.trim()).not.toBe('');
    }
  });
});

test.describe('fallback-analitik', () => {
  test('blokir wasm duckdb -> indikator agregat + pesan fallback tampil', async ({ page }) => {
    // Request .wasm terjadi di dalam Web Worker (tidak lewat page.route),
    // jadi blokir seluruh aset duckdb yang dimuat main thread (worker & chunk)
    // beserta wasm-nya.
    await page.route('**/*duckdb*', (route) => route.abort());
    await page.goto('/analisis');
    // worker gagal dimuat -> init duckdb menggantung -> timeout init (12 dtk)
    // memicu fallback; beri ruang waktu lebih
    await expect(page.getByTestId('fallback-message')).toBeVisible({ timeout: 30_000 });
    const kartu = page.getByTestId('indikator-kawasan').locator('dd');
    await expect(kartu).toHaveCount(4);
    // compare tetap bekerja dari agregat.json
    await page.getByTestId('compare-select-a').selectOption('mrt-blok-m');
    await page.getByTestId('compare-select-b').selectOption('tj-harmoni');
    await expect(page.getByTestId('compare-table')).toBeVisible();
  });
});
