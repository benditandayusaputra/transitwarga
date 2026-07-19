"""Test spatial join: titik dalam vs luar buffer 400/800 m."""

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

from twpipe.analyze import RADIUS_DALAM, assign_kawasan, build_kawasan

# ~1 derajat lintang = 111.32 km; offset kecil dihitung dari situ.
_M_PER_DEG = 111_320.0

STASIUN = gpd.GeoDataFrame(
    {
        "kawasan_id": ["mrt-uji"],
        "nama": ["Stasiun Uji"],
        "moda": ["mrt"],
    },
    geometry=[Point(106.8000, -6.2000)],
    crs="EPSG:4326",
)


def _usaha_at(offset_m: float, **extra) -> dict:
    return {
        "id": f"u-{offset_m}",
        "nama": f"Usaha {offset_m}m",
        "jenis_tempat": "kaki_lima",
        "harga_rata": 15000,
        "keramaian": "ramai",
        "ai_okupansi_trotoar": None,
        "lat": -6.2000 + offset_m / _M_PER_DEG,
        "lon": 106.8000,
        **extra,
    }


class TestAssignKawasan:
    def test_dalam_400(self):
        hasil = assign_kawasan(pd.DataFrame([_usaha_at(200)]), STASIUN)
        assert hasil.loc[0, "kawasan_id"] == "mrt-uji"
        assert hasil.loc[0, "jarak_stasiun_m"] <= RADIUS_DALAM

    def test_antara_400_dan_800(self):
        hasil = assign_kawasan(pd.DataFrame([_usaha_at(600)]), STASIUN)
        assert hasil.loc[0, "kawasan_id"] == "mrt-uji"
        assert 400 < hasil.loc[0, "jarak_stasiun_m"] <= 800

    def test_di_luar_800_tanpa_kawasan(self):
        hasil = assign_kawasan(pd.DataFrame([_usaha_at(2000)]), STASIUN)
        assert pd.isna(hasil.loc[0, "kawasan_id"])

    def test_dataframe_kosong(self):
        hasil = assign_kawasan(pd.DataFrame(columns=["id", "lat", "lon"]), STASIUN)
        assert "kawasan_id" in hasil.columns
        assert len(hasil) == 0


class TestBuildKawasan:
    def test_hitung_n_usaha_400_vs_800(self):
        usaha = assign_kawasan(
            pd.DataFrame([_usaha_at(200), _usaha_at(600), _usaha_at(2000)]), STASIUN
        )
        transaksi = pd.DataFrame(
            {"kawasan_id": ["mrt-uji", "mrt-uji"], "is_digital": [True, False]}
        )
        kawasan = build_kawasan(STASIUN, usaha, transaksi)
        row = kawasan.iloc[0]
        assert row["n_usaha_400"] == 1
        assert row["n_usaha_800"] == 2  # titik 2000 m tidak dihitung
        assert row["skor_digital"] == 50.0
        assert row["harga_median"] == 15000
