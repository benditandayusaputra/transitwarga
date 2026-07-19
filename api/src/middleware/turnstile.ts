/** Verifikasi Cloudflare Turnstile 1x per session_id (blueprint bag. 9).

Token wajib pada pesan pertama sebuah sesi; sesi terverifikasi disimpan di KV
(TTL 1 jam) sehingga pesan berikutnya tidak perlu token. Di dev bisa dimatikan
lewat TURNSTILE_DEV_BYPASS=1 (atau bila secret belum di-set).
*/

import { createMiddleware } from 'hono/factory';
import { apiError } from '../errors';
import type { Env } from '../env';

const SESSION_TTL_S = 3600;

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const turnstile = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const env = c.env;
  if (env.TURNSTILE_DEV_BYPASS === '1' || !env.TURNSTILE_SECRET_KEY) {
    return next();
  }
  const body = await c.req
    .json<{ session_id?: string; turnstile_token?: string }>()
    .catch(() => null);
  const sessionId = body?.session_id;
  if (!sessionId) {
    return apiError(c, 'INVALID_INPUT', 'session_id wajib diisi');
  }
  const kvKey = `turnstile:${sessionId}`;
  if (await env.QUOTA.get(kvKey)) {
    return next(); // sesi sudah terverifikasi
  }
  const token = body?.turnstile_token;
  if (!token) {
    return apiError(c, 'TURNSTILE_FAILED', 'Verifikasi Turnstile diperlukan untuk pesan pertama');
  }
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', token);
  const ip = c.req.header('CF-Connecting-IP');
  if (ip) form.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  const hasil = (await res.json()) as SiteverifyResponse;
  if (!hasil.success) {
    return apiError(c, 'TURNSTILE_FAILED', 'Verifikasi Turnstile gagal');
  }
  await env.QUOTA.put(kvKey, '1', { expirationTtl: SESSION_TTL_S });
  return next();
});
