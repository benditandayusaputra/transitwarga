/** Header keamanan untuk semua respons API (blueprint bag. 9). */

import { createMiddleware } from 'hono/factory';

export const securityHeaders = createMiddleware(async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // API hanya melayani JSON/SSE: tidak ada konten aktif.
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
});
