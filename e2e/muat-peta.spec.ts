import { expect, test } from '@playwright/test';
import { countRendered, waitMapIdle } from './utils';

test.describe('muat-peta', () => {
  test('menampilkan canvas MapLibre, legend, dan feature kawasan ter-render', async ({
    page
  }) => {
    await page.goto('/peta');
    await waitMapIdle(page);

    await expect(page.locator('.maplibregl-canvas')).toHaveCount(1);

    // legenda dibuka lewat toolbar
    await page.getByTestId('btn-panel-legenda').click();
    await expect(page.getByTestId('legend')).toBeVisible();

    const nKawasan = await countRendered(page, 'kawasan-buffer-fill');
    expect(nKawasan).toBeGreaterThan(0);
  });
});
