import type { Page } from '@playwright/test';

/** Tipe minimal instance MapLibre yang diekspos MapView di window.__twMap. */
export interface TwMapHandle {
  queryRenderedFeatures: (
    optsOrPoint?: unknown,
    opts?: unknown
  ) => { properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }[];
  getLayoutProperty: (layer: string, prop: string) => unknown;
  getFilter: (layer: string) => unknown;
  getCenter: () => { lng: number; lat: number };
  getZoom: () => number;
  project: (lnglat: [number, number]) => { x: number; y: number };
  jumpTo: (opts: { center: [number, number]; zoom: number }) => void;
  once: (ev: string, cb: () => void) => void;
}

declare global {
  interface Window {
    __twMap: TwMapHandle;
  }
}

/** Tunggu peta selesai render pertama kali (event idle MapLibre). */
export async function waitMapIdle(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="map-container"][data-map-idle="true"]', {
    timeout: 60_000
  });
}

/** Pindahkan kamera lalu tunggu idle berikutnya (untuk melihat layer titik z>=12). */
export async function jumpTo(page: Page, center: [number, number], zoom: number): Promise<void> {
  await page.evaluate(
    async ({ center, zoom }) => {
      const m = window.__twMap;
      await new Promise<void>((resolve) => {
        m.once('idle', () => resolve());
        m.jumpTo({ center, zoom });
      });
    },
    { center, zoom }
  );
}

/**
 * Klik posisi peta berdasarkan koordinat geografis. project() MapLibre relatif
 * ke kontainer peta, sedangkan mouse Playwright memakai koordinat viewport ,
 * offset kontainer (header di atas peta) harus ditambahkan.
 */
export async function clickLngLat(
  page: Page,
  lnglat: [number, number],
  useTouch = false,
  offset: { dx?: number; dy?: number } = {}
): Promise<void> {
  const box = await page.getByTestId('map-container').boundingBox();
  if (!box) throw new Error('kontainer peta tidak ditemukan');
  const p = await page.evaluate((ll) => window.__twMap.project(ll as [number, number]), lnglat);
  const x = box.x + p.x + (offset.dx ?? 0);
  const y = box.y + p.y + (offset.dy ?? 0);
  if (useTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/**
 * Sembunyikan layer titik usaha lewat panel Layer (interaksi pengguna sah).
 * Dipakai test yang mengklik stasiun/buffer supaya marker ikon usaha tidak
 * menutupi titik klik. Panel dibuka lalu ditutup lagi agar tidak menghalangi.
 */
export async function sembunyikanUsaha(page: Page, _isMobile: boolean): Promise<void> {
  await page.getByTestId('btn-panel-layer').click();
  await page.getByTestId('layer-toggle-usaha').click();
  // titik observasi lapangan juga bisa menutupi stasiun (prioritas klik tertinggi)
  await page.getByTestId('layer-toggle-survey').click();
  // tunggu sampai render benar-benar menerapkan visibility none; tanpa ini
  // klik berikutnya bisa masih mengenai ikon usaha (race render)
  await page.waitForFunction(() => {
    const m = window.__twMap;
    return (
      m.getLayoutProperty('usaha-icon', 'visibility') === 'none' &&
      m.getLayoutProperty('survey-circle', 'visibility') === 'none' &&
      m.queryRenderedFeatures({ layers: ['usaha-icon', 'survey-circle'] } as never).length === 0
    );
  });
  await page.getByTestId('btn-panel-layer').click(); // tutup panel
}

export function countRendered(page: Page, layer: string): Promise<number> {
  return page.evaluate(
    (l) => window.__twMap.queryRenderedFeatures({ layers: [l] } as never).length,
    layer
  );
}

/** Susun body SSE untuk mock /api/chat. */
export function sseBody(
  events: { event: string; data: Record<string, unknown> }[]
): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join('');
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Access-Control-Allow-Origin': '*'
};

export const JSON_CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

/** Koordinat stasiun untuk navigasi test (samakan dgn pipeline stations.py). */
export const STASIUN = {
  blokM: { id: 'mrt-blok-m', lnglat: [106.798, -6.2444] as [number, number] },
  senayan: { id: 'mrt-senayan', lnglat: [106.8025, -6.2266] as [number, number] },
  lebakBulus: { id: 'mrt-lebak-bulus', lnglat: [106.7745, -6.2894] as [number, number] }
};
