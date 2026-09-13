"""05_load_postgres: muat artefak olahan ke PostgreSQL (opsional).

Aplikasi tetap static-first (blueprint bag. 5): database ini BUKAN dependensi
runtime; dipakai internal tim untuk eksplorasi (QGIS/BI/SQL) dan cadangan data
olahan. Koneksi lewat env DATABASE_URL (atau pipeline/.env, gitignored).
Idempoten: CREATE TABLE IF NOT EXISTS + TRUNCATE + COPY ulang.
"""

import json
import os
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import pandas as pd

# Skema mengikuti blueprint 5.1 (identik dengan parquet yang dibaca DuckDB-WASM).
DDL: dict[str, str] = {
    "kawasan": """
        CREATE TABLE IF NOT EXISTS kawasan (
            kawasan_id      text PRIMARY KEY,
            nama            text NOT NULL,
            moda            text NOT NULL,
            lat             double precision NOT NULL,
            lon             double precision NOT NULL,
            n_usaha_400     smallint NOT NULL,
            n_usaha_800     smallint NOT NULL,
            harga_median    integer NOT NULL,
            skor_kepadatan  real NOT NULL,
            skor_keramaian  real NOT NULL,
            skor_digital    real NOT NULL,
            skor_friksi     real NOT NULL,
            tipologi        text NOT NULL,
            n_transaksi     integer NOT NULL,
            ringkas_stats   jsonb
        )""",
    "usaha": """
        CREATE TABLE IF NOT EXISTS usaha (
            id                  text PRIMARY KEY,
            sumber              text NOT NULL,
            nama                text NOT NULL,
            jenis_tempat        text NOT NULL,
            menu_andalan        text,
            harga_rata          integer NOT NULL,
            keramaian           text,
            mobilitas           text,
            waktu_catat         text,
            foto_url            text,
            ai_jenis_lapak      text,
            ai_okupansi_trotoar smallint,
            ai_kondisi          smallint,
            ai_confidence       real,
            lat                 double precision NOT NULL,
            lon                 double precision NOT NULL,
            kawasan_id          text REFERENCES kawasan(kawasan_id),
            jarak_stasiun_m     smallint
        )""",
    "transaksi": """
        CREATE TABLE IF NOT EXISTS transaksi (
            id           text PRIMARY KEY,
            merchant     text NOT NULL,
            kategori     text NOT NULL,
            tanggal      date NOT NULL,
            jam          smallint NOT NULL,
            metode_bayar text NOT NULL,
            is_digital   boolean NOT NULL,
            lat          double precision NOT NULL,
            lon          double precision NOT NULL,
            kawasan_id   text REFERENCES kawasan(kawasan_id)
        )""",
    "aktivitas": """
        CREATE TABLE IF NOT EXISTS aktivitas (
            id         text PRIMARY KEY,
            title      text NOT NULL,
            lat        double precision NOT NULL,
            lon        double precision NOT NULL,
            kawasan_id text REFERENCES kawasan(kawasan_id)
        )""",
    "properti": """
        CREATE TABLE IF NOT EXISTS properti (
            id         text PRIMARY KEY,
            kategori   text NOT NULL,
            jenis      text NOT NULL,
            lat        double precision NOT NULL,
            lon        double precision NOT NULL,
            kawasan_id text REFERENCES kawasan(kawasan_id)
        )""",
}

_KOLOM: dict[str, list[str]] = {
    "kawasan": [
        "kawasan_id",
        "nama",
        "moda",
        "lat",
        "lon",
        "n_usaha_400",
        "n_usaha_800",
        "harga_median",
        "skor_kepadatan",
        "skor_keramaian",
        "skor_digital",
        "skor_friksi",
        "tipologi",
        "n_transaksi",
        "ringkas_stats",
    ],
    "usaha": [
        "id",
        "sumber",
        "nama",
        "jenis_tempat",
        "menu_andalan",
        "harga_rata",
        "keramaian",
        "mobilitas",
        "waktu_catat",
        "foto_url",
        "ai_jenis_lapak",
        "ai_okupansi_trotoar",
        "ai_kondisi",
        "ai_confidence",
        "lat",
        "lon",
        "kawasan_id",
        "jarak_stasiun_m",
    ],
    "transaksi": [
        "id",
        "merchant",
        "kategori",
        "tanggal",
        "jam",
        "metode_bayar",
        "is_digital",
        "lat",
        "lon",
        "kawasan_id",
    ],
    "aktivitas": ["id", "title", "lat", "lon", "kawasan_id"],
    "properti": ["id", "kategori", "jenis", "lat", "lon", "kawasan_id"],
}

# kawasan dimuat dulu (tabel lain punya FK ke sana)
_URUTAN = ["kawasan", "usaha", "transaksi", "aktivitas", "properti"]


def database_url(env_file: Path | None = None) -> str:
    """Ambil DATABASE_URL dari env, atau fallback baca pipeline/.env (gitignored)."""
    from .envfile import muat_env

    muat_env(env_file)
    url = os.environ.get("DATABASE_URL", "")
    if url:
        return url
    raise SystemExit(
        "DATABASE_URL belum di-set. Export env atau isi pipeline/.env "
        "(lihat pipeline/.env.example). Jangan commit kredensial."
    )


def ensure_database(url: str) -> None:
    """Buat database target bila belum ada (connect ke db 'postgres')."""
    import psycopg

    parsed = urlparse(url)
    nama_db = parsed.path.lstrip("/")
    try:
        psycopg.connect(url, connect_timeout=5).close()
        return
    except psycopg.OperationalError as e:
        if "does not exist" not in str(e):
            raise
    admin_url = urlunparse(parsed._replace(path="/postgres"))
    with psycopg.connect(admin_url, autocommit=True) as conn:
        conn.execute(f'CREATE DATABASE "{nama_db}"')
    print(f"[postgres] database {nama_db} dibuat")


def _rows(df: pd.DataFrame, cols: list[str]):
    """Baris siap-COPY: pandas NA -> None."""
    sub = df[cols].astype(object)
    sub = sub.where(pd.notna(sub), None)
    return (tuple(r) for r in sub.itertuples(index=False, name=None))


def load(interim_dir: Path, url: str | None = None) -> dict[str, int]:
    import psycopg

    url = url or database_url()
    ensure_database(url)
    hasil: dict[str, int] = {}
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            for tabel in _URUTAN:
                cur.execute(DDL[tabel])
            # urutan TRUNCATE dibalik supaya FK tidak menghalangi
            cur.execute(f"TRUNCATE {', '.join(reversed(_URUTAN))} CASCADE")
            for tabel in _URUTAN:
                df = pd.read_parquet(interim_dir / f"{tabel}.parquet")
                if tabel == "kawasan":
                    df["ringkas_stats"] = df["ringkas_stats"].map(
                        lambda s: json.dumps(json.loads(s), ensure_ascii=False)
                    )
                cols = _KOLOM[tabel]
                with cur.copy(f"COPY {tabel} ({', '.join(cols)}) FROM STDIN") as copy:
                    for row in _rows(df, cols):
                        copy.write_row(row)
                hasil[tabel] = len(df)
        conn.commit()
    print("[postgres] dimuat: " + ", ".join(f"{t}={n}" for t, n in hasil.items()))
    return hasil
