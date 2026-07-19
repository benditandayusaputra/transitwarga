"""03_analyze: buffer 400/800 m, spatial join, skor 0-100, tipologi rule-based.

Semua jarak dihitung di EPSG:32748 (UTM 48S, meter). Ambang tipologi adalah
konstanta modul supaya mudah dikalibrasi saat data survey asli masuk.
"""

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd

CRS_WGS84 = "EPSG:4326"
CRS_METER = "EPSG:32748"

RADIUS_DALAM = 400
RADIUS_LUAR = 800

# Ambang tipologi rule-based (blueprint 5.1) — kalibrasi di satu tempat.
AMBANG_SEPI = 25.0  # skor_kepadatan di bawah ini -> sepi
AMBANG_PADAT = 60.0  # skor_kepadatan mulai ini -> kawasan padat
AMBANG_FRIKSI = 60.0  # skor_friksi mulai ini (dan padat) -> padat_friksi
AMBANG_DIGITAL_RENDAH = 40.0  # skor_digital di bawah ini (dan padat) -> prioritas_digital

_PETA_KERAMAIAN = {"sepi": 0.0, "sedang": 50.0, "ramai": 100.0}


def _to_gdf(df: pd.DataFrame) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df["lon"], df["lat"]), crs=CRS_WGS84)


def assign_kawasan(points: pd.DataFrame, stations: gpd.GeoDataFrame) -> pd.DataFrame:
    """Tambah kolom kawasan_id + jarak_stasiun_m: stasiun terdekat dalam 800 m.

    Titik lebih jauh dari 800 m dari semua stasiun mendapat kawasan_id None.
    """
    if points.empty:
        out = points.copy()
        out["kawasan_id"] = pd.Series(dtype="string")
        out["jarak_stasiun_m"] = pd.Series(dtype="Int16")
        return out
    pts = _to_gdf(points).to_crs(CRS_METER)
    st = stations.to_crs(CRS_METER)[["kawasan_id", "geometry"]]
    joined = gpd.sjoin_nearest(
        pts, st, how="left", max_distance=RADIUS_LUAR, distance_col="jarak_stasiun_m"
    )
    # sjoin_nearest bisa menduplikasi titik yang berjarak sama ke dua stasiun
    joined = joined[~joined.index.duplicated(keep="first")]
    joined["kawasan_id"] = joined["kawasan_id"].astype("string")
    joined["jarak_stasiun_m"] = joined["jarak_stasiun_m"].round().astype("Int16")
    return pd.DataFrame(joined.drop(columns=["geometry", "index_right"], errors="ignore"))


def minmax_100(series: pd.Series) -> pd.Series:
    """Normalisasi min-max ke 0-100; seri konstan -> 50."""
    vmin, vmax = float(series.min()), float(series.max())
    if vmax == vmin:
        return pd.Series([50.0] * len(series), index=series.index)
    return (series - vmin) / (vmax - vmin) * 100.0


def skor_friksi(kawasan: pd.DataFrame, usaha: pd.DataFrame) -> pd.Series:
    """Skor friksi pejalan kaki per kawasan.

    Bila kolom ai_okupansi_trotoar terisi (02_vision, fase 4): rata-rata okupansi
    (0..2 -> 0..100) dicampur 50:50 dengan skor kepadatan.
    TODO(fase 4): sebelum vision jalan, fallback = skor_kepadatan saja.
    """
    ok = (
        usaha.dropna(subset=["ai_okupansi_trotoar"])
        if "ai_okupansi_trotoar" in usaha
        else usaha.iloc[0:0]
    )
    if ok.empty:
        return kawasan["skor_kepadatan"].copy()
    per_kawasan = ok.groupby("kawasan_id")["ai_okupansi_trotoar"].mean().astype(float) / 2.0 * 100.0
    okupansi = kawasan["kawasan_id"].map(per_kawasan).fillna(0.0)
    return 0.5 * okupansi + 0.5 * kawasan["skor_kepadatan"]


def tipologi_kawasan(row: pd.Series) -> str:
    """Aturan tipologi (urutan penting): sepi -> padat_friksi -> prioritas_digital
    -> kuliner_matang -> potensi."""
    if row["skor_kepadatan"] < AMBANG_SEPI:
        return "sepi"
    if row["skor_kepadatan"] >= AMBANG_PADAT and row["skor_friksi"] >= AMBANG_FRIKSI:
        return "padat_friksi"
    if row["skor_kepadatan"] >= AMBANG_PADAT and row["skor_digital"] < AMBANG_DIGITAL_RENDAH:
        return "prioritas_digital"
    if row["skor_kepadatan"] >= AMBANG_PADAT:
        return "kuliner_matang"
    return "potensi"


