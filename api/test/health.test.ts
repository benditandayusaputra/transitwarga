import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('GET /api/health', () => {
  it('membalas ok dengan info provider dari env', async () => {
    const res = await app.request(
      '/api/health',
      {},
      {
        LLM_PROVIDER: 'anthropic',
        LLM_MODEL: 'claude-haiku-4-5'
      }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data_version: string;
      llm: { provider: string; model: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data_version).toBeTypeOf('string');
    expect(body.llm).toEqual({ provider: 'anthropic', model: 'claude-haiku-4-5' });
  });

  it('membalas unset bila env LLM kosong', async () => {
    const res = await app.request('/api/health', {}, {});
    const body = (await res.json()) as { llm: { provider: string; model: string } };
    expect(body.llm).toEqual({ provider: 'unset', model: 'unset' });
  });
});
