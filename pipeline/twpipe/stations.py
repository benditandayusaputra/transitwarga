"""Daftar stasiun/halte acuan (blueprint 5.1: kawasan.parquet).

8 stasiun koridor MRT Jakarta + 4 halte TransJakarta. Koordinat aproksimasi
publik, cukup akurat untuk buffer 400/800 m.
"""

import json
from pathlib import Path

STATIONS: list[dict[str, object]] = [
    {
        "kawasan_id": "mrt-lebak-bulus",
        "nama": "Lebak Bulus Grab",
        "moda": "mrt",
        "lat": -6.2894,
        "lon": 106.7745,
    },
    {
        "kawasan_id": "mrt-fatmawati",
        "nama": "Fatmawati Indomaret",
        "moda": "mrt",
        "lat": -6.2925,
        "lon": 106.7935,
    },
    {
        "kawasan_id": "mrt-cipete-raya",
        "nama": "Cipete Raya",
        "moda": "mrt",
        "lat": -6.2782,
        "lon": 106.7972,
    },
    {
        "kawasan_id": "mrt-blok-m",
        "nama": "Blok M BCA",
        "moda": "mrt",
        "lat": -6.2444,
        "lon": 106.7980,
    },
    {
        "kawasan_id": "mrt-senayan",
        "nama": "Senayan Mastercard",
        "moda": "mrt",
        "lat": -6.2266,
        "lon": 106.8025,
    },
    {
        "kawasan_id": "mrt-bendungan-hilir",
        "nama": "Bendungan Hilir",
        "moda": "mrt",
        "lat": -6.2149,
        "lon": 106.8177,
    },
    {
        "kawasan_id": "mrt-dukuh-atas",
        "nama": "Dukuh Atas BNI",
        "moda": "mrt",
        "lat": -6.2008,
        "lon": 106.8228,
    },
    {
        "kawasan_id": "mrt-bundaran-hi",
        "nama": "Bundaran HI Bank DKI",
        "moda": "mrt",
        "lat": -6.1917,
        "lon": 106.8230,
    },
    {
        "kawasan_id": "tj-harmoni",
        "nama": "Harmoni Central",
        "moda": "tj",
        "lat": -6.1665,
        "lon": 106.8194,
    },
    {"kawasan_id": "tj-tosari", "nama": "Tosari", "moda": "tj", "lat": -6.1969, "lon": 106.8221},
    {"kawasan_id": "tj-csw", "nama": "CSW", "moda": "tj", "lat": -6.2367, "lon": 106.7997},
    {
        "kawasan_id": "tj-gbk",
        "nama": "Gelora Bung Karno",
        "moda": "tj",
        "lat": -6.2205,
        "lon": 106.8071,
    },
]

KAWASAN_IDS = [str(s["kawasan_id"]) for s in STATIONS]


def to_geojson() -> dict:
    """FeatureCollection titik stasiun/halte + moda."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
                "properties": {
                    "kawasan_id": s["kawasan_id"],
                    "nama": s["nama"],
                    "moda": s["moda"],
                },
            }
            for s in STATIONS
        ],
    }


def write_ref_geojson(ref_dir: Path, overwrite: bool = False) -> Path:
    ref_dir.mkdir(parents=True, exist_ok=True)
    out = ref_dir / "stasiun.geojson"
    if out.exists() and not overwrite:
        return out
    out.write_text(json.dumps(to_geojson(), ensure_ascii=False, indent=2))
    return out
