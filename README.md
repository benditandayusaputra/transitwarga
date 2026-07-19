# TransitWarga

WebGIS ekonomi informal di ekosistem transportasi massal Jakarta — MAPID WebGIS Competition 2026.
Arsitektur static-first: PMTiles + GeoParquet + DuckDB-WASM di browser, API AI tipis di
Cloudflare Workers. Lihat `docs/blueprint.pdf` dan `CLAUDE.md`.

## Prasyarat

- Node.js >= 22, pnpm >= 10 (`corepack enable`)
- Python >= 3.11
- tippecanoe (`brew install tippecanoe`) — untuk build PMTiles

## Setup

```bash
pnpm install

# pipeline python
python3 -m venv pipeline/.venv
pipeline/.venv/bin/pip install -r pipeline/requirements.txt
```

## Menjalankan dev lokal

```bash
# 1. Bangun artefak data (fixtures sintetis bila data asli belum ada)
make -C pipeline build-data

# 2. Frontend — http://localhost:5173
pnpm --filter web dev

# 3. API — http://localhost:8787
pnpm --filter api dev
```

Konfigurasi lokal:

- `web/.env` — salin dari `web/.env.example` (`PUBLIC_BASEMAP_STYLE_URL` = style MAPID MAPS;
  default sementara memakai style demo MapLibre).
- `api/.dev.vars` — salin dari `api/.dev.vars.example` (`LLM_PROVIDER`, `LLM_MODEL`,
  `LLM_API_KEY`, ...). Jangan pernah commit file ini.

## Kualitas

```bash
pnpm lint          # eslint + prettier (web, api)
pnpm check         # svelte-check + tsc
pnpm test          # vitest (web, api)
make -C pipeline lint test
```

## Deploy

Panduan lengkap dev + deploy (Vercel, Cloudflare Workers, Turnstile, basemap
MAPID, runbook demo/insiden): **[docs/deployment.md](docs/deployment.md)**.
Ringkas:

- **web/** → Vercel (root `vercel.json`; build `pnpm --filter web build`, output `web/build`).
- **api/** → Cloudflare Workers: `pnpm --filter api exec wrangler deploy`.
  Secrets via `wrangler secret put LLM_API_KEY` dsb., bukan file.

## Dukungan LLM

12 pilihan provider via env (tanpa perubahan kode): mock, Anthropic (Claude),
OpenAI (ChatGPT), Google (Gemini), Mistral, Groq, DeepSeek, xAI (Grok), Cohere,
Together AI, OpenRouter, dan endpoint openai-compatible (Ollama/LM Studio).
Contoh setting per provider: [api/.dev.vars.example](api/.dev.vars.example)
(file asli `.dev.vars` gitignored). Vision batch pipeline via LiteLLM:
[pipeline/.env.example](pipeline/.env.example).
