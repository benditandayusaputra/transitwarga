"""Test 02_vision mode mock: deterministik, valid, dan tersambung ke skor friksi."""

import pandas as pd
import pytest

from twpipe import analyze, cleaning, fixtures, vision


@pytest.fixture()
def interim(tmp_path):
    raw = tmp_path / "raw"
    ref = tmp_path / "ref"
    out = tmp_path / "interim"
    fixtures.generate(raw, ref)
    cleaning.run(raw, ref, out)
    return tmp_path


def test_mock_deterministik(interim):
    a = vision.run(interim / "interim", interim / "review_a", mock=True)
    b = vision.run(interim / "interim", interim / "review_b", mock=True)
    assert a["ai_okupansi_trotoar"].tolist() == b["ai_okupansi_trotoar"].tolist()
    assert a["ai_confidence"].tolist() == b["ai_confidence"].tolist()


def test_nilai_dalam_rentang(interim):
    hasil = vision.run(interim / "interim", interim / "review", mock=True)
    assert hasil["ai_okupansi_trotoar"].dropna().isin([0, 1, 2]).all()
    assert hasil["ai_kondisi"].dropna().between(1, 5).all()
    assert hasil["ai_confidence"].dropna().between(0, 1).all()
    assert hasil["ai_jenis_lapak"].notna().all()


def test_review_list_confidence_rendah(interim):
    hasil = vision.run(interim / "interim", interim / "review", mock=True)
    daftar = pd.read_csv(interim / "review" / "review_manual.csv")
    n_rendah = int((hasil["ai_confidence"] < vision.AMBANG_REVIEW).sum())
    assert len(daftar) == n_rendah


def test_friksi_memakai_okupansi(interim):
    vision.run(interim / "interim", interim / "review", mock=True)
    analyze.run(interim / "ref", interim / "interim")
    kawasan = pd.read_parquet(interim / "interim" / "kawasan.parquet")
    # dengan ai_okupansi terisi, friksi = campuran okupansi & kepadatan,
    # sehingga tidak lagi identik dengan skor_kepadatan di semua kawasan
    assert not kawasan["skor_friksi"].equals(kawasan["skor_kepadatan"])
