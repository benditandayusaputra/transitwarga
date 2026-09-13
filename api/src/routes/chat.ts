/** POST /api/chat (blueprint 6.3): SSE delta / map_action / done / error.

Rantai middleware (6.1): cors+securityHeaders global -> turnstile -> rateLimit
(DO per IP) -> dailyQuota (KV) -> zodValidate -> handler.
*/

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { digestSemuaKawasan, KAWASAN_IDS } from '../data/agregat';
import { dailyQuota } from '../middleware/dailyQuota';
import { rateLimit } from '../middleware/rateLimit';
import { turnstile } from '../middleware/turnstile';
import { pesanErrorUpstream, resolveModel, streamPolicyChat } from '../llm/provider';
import { chatRequestSchema } from '../llm/schemas';
import type { Env } from '../env';

export const chatRoute = new Hono<{ Bindings: Env }>();

chatRoute.post(
  '/api/chat',
  turnstile,
  rateLimit,
  dailyQuota,
  zValidator('json', chatRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: { code: 'INVALID_INPUT', message: 'Body tidak valid', detail: result.error.issues }
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid('json');
    let chat;
    try {
      chat = streamPolicyChat({
        messages: body.messages,
        digest: digestSemuaKawasan(),
        mapContext: body.map_context ?? { kawasan_aktif: null },
        knownKawasanIds: KAWASAN_IDS,
        model: resolveModel(c.env)
      });
    } catch (err) {
      console.error('chat init gagal:', String(err));
      return c.json(
        { error: { code: 'UPSTREAM_ERROR', message: 'Model AI tidak dapat dihubungi' } },
        502
      );
    }

    return streamSSE(c, async (stream) => {
      try {
        for await (const delta of chat.deltas) {
          await stream.writeSSE({ event: 'delta', data: JSON.stringify({ text: delta }) });
        }
        const final = await chat.final;
        if (final.aksi_peta) {
          await stream.writeSSE({ event: 'map_action', data: JSON.stringify(final.aksi_peta) });
        }
        await stream.writeSSE({ event: 'done', data: JSON.stringify({ usage: {} }) });
      } catch (err) {
        console.error('chat stream gagal:', String(err));
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ code: 'UPSTREAM_ERROR', message: pesanErrorUpstream(err) })
        });
      }
    });
  }
);
