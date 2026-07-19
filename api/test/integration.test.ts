/** Integration test endpoint di runtime Workers (vitest-pool-workers):
summary miss->hit, chat SSE streaming (model mock), rate limit ke-11 ditolak,
kuota harian 503, body invalid 400, turnstile tanpa token 401. */

import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { KAWASAN } from '../src/data/agregat';
import { quotaKey } from '../src/middleware/dailyQuota';

const KAWASAN_ID = KAWASAN[0]!.kawasan_id;
const BASE = 'https://api.test';

function chatBody(pesan = 'kawasan mana yang paling padat?') {
  return {
    session_id: crypto.randomUUID(),
    messages: [{ role: 'user', content: pesan }],
    map_context: { kawasan_aktif: null }
  };
}

function chatRequest(ip: string, body: unknown = chatBody()): Request {
  return new Request(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify(body)
  });
}

interface SseEvent {
  event: string;
  data: string;
}

function parseSse(teks: string): SseEvent[] {
  return teks
    .split('\n\n')
    .filter((blok) => blok.trim().length > 0)
    .map((blok) => {
      const event = /event: (.+)/.exec(blok)?.[1] ?? 'message';
      const data = /data: (.+)/.exec(blok)?.[1] ?? '';
      return { event, data };
    });
}

describe('GET /api/health', () => {
  it('memuat data_version dari agregat + provider aktif', async () => {
    const res = await SELF.fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data_version: string;
      llm: { provider: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data_version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.llm.provider).toBe('mock');
  });
});

describe('GET /api/summary/:kawasanId', () => {
  it('id tidak dikenal -> 400 INVALID_INPUT', async () => {
    const res = await SELF.fetch(`${BASE}/api/summary/kawasan-palsu`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('happy path: miss lalu hit cache KV', async () => {
    const pertama = await SELF.fetch(`${BASE}/api/summary/${KAWASAN_ID}`);
    expect(pertama.status).toBe(200);
    expect(pertama.headers.get('X-Cache')).toBe('MISS');
    expect(pertama.headers.get('Cache-Control')).toBe('public, max-age=86400');
    const body = (await pertama.json()) as {
      kawasan_id: string;
      narasi: string;
      indikator: { tipologi: string };
    };
    expect(body.kawasan_id).toBe(KAWASAN_ID);
    expect(body.narasi.length).toBeGreaterThan(10);
    expect(body.indikator.tipologi).toBe(KAWASAN[0]!.tipologi);

    const kedua = await SELF.fetch(`${BASE}/api/summary/${KAWASAN_ID}`);
    expect(kedua.headers.get('X-Cache')).toBe('HIT');
    expect(await kedua.json()).toEqual(body);
  });
});

describe('POST /api/chat', () => {
  it('body invalid -> 400', async () => {
    const res = await SELF.fetch(
      chatRequest('10.0.0.1', { session_id: 'bukan-uuid', messages: [] })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('pesan lebih dari 500 karakter -> 400', async () => {
    const res = await SELF.fetch(chatRequest('10.0.0.2', chatBody('x'.repeat(501))));
    expect(res.status).toBe(400);
  });

  it('streaming SSE: delta -> map_action -> done (model mock)', async () => {
    const res = await SELF.fetch(chatRequest('10.0.0.3'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    const events = parseSse(await res.text());
    const jenis = events.map((e) => e.event);
    expect(jenis.filter((j) => j === 'delta').length).toBeGreaterThan(0);
    expect(jenis).toContain('map_action');
    expect(jenis[jenis.length - 1]).toBe('done');

    const narasi = events
      .filter((e) => e.event === 'delta')
      .map((e) => (JSON.parse(e.data) as { text: string }).text)
      .join('');
    expect(narasi).toContain('mock');

    const aksi = JSON.parse(events.find((e) => e.event === 'map_action')!.data) as {
      type: string;
      target: string[];
    };
    expect(aksi.type).toBe('highlight_kawasan');
    expect(aksi.target).toEqual([KAWASAN_ID]);
  });

  it('rate limit: permintaan ke-11 dari IP sama ditolak 429', async () => {
    const ip = '10.9.9.9';
    for (let i = 0; i < 10; i++) {
      const res = await SELF.fetch(chatRequest(ip));
      expect(res.status).toBe(200);
    }
    const kesebelas = await SELF.fetch(chatRequest(ip));
    expect(kesebelas.status).toBe(429);
    const body = (await kesebelas.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('kuota harian habis -> 503 QUOTA_EXCEEDED', async () => {
    await env.QUOTA.put(quotaKey(), '100'); // DAILY_QUOTA test = 100
    const res = await SELF.fetch(chatRequest('10.0.0.4'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('turnstile aktif tanpa token -> 401 TURNSTILE_FAILED', async () => {
    const res = await app.request(
      '/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '10.0.0.5' },
        body: JSON.stringify(chatBody())
      },
      {
        ...env,
        TURNSTILE_DEV_BYPASS: '0',
        TURNSTILE_SECRET_KEY: 'secret-uji'
      }
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('TURNSTILE_FAILED');
  });
});
