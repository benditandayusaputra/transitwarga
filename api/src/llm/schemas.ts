/** Skema Zod untuk structured output LLM (blueprint 6.3).

Validasi SELALU dijalankan di sisi kita, apa pun providernya: jaminan
keamanan tidak bergantung pada perilaku model.
*/

import { z } from 'zod';

export const AKSI_TYPES = ['highlight_kawasan', 'zoom_to', 'set_filter', 'compare'] as const;

export const FILTER_FIELDS = ['jenis_tempat', 'keramaian', 'moda'] as const;

export const aksiPetaSchema = z.object({
  type: z.enum(AKSI_TYPES),
  target: z.array(z.string()).min(1).max(12),
  filter: z
    .object({
      field: z.enum(FILTER_FIELDS),
      op: z.enum(['in']),
      value: z.array(z.string()).min(1).max(10)
    })
    .nullish()
});

export type AksiPeta = z.infer<typeof aksiPetaSchema>;

export const chatOutputSchema = z.object({
  narasi: z.string(),
  aksi_peta: aksiPetaSchema.nullable()
});

export type ChatOutput = z.infer<typeof chatOutputSchema>;

export const summaryOutputSchema = z.object({
  narasi: z.string().min(1)
});

export const summaryResponseSchema = z.object({
  kawasan_id: z.string(),
  data_version: z.string(),
  narasi: z.string().min(1),
  indikator: z.object({
    n_usaha: z.number(),
    harga_median: z.number(),
    pct_digital: z.number(),
    tipologi: z.string()
  })
});

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

/** Body POST /api/chat (blueprint 6.3): maks 10 turn, konten maks 500 karakter. */
export const chatRequestSchema = z.object({
  turnstile_token: z.string().max(4096).optional(),
  session_id: z.uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(500)
      })
    )
    .min(1)
    .max(10),
  map_context: z
    .object({
      kawasan_aktif: z.string().max(64).nullable()
    })
    .optional()
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
