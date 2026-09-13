/** Unit test adapter LLM dengan model mock (blueprint fase 4A):
- output valid
- output JSON rusak (tertangkap; aksi dibuang, narasi tetap)
- aksi dengan target di luar daftar kawasan (ditolak)
*/

import { describe, expect, it } from 'vitest';
import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test';
import type { LanguageModel } from 'ai';
import {
  generateSummary,
  pesanErrorUpstream,
  sanitizeAksi,
  streamPolicyChat
} from '../src/llm/provider';
import { KAWASAN } from '../src/data/agregat';

const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 }
};
const FINISH = { unified: 'stop' as const, raw: 'stop' };
const KNOWN = new Set(['mrt-blok-m', 'tj-harmoni']);

function modelDenganTeks(teks: string): LanguageModel {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: 'text' as const, text: teks }],
      finishReason: FINISH,
      usage: USAGE,
      warnings: []
    }),
    doStream: async () => ({
      stream: convertArrayToReadableStream([
        { type: 'text-start' as const, id: '1' },
        { type: 'text-delta' as const, id: '1', delta: teks },
        { type: 'text-end' as const, id: '1' },
        { type: 'finish' as const, finishReason: FINISH, usage: USAGE }
      ])
    })
  }) as unknown as LanguageModel;
}

const statsContoh = KAWASAN[0]!;

describe('generateSummary', () => {
  it('output valid -> narasi + indikator deterministik dari digest', async () => {
    const model = modelDenganTeks(JSON.stringify({ narasi: 'Kawasan ramai pedagang.' }));
    const hasil = await generateSummary(statsContoh, { model });
    expect(hasil.narasi).toBe('Kawasan ramai pedagang.');
    expect(hasil.indikator).toEqual({
      n_usaha: statsContoh.n_usaha_800,
      harga_median: statsContoh.harga_median,
      pct_digital: statsContoh.pct_digital,
      tipologi: statsContoh.tipologi
    });
  });

  it('output JSON rusak -> error tertangkap sebagai kegagalan (untuk 502)', async () => {
    const model = modelDenganTeks('bukan json sama sekali {{{');
    await expect(generateSummary(statsContoh, { model })).rejects.toThrow();
  });
});

describe('streamPolicyChat', () => {
  const input = {
    messages: [{ role: 'user' as const, content: 'kawasan mana yang padat?' }],
    digest: '[]',
    mapContext: { kawasan_aktif: null },
    knownKawasanIds: KNOWN
  };

  it('output valid -> delta narasi mengalir dan aksi diteruskan', async () => {
    const model = modelDenganTeks(
      JSON.stringify({
        narasi: 'Blok M paling padat.',
        aksi_peta: { type: 'highlight_kawasan', target: ['mrt-blok-m'] }
      })
    );
    const chat = streamPolicyChat({ ...input, model });
    let narasi = '';
    for await (const delta of chat.deltas) narasi += delta;
    const final = await chat.final;
    expect(narasi).toBe('Blok M paling padat.');
    expect(final.narasi).toBe('Blok M paling padat.');
    expect(final.aksi_peta).toEqual({ type: 'highlight_kawasan', target: ['mrt-blok-m'] });
  });

  it('JSON rusak -> aksi dibuang, narasi parsial tetap dipakai', async () => {
    const model = modelDenganTeks('{"narasi": "Sebagian jawaban');
    const chat = streamPolicyChat({ ...input, model });
    for await (const _ of chat.deltas) {
      // konsumsi stream
    }
    const final = await chat.final;
    expect(final.aksi_peta).toBeNull();
  });

  it('target di luar daftar kawasan -> aksi ditolak, narasi tetap', async () => {
    const model = modelDenganTeks(
      JSON.stringify({
        narasi: 'Menyorot kawasan misterius.',
        aksi_peta: { type: 'highlight_kawasan', target: ['kawasan-tidak-ada'] }
      })
    );
    const chat = streamPolicyChat({ ...input, model });
    for await (const _ of chat.deltas) {
      // konsumsi stream
    }
    const final = await chat.final;
    expect(final.narasi).toBe('Menyorot kawasan misterius.');
    expect(final.aksi_peta).toBeNull();
  });
});

describe('streamPolicyChat saat model gagal', () => {
  it('provider error sebelum narasi -> final ditolak dengan pesan kuota', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error('You exceeded your current quota (429 RESOURCE_EXHAUSTED)');
      }
    }) as unknown as LanguageModel;
    const chat = streamPolicyChat({
      messages: [{ role: 'user', content: 'halo' }],
      digest: '[]',
      mapContext: { kawasan_aktif: null },
      knownKawasanIds: KNOWN,
      model
    });
    for await (const _ of chat.deltas) {
      // stream kosong
    }
    await expect(chat.final).rejects.toThrow(/quota/);
    expect(pesanErrorUpstream(new Error('429 quota'))).toMatch(/Kuota/);
    expect(pesanErrorUpstream(new Error('ECONNRESET'))).toMatch(/terputus/);
  });
});

describe('sanitizeAksi', () => {
  it('tipe di luar whitelist ditolak', () => {
    const aksi = { type: 'eval_js', target: ['mrt-blok-m'] };
    expect(sanitizeAksi(aksi as never, KNOWN)).toBeNull();
  });

  it('semua target dikenal -> lolos', () => {
    const aksi = { type: 'compare' as const, target: ['mrt-blok-m', 'tj-harmoni'] };
    expect(sanitizeAksi(aksi, KNOWN)).toEqual(aksi);
  });

  it('satu target asing membatalkan seluruh aksi', () => {
    const aksi = { type: 'zoom_to' as const, target: ['mrt-blok-m', 'asing'] };
    expect(sanitizeAksi(aksi, KNOWN)).toBeNull();
  });
});
