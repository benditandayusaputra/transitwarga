import { expect, test } from '@playwright/test';

/**
 * Test @live: memakai API sungguhan (tanpa mock jaringan). Jalankan dengan:
 *   LIVE_LLM=1 pnpm e2e --grep @live
 * dan pastikan api/.dev.vars berisi provider + key nyata. Dilewati bila env
 * tidak di-set supaya suite utama tetap deterministik tanpa key.
 * Smoke produksi: tambahkan E2E_API_URL=https://transitwarga-api.<akun>.workers.dev
 */
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8787';

test.describe('chat @live', () => {
  test.skip(process.env.LIVE_LLM !== '1', 'set LIVE_LLM=1 + .dev.vars berisi key nyata');
  test.skip(({ isMobile }) => isMobile, 'cukup sekali di project chromium');

  test('satu pertanyaan nyata: menerima delta dan done tanpa error @live', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/chat`, {
      data: {
        session_id: crypto.randomUUID(),
        messages: [{ role: 'user', content: 'Kawasan mana yang paling padat usahanya? Jawab singkat.' }],
        map_context: { kawasan_aktif: null }
      },
      timeout: 60_000
    });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('event: delta');
    expect(body).toContain('event: done');
    expect(body).not.toContain('event: error');
  });
});
