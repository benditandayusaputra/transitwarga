"""01_clean: standardisasi data mentah mission MAPID ke skema blueprint 5.1.

COLUMN_MAP adalah satu-satunya tempat pemetaan header mentah -> kolom standar.
Saat data sample asli MAPID diunduh ke data/raw/, cukup sesuaikan map ini bila
header berbeda dari asumsi fixtures.
"""

import hashlib
import re
from datetime import date, datetime
from pathlib import Path

import pandas as pd

# Batas wajar koordinat Jabodetabek; di luar ini dianggap invalid.
LAT_RANGE = (-7.0, -5.9)
LON_RANGE = (106.3, 107.3)

COLUMN_MAP: dict[str, dict[str, str]] = {
    "menu_go": {
        "Nama Tempat Makan": "nama",
        "Jenis Tempat Makan": "jenis_tempat",
        "Menu Andalan": "menu_andalan",
        "Harga Rata-Rata Per Porsi": "harga_rata",
        "Tingkat Keramaian": "keramaian",
        "Mobilitas": "mobilitas",
        "Waktu Pencatatan": "waktu_catat",
        "Foto Tempat": "foto_url",
        "Latitude": "lat",
        "Longitude": "lon",
    },
    "struk_go": {
        "Nama Merchant": "merchant",
        "Kategori": "kategori",
        "Tanggal Transaksi": "tanggal",
        "Jam Transaksi": "jam",
        "Metode Pembayaran": "metode_bayar",
        "Latitude": "lat",
        "Longitude": "lon",
    },
    "activity": {
        "ID": "source_id",
        "Judul": "title",
        "Latitude": "lat",
        "Longitude": "lon",
    },
    "properti_go": {
        "ID": "source_id",
        "Kategori Properti": "kategori",
        "Jenis Penawaran": "jenis",
        "Latitude": "lat",
        "Longitude": "lon",
    },
}

ENUM_JENIS_TEMPAT = {
    "kaki lima": "kaki_lima",
    "gerobak": "gerobak",
    "warung tenda": "warung_tenda",
    "kafe": "kafe",
    "cafe": "kafe",
    "restoran": "restoran",
    "fast food": "fast_food",
}
ENUM_KERAMAIAN = {"sepi": "sepi", "sedang": "sedang", "ramai": "ramai"}
ENUM_MOBILITAS = {
    "menetap": "menetap",
    "berpindah-pindah": "keliling",
    "berpindah": "keliling",
    "keliling": "keliling",
}
ENUM_KATEGORI_STRUK = {
    "restoran/kafe": "restoran_kafe",
    "restoran": "restoran_kafe",
    "kafe": "restoran_kafe",
    "warung/kaki lima": "warung_kaki_lima",
    "warung": "warung_kaki_lima",
    "kaki lima": "warung_kaki_lima",
    "minimarket": "minimarket",
    "apotek": "apotek",
    "transportasi": "transportasi",
    "lainnya": "lainnya",
}
ENUM_METODE_BAYAR = {
    "tunai": "tunai",
    "cash": "tunai",
    "qris": "qris",
    "debit": "debit",
    "kredit": "kredit",
    "credit": "kredit",
    "e-wallet": "ewallet",
    "ewallet": "ewallet",
}


