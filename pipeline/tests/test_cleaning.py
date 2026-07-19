"""Test cleaning: koordinat teks, tanggal aneh, duplikat, enum."""

from datetime import date

import pandas as pd

from twpipe.cleaning import (
    clean_menu_go,
    clean_struk_go,
    parse_coord,
    parse_jam,
    parse_tanggal,
)


class TestParseCoord:
    def test_koma_desimal(self):
        assert parse_coord("-6,2444", "lat") == -6.2444

    def test_spasi(self):
        assert parse_coord(" 106.798 ", "lon") == 106.798

    def test_teks_rusak(self):
        assert parse_coord("abc", "lat") is None
        assert parse_coord("-", "lon") is None
        assert parse_coord("", "lat") is None
        assert parse_coord(None, "lat") is None

    def test_di_luar_jakarta(self):
        assert parse_coord("3.5952", "lat") is None  # Medan
        assert parse_coord("0", "lat") is None
        assert parse_coord("98.6722", "lon") is None


class TestParseTanggal:
    def test_berbagai_format(self):
        expected = date(2026, 7, 5)
        assert parse_tanggal("2026-07-05") == expected
        assert parse_tanggal("05/07/2026") == expected
        assert parse_tanggal("05-07-2026") == expected

    def test_rusak(self):
        assert parse_tanggal("kemarin") is None
        assert parse_tanggal("") is None


class TestParseJam:
    def test_format_titik_dua(self):
        assert parse_jam("17:35") == 17

    def test_format_titik(self):
        assert parse_jam("07.15") == 7

    def test_jam_saja(self):
        assert parse_jam("9") == 9

    def test_invalid(self):
        assert parse_jam("25:00") is None
        assert parse_jam("siang") is None


def _menu_go_df(rows: list[dict]) -> pd.DataFrame:
    base = {
        "Nama Tempat Makan": "Warung Uji",
        "Jenis Tempat Makan": "Kaki Lima",
        "Menu Andalan": "Soto",
        "Harga Rata-Rata Per Porsi": "15000",
        "Tingkat Keramaian": "Ramai",
        "Mobilitas": "Menetap",
        "Waktu Pencatatan": "2026-07-05 17:30",
        "Foto Tempat": "https://x/foto.jpg",
        "Latitude": "-6.2444",
        "Longitude": "106.7980",
    }
    return pd.DataFrame([{**base, **r} for r in rows])


class TestCleanMenuGo:
    def test_duplikat_dibuang(self):
        df = _menu_go_df([{}, {}, {"Nama Tempat Makan": "Lain"}])
        hasil = clean_menu_go(df)
        assert len(hasil) == 2

    def test_koordinat_invalid_dibuang(self):
        df = _menu_go_df([{}, {"Latitude": "0", "Longitude": "0"}, {"Latitude": ""}])
        hasil = clean_menu_go(df)
        assert len(hasil) == 1

    def test_enum_dinormalisasi(self):
        df = _menu_go_df([{"Jenis Tempat Makan": "Warung Tenda", "Mobilitas": "Berpindah-pindah"}])
        hasil = clean_menu_go(df)
        assert hasil.loc[0, "jenis_tempat"] == "warung_tenda"
        assert hasil.loc[0, "mobilitas"] == "keliling"
        assert hasil.loc[0, "keramaian"] == "ramai"

    def test_kolom_ai_placeholder(self):
        hasil = clean_menu_go(_menu_go_df([{}]))
        for col in ("ai_jenis_lapak", "ai_okupansi_trotoar", "ai_kondisi", "ai_confidence"):
            assert col in hasil.columns
            assert hasil[col].isna().all()


def _struk_df(rows: list[dict]) -> pd.DataFrame:
    base = {
        "Nama Merchant": "RM Uji",
        "Kategori": "Warung/Kaki Lima",
        "Tanggal Transaksi": "05/07/2026",
        "Jam Transaksi": "17.35",
        "Metode Pembayaran": "QRIS",
        "Total Belanja": "20000",
        "Latitude": "-6,2444",
        "Longitude": "106,7980",
    }
    return pd.DataFrame([{**base, **r} for r in rows])


class TestCleanStrukGo:
    def test_koordinat_teks_dicast(self):
        hasil = clean_struk_go(_struk_df([{}]))
        assert hasil.loc[0, "lat"] == -6.2444
        assert hasil.loc[0, "lon"] == 106.798

    def test_tanggal_dan_jam(self):
        hasil = clean_struk_go(_struk_df([{}]))
        assert hasil.loc[0, "tanggal"] == date(2026, 7, 5)
        assert hasil.loc[0, "jam"] == 17

    def test_is_digital(self):
        hasil = clean_struk_go(
            _struk_df([{}, {"Metode Pembayaran": "Tunai", "Jam Transaksi": "09:00"}])
        )
        by_metode = hasil.set_index("metode_bayar")["is_digital"]
        assert bool(by_metode["qris"]) is True
        assert bool(by_metode["tunai"]) is False

    def test_duplikat_dibuang(self):
        hasil = clean_struk_go(_struk_df([{}, {}]))
        assert len(hasil) == 1
