/** Kuota harian global panggilan LLM di KV (blueprint 5.3) — pengaman biaya.

KV tidak atomik; race kecil bisa terjadi dan itu diterima (kuota bersifat
pengaman kasar, bukan billing).
*/

import { createMiddleware } from 'hono/factory';
import { apiError } from '../errors';
import type { Env } from '../env';

const DEFAULT_QUOTA = 300;

export function quotaKey(now = new Date()): string {
  return `quota:${now.toISOString().slice(0, 10).replaceAll('-', '')}`;
}

export async function cekDanNaikkanKuota(env: Env): Promise<boolean> {
  const key = quotaKey();
  const limit = Number(env.DAILY_QUOTA ?? DEFAULT_QUOTA);
  const dipakai = Number((await env.QUOTA.get(key)) ?? '0');
  if (dipakai >= limit) return false;
  await env.QUOTA.put(key, String(dipakai + 1), { expirationTtl: 2 * 86400 });
  return true;
}

export const dailyQuota = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (!(await cekDanNaikkanKuota(c.env))) {
    return apiError(
      c,
      'QUOTA_EXCEEDED',
      'Kuota harian AI sudah habis. Silakan coba lagi besok — peta dan analitik tetap berfungsi.'
    );
  }
  return next();
});
