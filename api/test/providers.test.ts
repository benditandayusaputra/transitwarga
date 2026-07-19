/** Setiap provider di whitelist harus bisa di-resolve tanpa menyentuh jaringan
(pembuatan instance model hanya menyusun konfigurasi). Ganti provider = ganti env. */

import { describe, expect, it } from 'vitest';
import { resolveModel, SUPPORTED_PROVIDERS } from '../src/llm/provider';
import type { Env } from '../src/env';

function envUji(provider: string): Env {
  return {
    LLM_PROVIDER: provider,
    LLM_MODEL: 'model-uji',
    LLM_API_KEY: 'key-uji',
    LLM_BASE_URL: provider === 'openai-compatible' ? 'http://localhost:11434/v1' : undefined
  } as unknown as Env;
}

describe('resolveModel multi-provider', () => {
  const nonMock = SUPPORTED_PROVIDERS.filter((p) => p !== 'mock');

  it.each(nonMock)('provider %s ter-resolve dengan modelId yang diminta', (provider) => {
    const model = resolveModel(envUji(provider));
    expect(model).toBeTruthy();
    expect((model as { modelId?: string }).modelId).toBe('model-uji');
  });

  it('mock ter-resolve tanpa key sama sekali', () => {
    const model = resolveModel({} as unknown as Env);
    expect((model as { modelId?: string }).modelId).toBe('transitwarga-mock');
  });

  it('openai-compatible tanpa LLM_BASE_URL -> error jelas', () => {
    const env = { ...envUji('openai-compatible'), LLM_BASE_URL: undefined } as unknown as Env;
    expect(() => resolveModel(env)).toThrow(/LLM_BASE_URL/);
  });

  it('provider tak dikenal -> error menyebut daftar pilihan', () => {
    expect(() => resolveModel(envUji('provider-halu'))).toThrow(/openrouter/);
  });
});
