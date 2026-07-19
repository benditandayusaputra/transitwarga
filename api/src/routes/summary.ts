/** GET /api/summary/:kawasanId (blueprint 6.2).

Alur: validasi id -> cek KV -> hit: langsung balas -> miss: cek kuota,
panggil LLM via adapter, validasi, simpan KV (TTL 30 hari). Cacheable CDN
(Cache-Control public max-age 86400): klik kedua siapa pun tidak menyentuh LLM.
*/

import { Hono } from 'hono';
import { DATA_VERSION, findKawasan } from '../data/agregat';
import { apiError } from '../errors';
import { cekDanNaikkanKuota } from '../middleware/dailyQuota';
import { generateSummary, resolveModel } from '../llm/provider';
import { summaryResponseSchema } from '../llm/schemas';
import type { Env } from '../env';

const TTL_KV_S = 30 * 86400;
const CACHE_CONTROL = 'public, max-age=86400';

export const summaryRoute = new Hono<{ Bindings: Env }>();

summaryRoute.get('/api/summary/:kawasanId', async (c) => {
  const id = c.req.param('kawasanId');
  const kawasan = findKawasan(id);
  if (!kawasan) {
    return apiError(c, 'INVALID_INPUT', `kawasan tidak dikenal: ${id}`);
  }

  const cacheKey = `summary:${id}:${DATA_VERSION}`;
  const cached = await c.env.SUMMARY_CACHE.get(cacheKey);
  if (cached) {
    return c.body(cached, 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
      'X-Cache': 'HIT'
    });
  }

  if (!(await cekDanNaikkanKuota(c.env))) {
    return apiError(c, 'QUOTA_EXCEEDED', 'Kuota harian AI habis; coba lagi besok');
  }

  let narasi: string;
  try {
    ({ narasi } = await generateSummary(kawasan, { model: resolveModel(c.env) }));
  } catch (err) {
    console.error('summary gagal:', String(err));
    return apiError(c, 'UPSTREAM_ERROR', 'Model AI sedang tidak dapat dihubungi');
  }

  const payload = summaryResponseSchema.parse({
    kawasan_id: id,
    data_version: DATA_VERSION,
    narasi,
    indikator: {
      n_usaha: kawasan.n_usaha_800,
      harga_median: kawasan.harga_median,
      pct_digital: kawasan.pct_digital,
      tipologi: kawasan.tipologi
    }
  });
  const body = JSON.stringify(payload);
  await c.env.SUMMARY_CACHE.put(cacheKey, body, { expirationTtl: TTL_KV_S });
  return c.body(body, 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': CACHE_CONTROL,
    'X-Cache': 'MISS'
  });
});
