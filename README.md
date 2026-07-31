# TransitWarga

WebGIS ekonomi informal di ekosistem transportasi massal Jakarta — MAPID WebGIS Competition 2026.
Arsitektur static-first: PMTiles + GeoParquet + DuckDB-WASM di browser, API AI tipis di Cloudflare Workers. Lihat `docs/blueprint.pdf` dan `CLAUDE.md`.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat Sistem

- **Node.js**: versi 22 atau lebih baru
- **pnpm**: versi 9+ (jika memakai Node.js < 22.13, jalankan `npm install -g pnpm@9`)
- **Python**: versi 3.11+ *(opsional, hanya diperlukan jika ingin memproses/membangun ulang data pipeline)*
- **tippecanoe**: untuk build PMTiles data GIS *(opsional; macOS: `brew install tippecanoe`)*

---

### 2. Instalasi & Setup Environment

#### Langkah A: Install pnpm (Jika Belum Ter-install)
Jika perintah `pnpm` tidak dikenali di Command Prompt / PowerShell, install `pnpm` terlebih dahulu dengan perintah:
```cmd
npm install -g pnpm
```
*Atau gunakan `npx pnpm` sebelum setiap perintah `pnpm` (contoh: `npx pnpm --filter web dev`).*

#### Langkah B: Install Dependensi Node.js
```bash
pnpm install
```

#### Langkah B: Konfigurasi Environment Variables
1. **Frontend (`web`)**: Salin file `web/.env.example` ke `web/.env`
   - Linux/macOS: `cp web/.env.example web/.env`
   - Windows PowerShell: `Copy-Item web/.env.example web/.env`
   
2. **Backend API (`api`)**: Salin file `api/.dev.vars.example` ke `api/.dev.vars`
   - Linux/macOS: `cp api/.dev.vars.example api/.dev.vars`
   - Windows PowerShell: `Copy-Item api/.dev.vars.example api/.dev.vars`

---

### 3. Menjalankan Dev Server (Lokal)

Aplikasi terdiri dari frontend web dan backend API Cloudflare Workers:

#### A. Menjalankan Frontend Web (`web`)
```bash
pnpm --filter web dev
```
Akses di browser: **[http://localhost:5173](http://localhost:5173)**

#### B. Menjalankan Backend API (`api`)
```bash
pnpm --filter api dev
```
Akses API di: **[http://localhost:8787](http://localhost:8787)**

---

### 4. Setup & Build Data Pipeline (Opsional)

Jika Anda ingin membuat/meregenerasi fixtures data GIS sintetis dari Python:

#### Linux / macOS:
```bash
python3 -m venv pipeline/.venv
source pipeline/.venv/bin/activate
pip install -r pipeline/requirements.txt
make -C pipeline build-data
```

#### Windows (PowerShell):
```powershell
python -m venv pipeline\.venv
.\pipeline\.venv\Scripts\Activate.ps1
pip install -r pipeline\requirements.txt

# Jalankan skrip pemrosesan data secara berurutan:
cd pipeline
python 00_fixtures.py
python 01_clean.py
python 02_vision.py --mock
python 03_analyze.py
python 04_export.py
cd ..
```

---

## 🛠️ Perintah Kualitas & Pengujian

```bash
pnpm lint          # eslint + prettier (web, api)
pnpm check         # svelte-check + tsc
pnpm test          # vitest (web, api)
pnpm e2e           # Playwright E2E testing
make -C pipeline lint test   # Lint & test pipeline python
```

---

## 📦 Deploy

Panduan lengkap dev + deploy (Vercel, Cloudflare Workers, Turnstile, basemap MAPID, runbook demo/insiden): **[docs/deployment.md](docs/deployment.md)**.

Ringkasan:
- **web/** → Vercel (root `vercel.json`; build `pnpm --filter web build`, output `web/build`).
- **api/** → Cloudflare Workers: `pnpm --filter api exec wrangler deploy`.
  Secrets via `wrangler secret put LLM_API_KEY` dsb., bukan file.

---

## 🤖 Dukungan LLM

12 pilihan provider via env (tanpa perubahan kode): mock, Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Mistral, Groq, DeepSeek, xAI (Grok), Cohere, Together AI, OpenRouter, dan endpoint openai-compatible (Ollama/LM Studio).

Contoh setting per provider: [api/.dev.vars.example](api/.dev.vars.example) (file asli `.dev.vars` gitignored).
Vision batch pipeline via LiteLLM: [pipeline/.env.example](pipeline/.env.example).

