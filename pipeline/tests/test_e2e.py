"""Smoke test end-to-end pipeline atas fixtures sintetis (di tmp_path)."""

import json

import duckdb
import pytest

from twpipe import analyze, cleaning, export, fixtures
from twpipe.stations import STATIONS


@pytest.fixture(scope="module")
def pipeline_dirs(tmp_path_factory):
    base = tmp_path_factory.mktemp("pipeline")
    dirs = {
        "raw": base / "data" / "raw",
        "ref": base / "data" / "ref",
        "interim": base / "data" / "interim",
        "web": base / "web_data",
        "api": base / "api_generated",
    }
    fixtures.generate(dirs["raw"], dirs["ref"])
    cleaning.run(dirs["raw"], dirs["ref"], dirs["interim"])
    analyze.run(dirs["ref"], dirs["interim"])
    export.run(dirs["interim"], dirs["web"], dirs["api"], skip_tiles=True)
    return dirs


def test_semua_parquet_dihasilkan(pipeline_dirs):
    for name in ("usaha", "transaksi", "aktivitas", "properti", "kawasan"):
        assert (pipeline_dirs["web"] / f"{name}.parquet").exists()


def test_parquet_terbaca_duckdb(pipeline_dirs):
    con = duckdb.connect()
    n = con.execute(
        f"select count(*) from read_parquet('{pipeline_dirs['web'] / 'usaha.parquet'}')"
    ).fetchone()[0]
    assert n > 30  # 40 fixture minus baris kotor
    kolom = {
        r[0]
        for r in con.execute(
            f"describe select * from read_parquet('{pipeline_dirs['web'] / 'kawasan.parquet'}')"
        ).fetchall()
    }
    assert {
        "kawasan_id",
        "nama",
        "moda",
        "n_usaha_400",
        "n_usaha_800",
        "harga_median",
        "skor_kepadatan",
        "skor_keramaian",
        "skor_digital",
        "skor_friksi",
        "tipologi",
        "ringkas_stats",
    } <= kolom


def test_agregat_json(pipeline_dirs):
    for target in ("web", "api"):
        payload = json.loads((pipeline_dirs[target] / "agregat.json").read_text())
        assert payload["data_version"]
        assert len(payload["kawasan"]) == len(STATIONS)
        contoh = payload["kawasan"][0]
        assert {"kawasan_id", "nama", "tipologi", "n_usaha_800", "pct_digital"} <= set(contoh)


def test_buffer_geojson(pipeline_dirs):
    gj = json.loads((pipeline_dirs["interim"] / "kawasan_buffer.geojson").read_text())
    # dua ring (400 & 800) per kawasan
    assert len(gj["features"]) == 2 * len(STATIONS)
    props = gj["features"][0]["properties"]
    assert {"kawasan_id", "radius_m", "tipologi", "skor_kepadatan"} <= set(props)


def test_tipologi_valid(pipeline_dirs):
    payload = json.loads((pipeline_dirs["web"] / "agregat.json").read_text())
    valid = {"kuliner_matang", "padat_friksi", "potensi", "prioritas_digital", "sepi"}
    assert {k["tipologi"] for k in payload["kawasan"]} <= valid


@pytest.mark.skipif(not export.tippecanoe_available(), reason="tippecanoe tidak terpasang")
def test_tiles_pmtiles(pipeline_dirs):
    export.build_tiles(pipeline_dirs["interim"], pipeline_dirs["web"] / "tiles.pmtiles")
    info = export.verify_pmtiles(pipeline_dirs["web"] / "tiles.pmtiles")
    assert info["version"] == 3
    assert info["n_tiles"] > 0
