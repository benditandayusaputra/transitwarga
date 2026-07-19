"""Test scoring: normalisasi ekstrem dan aturan tipologi."""

import pandas as pd

from twpipe.analyze import (
    AMBANG_DIGITAL_RENDAH,
    AMBANG_FRIKSI,
    AMBANG_PADAT,
    AMBANG_SEPI,
    minmax_100,
    tipologi_kawasan,
)


class TestMinmax100:
    def test_nilai_ekstrem(self):
        hasil = minmax_100(pd.Series([0.0, 5.0, 10.0]))
        assert hasil.tolist() == [0.0, 50.0, 100.0]

    def test_seri_konstan_jadi_50(self):
        hasil = minmax_100(pd.Series([7.0, 7.0, 7.0]))
        assert hasil.tolist() == [50.0, 50.0, 50.0]

    def test_nilai_negatif(self):
        hasil = minmax_100(pd.Series([-10.0, 10.0]))
        assert hasil.tolist() == [0.0, 100.0]


def _row(kepadatan: float, friksi: float = 0.0, digital: float = 100.0) -> pd.Series:
    return pd.Series({"skor_kepadatan": kepadatan, "skor_friksi": friksi, "skor_digital": digital})


class TestTipologi:
    def test_sepi(self):
        assert tipologi_kawasan(_row(AMBANG_SEPI - 1)) == "sepi"

    def test_padat_friksi(self):
        assert tipologi_kawasan(_row(AMBANG_PADAT, friksi=AMBANG_FRIKSI)) == "padat_friksi"

    def test_prioritas_digital(self):
        row = _row(AMBANG_PADAT, friksi=0.0, digital=AMBANG_DIGITAL_RENDAH - 1)
        assert tipologi_kawasan(row) == "prioritas_digital"

    def test_kuliner_matang(self):
        row = _row(AMBANG_PADAT, friksi=0.0, digital=AMBANG_DIGITAL_RENDAH + 10)
        assert tipologi_kawasan(row) == "kuliner_matang"

    def test_potensi(self):
        assert tipologi_kawasan(_row((AMBANG_SEPI + AMBANG_PADAT) / 2)) == "potensi"

    def test_friksi_mengalahkan_digital(self):
        # padat + friksi tinggi + digital rendah -> padat_friksi (urutan aturan)
        row = _row(AMBANG_PADAT, friksi=AMBANG_FRIKSI, digital=0.0)
        assert tipologi_kawasan(row) == "padat_friksi"