def build_kawasan(
    stations: gpd.GeoDataFrame, usaha: pd.DataFrame, transaksi: pd.DataFrame
) -> pd.DataFrame:
    """Hitung tabel kawasan.parquet sesuai blueprint 5.1."""
    rows = []
    for _, st in stations.iterrows():
        kid = st["kawasan_id"]
        u = usaha[usaha["kawasan_id"] == kid]
        t = transaksi[transaksi["kawasan_id"] == kid]
        u400 = u[u["jarak_stasiun_m"] <= RADIUS_DALAM]
        keramaian = u["keramaian"].map(_PETA_KERAMAIAN).dropna()
        rows.append(
            {
                "kawasan_id": kid,
                "nama": st["nama"],
                "moda": st["moda"],
                "lat": st.geometry.y,
                "lon": st.geometry.x,
                "n_usaha_400": len(u400),
                "n_usaha_800": len(u),
                "harga_median": int(u["harga_rata"].median()) if len(u) else 0,
                "skor_keramaian": float(keramaian.mean()) if len(keramaian) else 0.0,
                "skor_digital": float(t["is_digital"].mean() * 100.0) if len(t) else 0.0,
                "n_transaksi": len(t),
            }
        )
    kawasan = pd.DataFrame(rows)
    kawasan["skor_kepadatan"] = minmax_100(kawasan["n_usaha_400"].astype(float))
    kawasan["skor_friksi"] = skor_friksi(kawasan, usaha)
    kawasan["tipologi"] = kawasan.apply(tipologi_kawasan, axis=1)
    kawasan["n_usaha_400"] = kawasan["n_usaha_400"].astype("int16")
    kawasan["n_usaha_800"] = kawasan["n_usaha_800"].astype("int16")
    for col in ("skor_kepadatan", "skor_keramaian", "skor_digital", "skor_friksi"):
        kawasan[col] = kawasan[col].round(1)
    return kawasan


def ringkas_stats(kawasan: pd.DataFrame, usaha: pd.DataFrame) -> pd.Series:
    """Digest JSON per kawasan untuk prompt AI (identik dengan isi agregat.json)."""
    digests = []
    for _, row in kawasan.iterrows():
        u = usaha[usaha["kawasan_id"] == row["kawasan_id"]]
        top_jenis = u["jenis_tempat"].value_counts().head(3).index.tolist()
        digests.append(
            json.dumps(
                {
                    "kawasan_id": row["kawasan_id"],
                    "nama": row["nama"],
                    "moda": row["moda"],
                    "lat": round(float(row["lat"]), 6),
                    "lon": round(float(row["lon"]), 6),
                    "tipologi": row["tipologi"],
                    "n_usaha_400": int(row["n_usaha_400"]),
                    "n_usaha_800": int(row["n_usaha_800"]),
                    "harga_median": int(row["harga_median"]),
                    "pct_digital": round(float(row["skor_digital"])),
                    "skor_kepadatan": float(row["skor_kepadatan"]),
                    "skor_keramaian": float(row["skor_keramaian"]),
                    "skor_digital": float(row["skor_digital"]),
                    "skor_friksi": float(row["skor_friksi"]),
                    "top_jenis": top_jenis,
                    "n_transaksi": int(row["n_transaksi"]),
                },
                ensure_ascii=False,
            )
        )
    return pd.Series(digests, index=kawasan.index)


def build_buffers(stations: gpd.GeoDataFrame, kawasan: pd.DataFrame) -> gpd.GeoDataFrame:
    """Polygon buffer 400 & 800 m per kawasan + skor + tipologi (untuk choropleth)."""
    st_m = stations.to_crs(CRS_METER)
    frames = []
    attrs = kawasan.set_index("kawasan_id")
    for radius in (RADIUS_LUAR, RADIUS_DALAM):  # 800 dulu supaya 400 tergambar di atas
        buf = st_m.copy()
        buf["geometry"] = st_m.geometry.buffer(radius, resolution=32)
        buf["radius_m"] = radius
        frames.append(buf)
    buffers = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), crs=CRS_METER)
    for col in (
        "nama",
        "moda",
        "tipologi",
        "n_usaha_400",
        "n_usaha_800",
        "harga_median",
        "skor_kepadatan",
        "skor_keramaian",
        "skor_digital",
        "skor_friksi",
    ):
        buffers[col] = buffers["kawasan_id"].map(attrs[col])
    return buffers.to_crs(CRS_WGS84)


def run(ref_dir: Path, interim_dir: Path) -> None:
    stations = gpd.read_file(ref_dir / "stasiun.geojson")
    usaha = pd.read_parquet(interim_dir / "usaha.parquet")
    transaksi = pd.read_parquet(interim_dir / "transaksi.parquet")
    aktivitas = pd.read_parquet(interim_dir / "aktivitas.parquet")
    properti = pd.read_parquet(interim_dir / "properti.parquet")

    usaha = assign_kawasan(usaha, stations)
    transaksi = assign_kawasan(transaksi, stations)
    aktivitas = assign_kawasan(aktivitas, stations).drop(columns=["jarak_stasiun_m"])
    properti = assign_kawasan(properti, stations).drop(columns=["jarak_stasiun_m"])

    kawasan = build_kawasan(stations, usaha, transaksi)
    kawasan["ringkas_stats"] = ringkas_stats(kawasan, usaha)
    buffers = build_buffers(stations, kawasan)

    usaha.to_parquet(interim_dir / "usaha.parquet", index=False)
    transaksi.to_parquet(interim_dir / "transaksi.parquet", index=False)
    aktivitas.to_parquet(interim_dir / "aktivitas.parquet", index=False)
    properti.to_parquet(interim_dir / "properti.parquet", index=False)
    kawasan.to_parquet(interim_dir / "kawasan.parquet", index=False)
    buffers.to_file(interim_dir / "kawasan_buffer.geojson", driver="GeoJSON")
    print(
        f"[analyze] {len(kawasan)} kawasan; tipologi: "
        f"{kawasan['tipologi'].value_counts().to_dict()}"
    )
