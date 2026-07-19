/** Provider mock deterministik (LLM_PROVIDER=mock): untuk CI, dev tanpa key,
dan E2E. Non-stream membalas narasi ringkasan; stream membalas narasi chat +
aksi peta highlight_kawasan ke kawasan pertama yang dikenal. */

import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test';
import type { LanguageModel } from 'ai';
import { KAWASAN } from '../data/agregat';

const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 }
};
const FINISH = { unified: 'stop' as const, raw: 'stop' };

export function createMockModel(): LanguageModel {
  const targetKawasan = KAWASAN[0]?.kawasan_id ?? 'mrt-blok-m';
  const summaryJson = JSON.stringify({
    narasi:
      'Ringkasan mock: kawasan ini memiliki sejumlah usaha informal dengan tingkat ' +
      'digitalisasi yang bervariasi. (Jawaban dari provider mock, bukan model nyata.)'
  });
  const chatJson = JSON.stringify({
    narasi: 'Jawaban mock: kawasan yang menonjol ditandai di peta.',
    aksi_peta: { type: 'highlight_kawasan', target: [targetKawasan] }
  });

  return new MockLanguageModelV4({
    provider: 'mock',
    modelId: 'transitwarga-mock',
    doGenerate: async () => ({
      content: [{ type: 'text' as const, text: summaryJson }],
      finishReason: FINISH,
      usage: USAGE,
      warnings: []
    }),
    doStream: async () => ({
      stream: convertArrayToReadableStream([
        { type: 'text-start' as const, id: '1' },
        ...potongan(chatJson).map((delta) => ({ type: 'text-delta' as const, id: '1', delta })),
        { type: 'text-end' as const, id: '1' },
        { type: 'finish' as const, finishReason: FINISH, usage: USAGE }
      ])
    })
  }) as unknown as LanguageModel;
}

/** Pecah teks jadi beberapa delta supaya alur streaming benar-benar teruji. */
function potongan(teks: string, ukuran = 24): string[] {
  const out: string[] = [];
  for (let i = 0; i < teks.length; i += ukuran) out.push(teks.slice(i, i + ukuran));
  return out;
}
