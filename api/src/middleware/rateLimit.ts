/** Rate limit per IP via Durable Object sliding window (blueprint 5.3). */

import { createMiddleware } from 'hono/factory';
import { apiError } from '../errors';
import type { Env } from '../env';

interface RateLimitResult {
  allowed: boolean;
  retryAfterS?: number;
}

export const rateLimit = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'local-dev';
  const limit = Number(c.env.RATE_LIMIT_PER_MINUTE ?? '10');
  const id = c.env.RATE_LIMITER.idFromName(ip);
  const stub = c.env.RATE_LIMITER.get(id);
  const res = await stub.fetch(`https://rate-limiter/check?limit=${limit}`, { method: 'POST' });
  const hasil = (await res.json()) as RateLimitResult;
  if (!hasil.allowed) {
    c.header('Retry-After', String(hasil.retryAfterS ?? 60));
    return apiError(c, 'RATE_LIMITED', 'Terlalu banyak pesan; coba lagi sebentar lagi');
  }
  return next();
});
