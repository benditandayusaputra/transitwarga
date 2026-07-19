import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            // Test tidak pernah memakai API key nyata: provider mock deterministik.
            LLM_PROVIDER: 'mock',
            LLM_MODEL: 'transitwarga-mock',
            TURNSTILE_DEV_BYPASS: '1',
            DAILY_QUOTA: '100'
          }
        }
      }
    }
  }
});
