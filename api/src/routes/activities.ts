/** GET /api/activities: proxy Community Maps MAPID (#Devunder).

server.mapid.io menolak request browser yang membawa header Origin (403),
jadi Worker yang memanggilnya. Parameter kueri ditetapkan di sini (bukan dari
klien) supaya key tim tidak bisa dipakai menarik data lain. Hasil di-cache KV
10 menit.
*/

import { Hono } from 'hono';
import type { Env } from '../env';

const MAPID_URL = 'https://server.mapid.io/web/competition/activities';
const DEFAULT_MAPID_KEY = '6a919d9453df37905b3a5d49';
const TTL_S = 600;
const CACHE_KEY = 'activities:devunder';

const QUERY = {
  feature: {
    type: 'Polygon',
    coordinates: [
      [
        [106.3, -7.0],
        [107.3, -7.0],
        [107.3, -5.9],
        [106.3, -5.9],
        [106.3, -7.0]
      ]
    ]
  },
  start_date: '2024-01-01',
  end_date: '2026-12-31',
  hashtag: ['Devunder']
};

export const activitiesRoute = new Hono<{ Bindings: Env }>();

activitiesRoute.get('/api/activities', async (c) => {
  const cached = await c.env.SUMMARY_CACHE.get(CACHE_KEY);
  if (cached) {
    return c.body(cached, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${TTL_S}`,
      'X-Cache': 'HIT'
    });
  }
  const res = await fetch(MAPID_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': c.env.MAPID_API_KEY ?? DEFAULT_MAPID_KEY
    },
    body: JSON.stringify(QUERY)
  });
  const text = await res.text();
  if (!res.ok) {
    return c.json({ success: false, message: `MAPID ${res.status}` }, 502);
  }
  await c.env.SUMMARY_CACHE.put(CACHE_KEY, text, { expirationTtl: TTL_S });
  return c.body(text, 200, {
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${TTL_S}`,
    'X-Cache': 'MISS'
  });
});
