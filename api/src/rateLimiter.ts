/** Durable Object: sliding window rate limiter per IP (blueprint 5.3).

Satu objek per IP (idFromName). Stateful sehingga akurat: tidak bisa
dibohongi retry paralel. Timestamps disimpan di storage agar tahan restart.
*/

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 10;

export class RateLimiter {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
    const now = Date.now();
    const tersimpan = (await this.state.storage.get<number[]>('ts')) ?? [];
    const aktif = tersimpan.filter((t) => now - t < WINDOW_MS);
    if (aktif.length >= limit) {
      const tertua = Math.min(...aktif);
      const retryAfterS = Math.max(1, Math.ceil((tertua + WINDOW_MS - now) / 1000));
      await this.state.storage.put('ts', aktif);
      return Response.json({ allowed: false, retryAfterS });
    }
    aktif.push(now);
    await this.state.storage.put('ts', aktif);
    return Response.json({ allowed: true, remaining: limit - aktif.length });
  }
}
