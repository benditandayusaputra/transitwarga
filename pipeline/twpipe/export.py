"""04_export: tulis artefak final ke web/static/data/ + api/src/generated/.

- *.parquet final (usaha, transaksi, aktivitas, properti, kawasan)
- tiles.pmtiles via tippecanoe + tile-join (layer: kawasan_buffer z8-16,
  usaha z12-18, transit z8-18 — blueprint 5.2; pejalan_kaki opsional menyusul)
- agregat.json (array ringkas_stats + data_version tanggal build)
"""

import json
import shutil
import subprocess
import tempfile
from datetime import date
from pathlib import Path

import geopandas as gpd
import pandas as pd

PARQUET_FILES = ["usaha", "transaksi", "aktivitas", "properti", "kawasan"]

# Atribut ringkas yang ikut ke tiles (blueprint 5.2); detail diambil dari parquet.
USAHA_TILE_COLS = ["id", "nama", "jenis_tempat", "harga_rata", "keramaian", "kawasan_id"]


def tippecanoe_available() -> bool:
    return shutil.which("tippecanoe") is not None and shutil.which("tile-join") is not None


def _run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"perintah gagal: {' '.join(cmd)}\n{proc.stderr}")


def build_tiles(interim_dir: Path, out_path: Path) -> None:
    """GeoJSON antara -> pmtiles per layer -> tile-join jadi tiles.pmtiles."""
    if not tippecanoe_available():
        raise RuntimeError(
            "tippecanoe/tile-join tidak ditemukan. Install: brew install tippecanoe "
            "(macOS) atau lihat README pipeline."
        )
    usaha = pd.read_parquet(interim_dir / "usaha.parquet")
    stations = gpd.read_file(interim_dir.parent / "ref" / "stasiun.geojson")

    with tempfile.TemporaryDirectory() as tmp_s:
        tmp = Path(tmp_s)
        usaha_gdf = gpd.GeoDataFrame(
            usaha[USAHA_TILE_COLS],
            geometry=gpd.points_from_xy(usaha["lon"], usaha["lat"]),
            crs="EPSG:4326",
        )
        usaha_gdf.to_file(tmp / "usaha.geojson", driver="GeoJSON")
        stations.to_file(tmp / "transit.geojson", driver="GeoJSON")
        shutil.copy(interim_dir / "kawasan_buffer.geojson", tmp / "kawasan_buffer.geojson")

        layers = [
            ("kawasan_buffer", "8", "16", []),
            # -Z10: titik usaha sudah tampil dari zoom kawasan (selaras
            # USAHA_MINZOOM di web/src/lib/map/layers.ts)
            ("usaha", "10", "18", ["-r1", "--no-feature-limit"]),
            ("transit", "8", "18", ["-r1", "--no-feature-limit"]),
        ]
        parts = []
        for name, zmin, zmax, extra in layers:
            part = tmp / f"{name}.pmtiles"
            _run(
                [
                    "tippecanoe",
                    "-o",
                    str(part),
                    "-l",
                    name,
                    "-Z",
                    zmin,
                    "-z",
                    zmax,
                    "--force",
                    "--quiet",
                    *extra,
                    str(tmp / f"{name}.geojson"),
                ]
            )
            parts.append(str(part))
        out_path.parent.mkdir(parents=True, exist_ok=True)
        _run(["tile-join", "-o", str(out_path), "--force", "--no-tile-size-limit", *parts])

    verify_pmtiles(out_path)


def verify_pmtiles(path: Path) -> dict:
    """Baca header PMTiles v3 (magic 'PMTiles', versi, jumlah tile) sebagai smoke check."""
    data = path.read_bytes()
    if data[:7] != b"PMTiles":
        raise RuntimeError(f"{path} bukan file PMTiles valid (magic salah)")
    version = data[7]
    # spec v3: addressed_tiles_count di byte 72-80 (setelah magic+versi+8 offset/length)
    n_tiles = int.from_bytes(data[72:80], "little")
    print(f"[export] {path.name}: PMTiles v{version}, {n_tiles} tiles, {len(data):,} bytes")
    return {"version": version, "n_tiles": n_tiles, "bytes": len(data)}


def build_agregat(interim_dir: Path) -> dict:
    kawasan = pd.read_parquet(interim_dir / "kawasan.parquet")
    return {
        "data_version": date.today().isoformat(),
        "kawasan": [json.loads(s) for s in kawasan["ringkas_stats"]],
    }


def export_geojson(interim_dir: Path, web_data_dir: Path) -> None:
    usaha = pd.read_parquet(interim_dir / "usaha.parquet")
    usaha_gdf = gpd.GeoDataFrame(
        usaha[USAHA_TILE_COLS],
        geometry=gpd.points_from_xy(usaha["lon"], usaha["lat"]),
        crs="EPSG:4326",
    )
    usaha_gdf.to_file(web_data_dir / "usaha.geojson", driver="GeoJSON")

    stations = gpd.read_file(interim_dir.parent / "ref" / "stasiun.geojson")
    stations.to_file(web_data_dir / "transit.geojson", driver="GeoJSON")

    if (interim_dir / "kawasan_buffer.geojson").exists():
        shutil.copy(interim_dir / "kawasan_buffer.geojson", web_data_dir / "kawasan_buffer.geojson")
    print(f"[export] GeoJSON fallback -> {web_data_dir}")


def run(
    interim_dir: Path, web_data_dir: Path, api_generated_dir: Path, skip_tiles: bool = False
) -> None:
    web_data_dir.mkdir(parents=True, exist_ok=True)
    api_generated_dir.mkdir(parents=True, exist_ok=True)

    for name in PARQUET_FILES:
        src = interim_dir / f"{name}.parquet"
        shutil.copy(src, web_data_dir / f"{name}.parquet")
    print(f"[export] {len(PARQUET_FILES)} parquet -> {web_data_dir}")

    agregat = build_agregat(interim_dir)
    payload = json.dumps(agregat, ensure_ascii=False, indent=1)
    (web_data_dir / "agregat.json").write_text(payload)
    (api_generated_dir / "agregat.json").write_text(payload)
    print(
        f"[export] agregat.json ({len(agregat['kawasan'])} kawasan, "
        f"data_version={agregat['data_version']})"
    )

    export_geojson(interim_dir, web_data_dir)

    if skip_tiles:
        print("[export] build tiles dilewati (--skip-tiles)")
        return
    build_tiles(interim_dir, web_data_dir / "tiles.pmtiles")