def parse_coord(value: object, kind: str) -> float | None:
    """Cast koordinat dari teks: tangani spasi, koma desimal, dan nilai rusak."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    s = str(value).strip()
    if not s or s in {"-", "nan", "None"}:
        return None
    s = s.replace(",", ".")
    if not re.fullmatch(r"-?\d+(\.\d+)?", s):
        return None
    v = float(s)
    lo, hi = LAT_RANGE if kind == "lat" else LON_RANGE
    if not (lo <= v <= hi):
        return None
    return v


def parse_tanggal(value: object) -> date | None:
    """Parse tanggal multi-format: ISO, dd/mm/yyyy, dd-mm-yyyy."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    s = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def parse_jam(value: object) -> int | None:
    """Ambil jam 0-23 dari '17:35', '17.35', '17', atau angka."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    s = str(value).strip().replace(".", ":")
    m = re.match(r"^(\d{1,2})(?::\d{1,2})?$", s)
    if not m:
        return None
    jam = int(m.group(1))
    return jam if 0 <= jam <= 23 else None


def normalize_enum(value: object, mapping: dict[str, str]) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    return mapping.get(str(value).strip().lower())


def make_id(*parts: object) -> str:
    raw = "|".join(str(p) for p in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


def _rename(df: pd.DataFrame, dataset: str) -> pd.DataFrame:
    known = {k: v for k, v in COLUMN_MAP[dataset].items() if k in df.columns}
    return df.rename(columns=known)


def _drop_invalid_coords(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["lat"] = df["lat"].map(lambda v: parse_coord(v, "lat"))
    df["lon"] = df["lon"].map(lambda v: parse_coord(v, "lon"))
    return df.dropna(subset=["lat", "lon"])


def clean_menu_go(df: pd.DataFrame) -> pd.DataFrame:
    """-> skema usaha.parquet (tanpa kawasan_id/jarak; kolom ai_* placeholder null)."""
    df = _rename(df, "menu_go")
    df = _drop_invalid_coords(df)
    df["jenis_tempat"] = df["jenis_tempat"].map(lambda v: normalize_enum(v, ENUM_JENIS_TEMPAT))
    df["keramaian"] = df["keramaian"].map(lambda v: normalize_enum(v, ENUM_KERAMAIAN))
    df["mobilitas"] = df["mobilitas"].map(lambda v: normalize_enum(v, ENUM_MOBILITAS))
    df["harga_rata"] = pd.to_numeric(df["harga_rata"], errors="coerce")
    df = df.dropna(subset=["nama", "jenis_tempat", "harga_rata"])
    df["harga_rata"] = df["harga_rata"].astype("int32")
    df["sumber"] = "menu_go"
    df["id"] = [
        make_id("menu_go", n, round(la, 5), round(lo, 5))
        for n, la, lo in zip(df["nama"], df["lat"], df["lon"], strict=True)
    ]
    df = df.drop_duplicates(subset=["id"], keep="first")
    # Kolom ai_* diisi 02_vision (fase 4); disiapkan agar skema parquet stabil.
    df["ai_jenis_lapak"] = pd.Series([None] * len(df), index=df.index, dtype="string")
    df["ai_okupansi_trotoar"] = pd.Series([None] * len(df), index=df.index, dtype="Int8")
    df["ai_kondisi"] = pd.Series([None] * len(df), index=df.index, dtype="Int8")
    df["ai_confidence"] = pd.Series([None] * len(df), index=df.index, dtype="Float32")
    cols = [
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
    ]
    return df[cols].reset_index(drop=True)


def clean_struk_go(df: pd.DataFrame) -> pd.DataFrame:
    """-> skema transaksi.parquet (tanpa kawasan_id)."""
    df = _rename(df, "struk_go")
    df = _drop_invalid_coords(df)
    df["kategori"] = df["kategori"].map(lambda v: normalize_enum(v, ENUM_KATEGORI_STRUK))
    df["metode_bayar"] = df["metode_bayar"].map(lambda v: normalize_enum(v, ENUM_METODE_BAYAR))
    df["tanggal"] = df["tanggal"].map(parse_tanggal)
    df["jam"] = df["jam"].map(parse_jam).astype("Int8")
    df = df.dropna(subset=["merchant", "kategori", "metode_bayar", "tanggal", "jam"])
    df["is_digital"] = df["metode_bayar"] != "tunai"
    df["id"] = [
        make_id("struk_go", m, t, j, round(la, 5), round(lo, 5))
        for m, t, j, la, lo in zip(
            df["merchant"], df["tanggal"], df["jam"], df["lat"], df["lon"], strict=True
        )
    ]
    df = df.drop_duplicates(subset=["id"], keep="first")
    cols = [
        "id",
        "merchant",
        "kategori",
        "tanggal",
        "jam",
        "metode_bayar",
        "is_digital",
        "lat",
        "lon",
    ]
    return df[cols].reset_index(drop=True)


def clean_activity(df: pd.DataFrame) -> pd.DataFrame:
    df = _rename(df, "activity")
    df = _drop_invalid_coords(df)
    df = df.dropna(subset=["title"])
    df["id"] = [
        make_id("activity", sid, round(la, 5), round(lo, 5))
        for sid, la, lo in zip(df["source_id"], df["lat"], df["lon"], strict=True)
    ]
    df = df.drop_duplicates(subset=["id"], keep="first")
    return df[["id", "title", "lat", "lon"]].reset_index(drop=True)


def clean_properti(df: pd.DataFrame) -> pd.DataFrame:
    df = _rename(df, "properti_go")
    df = _drop_invalid_coords(df)
    df["kategori"] = df["kategori"].astype(str).str.strip().str.lower()
    df["jenis"] = df["jenis"].astype(str).str.strip().str.lower()
    df = df[df["jenis"].isin(["sewa", "jual"])]
    df["id"] = [
        make_id("properti", sid, round(la, 5), round(lo, 5))
        for sid, la, lo in zip(df["source_id"], df["lat"], df["lon"], strict=True)
    ]
    df = df.drop_duplicates(subset=["id"], keep="first")
    return df[["id", "kategori", "jenis", "lat", "lon"]].reset_index(drop=True)


def run(raw_dir: Path, ref_dir: Path, interim_dir: Path) -> dict[str, pd.DataFrame]:
    """Baca raw CSV, bersihkan, tulis parquet interim."""
    from .stations import write_ref_geojson

    write_ref_geojson(ref_dir)
    interim_dir.mkdir(parents=True, exist_ok=True)

    cleaners = {
        "usaha": ("menu_go.csv", clean_menu_go),
        "transaksi": ("struk_go.csv", clean_struk_go),
        "aktivitas": ("activity.csv", clean_activity),
        "properti": ("properti_go.csv", clean_properti),
    }
    out: dict[str, pd.DataFrame] = {}
    for name, (fname, cleaner) in cleaners.items():
        src = raw_dir / fname
        if not src.exists():
            raise FileNotFoundError(f"{src} tidak ada — jalankan 00_fixtures.py dulu")
        raw = pd.read_csv(src, dtype=str)
        cleaned = cleaner(raw)
        cleaned.to_parquet(interim_dir / f"{name}.parquet", index=False)
        print(f"[clean] {name}: {len(raw)} baris mentah -> {len(cleaned)} bersih")
        out[name] = cleaned
    return out
