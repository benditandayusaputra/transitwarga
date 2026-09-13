export interface Env {
  SUMMARY_CACHE: KVNamespace;
  QUOTA: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  /**
   * mock | anthropic | openai | google | mistral | groq | deepseek | xai |
   * cohere | togetherai | openrouter | openai-compatible
   * (daftar lengkap + contoh: api/.dev.vars.example)
   */
  LLM_PROVIDER?: string;
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_DEV_BYPASS?: string;
  /** Key MAPID untuk proxy Community Maps (default: key tim). */
  MAPID_API_KEY?: string;
  /** Origin frontend produksi (untuk CORS), mis. https://transitwarga.vercel.app */
  CORS_ORIGIN?: string;
  /** Batas panggilan LLM per hari (global). Default 300. */
  DAILY_QUOTA?: string;
  /** Batas pesan chat per IP per menit. Default 10. */
  RATE_LIMIT_PER_MINUTE?: string;
}
