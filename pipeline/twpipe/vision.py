"""02_vision: klasifikasi foto usaha via LiteLLM (blueprint 5.1 & 8).

Model vision dipilih lewat env VISION_MODEL (+ VISION_API_KEY); provider bebas
karena LiteLLM menyeragamkan antarmuka. Mode --mock mengisi hasil deterministik
tanpa memanggil API — dipakai CI dan dev tanpa key.

Hasil: kolom ai_jenis_lapak, ai_okupansi_trotoar, ai_kondisi, ai_confidence di
usaha.parquet; baris dengan confidence < AMBANG_REVIEW ditulis ke
data/review/review_manual.csv untuk dicek manual.
"""

import hashlib
import json
import os
from pathlib import Path

import pandas as pd

AMBANG_REVIEW = 0.6

_JENIS_AI = ["kaki_lima", "gerobak", "warung_tenda", "kafe", "restoran", "fast_food"]

PROMPT_VISION = """Klasifikasikan foto tempat usaha makanan pinggir jalan di Jakarta.
Balas HANYA JSON valid dengan skema:
{"jenis_lapak": "kaki_lima|gerobak|warung_tenda|kafe|restoran|fast_food",
 "okupansi_trotoar": 0|1|2,
 "kondisi": 1-5,
 "confidence": 0.0-1.0}
okupansi_trotoar: 0 = tidak menempati trotoar, 1 = sebagian, 2 = dominan."""


def _mock_hasil(usaha_id: str, jenis_tempat: str) -> dict:
    """Hasil deterministik dari hash id: stabil antar-run, tanpa API."""
    h = int(hashlib.sha1(usaha_id.encode()).hexdigest(), 16)
    okupansi = h % 3
    kondisi = 1 + (h // 3) % 5
    confidence = round(0.5 + ((h // 15) % 50) / 100.0, 2)  # 0.50-0.99
    jenis = jenis_tempat if jenis_tempat in _JENIS_AI else _JENIS_AI[h % len(_JENIS_AI)]
    return {
        "jenis_lapak": jenis,
        "okupansi_trotoar": okupansi,
        "kondisi": kondisi,
        "confidence": confidence,
    }


def _panggil_vision(model: str, api_key: str, foto_url: str) -> dict:
    """Satu panggilan vision via LiteLLM; balasan wajib JSON sesuai skema."""
    import litellm

    resp = litellm.completion(
        model=model,
        api_key=api_key,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT_VISION},
                    {"type": "image_url", "image_url": {"url": foto_url}},
                ],
            }
        ],
        temperature=0,
    )
    teks = resp.choices[0].message.content or "{}"
    awal, akhir = teks.find("{"), teks.rfind("}")
    if awal == -1 or akhir == -1:
        raise ValueError(f"balasan vision bukan JSON: {teks[:80]}")
    return json.loads(teks[awal : akhir + 1])


def _validasi(hasil: dict) -> dict | None:
    try:
        jenis = str(hasil["jenis_lapak"])
        okupansi = int(hasil["okupansi_trotoar"])
        kondisi = int(hasil["kondisi"])
        confidence = float(hasil["confidence"])
    except (KeyError, TypeError, ValueError):
        return None
    if jenis not in _JENIS_AI or okupansi not in (0, 1, 2):
        return None
    if not (1 <= kondisi <= 5 and 0.0 <= confidence <= 1.0):
        return None
    return {
        "jenis_lapak": jenis,
        "okupansi_trotoar": okupansi,
        "kondisi": kondisi,
        "confidence": confidence,
    }


def run(interim_dir: Path, review_dir: Path, mock: bool = True) -> pd.DataFrame:
    usaha = pd.read_parquet(interim_dir / "usaha.parquet")
    model = os.environ.get("VISION_MODEL", "")
    api_key = os.environ.get("VISION_API_KEY", "")
    if not mock and (not model or not api_key):
        raise SystemExit(
            "VISION_MODEL / VISION_API_KEY belum di-set. Jalankan dengan --mock "
            "atau isi env (lihat README pipeline)."
        )

    hasil_list: list[dict | None] = []
    for _, row in usaha.iterrows():
        if mock:
            hasil = _mock_hasil(str(row["id"]), str(row["jenis_tempat"]))
        else:
            try:
                hasil = _validasi(_panggil_vision(model, api_key, str(row["foto_url"])))
            except Exception as e:  # noqa: BLE001 - batch tidak boleh gagal karena 1 foto
                print(f"[vision] gagal utk {row['id']}: {e}")
                hasil = None
        hasil_list.append(hasil)

    usaha["ai_jenis_lapak"] = pd.array(
        [h["jenis_lapak"] if h else None for h in hasil_list], dtype="string"
    )
    usaha["ai_okupansi_trotoar"] = pd.array(
        [h["okupansi_trotoar"] if h else None for h in hasil_list], dtype="Int8"
    )
    usaha["ai_kondisi"] = pd.array([h["kondisi"] if h else None for h in hasil_list], dtype="Int8")
    usaha["ai_confidence"] = pd.array(
        [h["confidence"] if h else None for h in hasil_list], dtype="Float32"
    )

    perlu_review = usaha[usaha["ai_confidence"].isna() | (usaha["ai_confidence"] < AMBANG_REVIEW)]
    review_dir.mkdir(parents=True, exist_ok=True)
    review_path = review_dir / "review_manual.csv"
    perlu_review[["id", "nama", "foto_url", "ai_jenis_lapak", "ai_confidence"]].to_csv(
        review_path, index=False
    )

    usaha.to_parquet(interim_dir / "usaha.parquet", index=False)
    mode = "mock" if mock else f"live ({model})"
    print(
        f"[vision] {len(usaha)} foto diklasifikasi ({mode}); "
        f"{len(perlu_review)} masuk daftar review manual -> {review_path}"
    )
    return usaha
