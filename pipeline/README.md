# pipeline/ — Pipeline Data Offline TransitWarga

Mengubah data mission MAPID menjadi artefak statis: `tiles.pmtiles`, `*.parquet`,
`agregat.json` (blueprint bag. 5 & 8).

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
brew install tippecanoe   # menyediakan tippecanoe + tile-join
```

## Menjalankan

```bash
make build-data   # 00_fixtures -> 01_clean -> 03_analyze -> 04_export
make test         # pytest
make lint         # ruff check + format check
```

Urutan skrip:

| Skrip | Fungsi |
|---|---|
| `00_fixtures.py` | Generate CSV sintetis ala MAPID di `data/raw/` (file yang sudah ada tidak ditimpa) |
| `01_clean.py` | Standardisasi ke skema blueprint 5.1 → `data/interim/*.parquet` |
| `02_vision.py` | (fase 4) Klasifikasi foto via LiteLLM, kolom `ai_*` |
| `03_analyze.py` | Buffer 400/800 m, spatial join, skor, tipologi → `kawasan.parquet` |
| `04_export.py` | Parquet final + `tiles.pmtiles` + `agregat.json` → `web/static/data/` & `api/src/generated/` |

## Opsional: muat ke PostgreSQL

Untuk eksplorasi internal tim (SQL/QGIS/BI), artefak olahan bisa dimuat ke
PostgreSQL — **bukan** dependensi runtime aplikasi (aplikasi tetap static-first):

```bash
cp .env.example .env   # isi DATABASE_URL (jangan commit)
make load-db           # buat db+tabel bila belum ada, TRUNCATE, muat ulang
```

Tabel: `kawasan`, `usaha`, `transaksi`, `aktivitas`, `properti` — skema identik
blueprint 5.1 dengan FK `kawasan_id` ke tabel kawasan.

## Data asli MAPID

Unduh manual dari tautan dokumen ketentuan, letakkan di `data/raw/` dengan nama
`menu_go.csv`, `struk_go.csv`, `activity.csv`, `properti_go.csv` — fixtures tidak
akan menimpanya. Bila header CSV asli berbeda dari asumsi, sesuaikan `COLUMN_MAP`
di `twpipe/cleaning.py` (satu-satunya tempat pemetaan). `data/raw/` di-gitignore:
data mentah MAPID tidak boleh masuk repo/publik.
