# TransitWarga

WebGIS ekonomi informal di ekosistem transportasi massal Jakarta — MAPID WebGIS Competition 2026.
Arsitektur static-first: PMTiles + GeoParquet + DuckDB-WASM di browser, API AI tipis di Cloudflare Workers.

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

Tiga bagian repo punya nasib berbeda:

| Bagian | Di-deploy ke | Cara |
|---|---|---|
| `web/` | Vercel | Import repo dari GitHub, auto-deploy tiap push ke `main` |
| `api/` | Cloudflare Workers | `wrangler deploy` (langkah di bawah) |
| `pipeline/` | tidak di-deploy | Jalan lokal; hasilnya (`web/static/data`, `web/static/foto`) di-commit |

### A. Frontend ke Vercel

1. [vercel.com/new](https://vercel.com/new) → Import repo GitHub `transitwarga`.
2. **Root Directory** biarkan root repo (jangan `web/`). `vercel.json` sudah mengatur
   install, build (`pnpm --filter web build`), output (`web/build`), dan header keamanan.
3. Environment Variables (Production):
   - `PUBLIC_API_BASE_URL` = URL Worker dari langkah B (mis. `https://transitwarga-api.<akun>.workers.dev`)
   - `PUBLIC_TURNSTILE_SITE_KEY` = site key Turnstile (opsional; kosong = widget tidak tampil)
   - `PUBLIC_MAPID_API_KEY` = key MAPID tim (sudah ada default di kode)
4. Deploy. Setiap push ke `main` otomatis deploy ulang.
5. Verifikasi range request PMTiles (wajib untuk layer peta):
   ```bash
   curl -sI -r 0-99 https://<domain-vercel>/data/tiles.pmtiles | head -3   # harus HTTP 206
   ```

### B. Backend API ke Cloudflare Workers

Prasyarat: akun Cloudflare (gratis cukup), login sekali, dan subdomain `workers.dev`
(dibuat otomatis saat pertama kali membuka menu **Workers & Pages** di dashboard):

```bash
pnpm --filter api exec wrangler login
```

Produksi saat ini: `https://transitwarga-api.devunder.workers.dev` (KV sudah terpasang di
`api/wrangler.toml`; anggota tim lain cukup `wrangler login` ke akun yang sama lalu langkah 2–3).

1. **Buat KV namespace** (cache ringkasan + kuota harian):
   ```bash
   cd api
   pnpm exec wrangler kv namespace create SUMMARY_CACHE
   pnpm exec wrangler kv namespace create QUOTA
   ```
   Salin kedua `id` yang dicetak ke `api/wrangler.toml`, menggantikan
   `summary-cache-placeholder` dan `quota-placeholder`.

2. **Pasang secrets** (tidak pernah masuk repo):
   ```bash
   pnpm exec wrangler secret put LLM_PROVIDER      # mis. anthropic / openai / google / groq
   pnpm exec wrangler secret put LLM_MODEL         # mis. claude-haiku-4-5
   pnpm exec wrangler secret put LLM_API_KEY
   pnpm exec wrangler secret put CORS_ORIGIN       # persis origin Vercel, mis. https://transitwarga.vercel.app
   pnpm exec wrangler secret put TURNSTILE_SECRET_KEY   # bila Turnstile dipakai
   ```
   Daftar variabel lain (LLM_BASE_URL, DAILY_QUOTA, dst.) ada di `api/.dev.vars.example`.

3. **Deploy**:
   ```bash
   pnpm exec wrangler deploy
   ```
   Wrangler mencetak URL `https://transitwarga-api.<akun>.workers.dev`. Durable Object
   `RateLimiter` dibuat otomatis lewat `[[migrations]]` di `wrangler.toml`.

4. **Cek**:
   ```bash
   curl https://transitwarga-api.<akun>.workers.dev/api/health
   # {"ok":true,"llm":{"provider":"...","model":"..."},...}
   ```
   Masukkan URL itu ke `PUBLIC_API_BASE_URL` di Vercel lalu redeploy web.

5. **Ganti provider/model** kapan saja: ulangi `wrangler secret put LLM_*` lalu
   `wrangler deploy` — tanpa perubahan kode.

### C. Perbarui data

```bash
make -C pipeline build-data      # tulis ulang web/static/data + web/static/foto
git add web/static && git commit -m "chore: perbarui artefak data" && git push
```
Push memicu deploy Vercel; `data_version` baru otomatis menginvalidasi cache ringkasan di KV.

## 🤖 Dukungan LLM

12 pilihan provider via env (tanpa perubahan kode): mock, Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Mistral, Groq, DeepSeek, xAI (Grok), Cohere, Together AI, OpenRouter, dan endpoint openai-compatible (Ollama/LM Studio).

Contoh setting per provider: [api/.dev.vars.example](api/.dev.vars.example) (file asli `.dev.vars` gitignored).
Vision batch pipeline via LiteLLM: [pipeline/.env.example](pipeline/.env.example).

