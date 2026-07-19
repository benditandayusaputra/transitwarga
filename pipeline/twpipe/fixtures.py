"""Generator data sintetis meniru skema export mission MAPID (blueprint 5.1).

Data sample asli lomba diunduh manual ke pipeline/data/raw/ — file yang sudah
ada TIDAK pernah ditimpa. Fixtures ini hanya untuk pengembangan; kolom mentah
mengikuti gaya header export MAPID dan dipetakan ke skema standar lewat
COLUMN_MAP di twpipe.cleaning (satu tempat penyesuaian saat data asli datang).

Sengaja disisipkan data kotor (duplikat, koordinat teks/koma/invalid, format
tanggal campur) supaya 01_clean teruji realistis.
"""

import csv
import math
import random
from pathlib import Path

from .stations import STATIONS

SEED = 42
N_ROWS = 40

_NAMA_USAHA = [
    "Soto Betawi Bang Udin",
    "Ketoprak Pak Slamet",
    "Nasi Goreng Kambing Kebon",
    "Bakso Urat Mas Yon",
    "Gado-Gado Bu Tini",
    "Sate Ayam Madura Cak Har",
    "Warteg Bahari Jaya",
    "Ayam Geprek Juara",
    "Es Cendol Dawet Segar",
    "Kopi Tuku Pinggir",
    "Mie Ayam Ceker 88",
    "Nasi Uduk Ibu Yati",
    "Roti Bakar Eddy Junior",
    "Martabak Manis Bulan",
    "Ketupat Sayur Padang",
    "Bubur Ayam Cikini",
    "Siomay Bandung Kang Asep",
    "Pecel Lele Lamongan",
    "Nasi Padang Sederhana Tenda",
    "Toge Goreng Pak Haji",
]
_MENU = [
    "Soto betawi",
    "Ketoprak",
    "Nasi goreng",
    "Bakso urat",
    "Gado-gado",
    "Sate ayam",
    "Nasi rames",
    "Ayam geprek",
    "Es cendol",
    "Kopi susu",
    "Mie ayam",
    "Nasi uduk",
    "Roti bakar",
    "Martabak",
    "Ketupat sayur",
    "Bubur ayam",
    "Siomay",
    "Pecel lele",
    "Rendang",
    "Toge goreng",
]
_JENIS = ["Kaki Lima", "Gerobak", "Warung Tenda", "Kafe", "Restoran", "Fast Food"]
_JENIS_BOBOT = [0.30, 0.25, 0.20, 0.10, 0.10, 0.05]
_KERAMAIAN = ["Sepi", "Sedang", "Ramai"]
_MERCHANT = [
    "RM Padang Salero",
    "Warung Nasi Hj. Enah",
    "Alfamart",
    "Indomaret",
    "Kopi Kenangan",
    "Apotek K-24",
    "Bakmi GM",
    "Warung Kopi Asiang",
    "Gojek Top Up",
    "Warteg Sederhana",
    "Es Teh Indonesia",
    "Mixue",
]
_KATEGORI_STRUK = [
    "Restoran/Kafe",
    "Warung/Kaki Lima",
    "Minimarket",
    "Apotek",
    "Transportasi",
    "Lainnya",
]
_KATEGORI_BOBOT = [0.3, 0.3, 0.2, 0.05, 0.1, 0.05]
_METODE = ["Tunai", "QRIS", "Debit", "Kredit", "E-Wallet"]
_METODE_BOBOT = [0.45, 0.3, 0.1, 0.05, 0.1]
_JUDUL_AKTIVITAS = [
    "Penataan PKL trotoar",
    "Kerja bakti kawasan stasiun",
    "Razia parkir liar",
    "Festival kuliner kaki lima",
    "Sosialisasi QRIS pedagang",
    "Perbaikan trotoar",
    "Pendataan pedagang",
    "Uji coba kantong PKL",
]
_KATEGORI_PROPERTI = ["Ruko", "Kios", "Lahan", "Rumah"]


def _offset_point(
    rng: random.Random, lat: float, lon: float, max_m: float = 700.0
) -> tuple[float, float]:
    """Geser titik 30..max_m meter ke arah acak dari stasiun."""
    dist = rng.uniform(30, max_m)
    bearing = rng.uniform(0, 2 * math.pi)
    dlat = dist * math.cos(bearing) / 111_320.0
    dlon = dist * math.sin(bearing) / (111_320.0 * math.cos(math.radians(lat)))
    return round(lat + dlat, 6), round(lon + dlon, 6)


def _station(rng: random.Random) -> dict:
    return rng.choice(STATIONS)


def _write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _menu_go_rows(rng: random.Random, foto_dir: Path | None = None) -> list[dict]:
    from .foto import generate_foto

    rows = []
    for i in range(N_ROWS):
        st = _station(rng)
        lat, lon = _offset_point(rng, float(st["lat"]), float(st["lon"]))
        jenis = rng.choices(_JENIS, weights=_JENIS_BOBOT)[0]
        harga = rng.choice([8000, 10000, 12000, 15000, 18000, 20000, 25000, 35000, 45000])
        nama = f"{rng.choice(_NAMA_USAHA)} {i + 1}"
        # foto ilustrasi lokal (same-origin) supaya fitur foto benar-benar jalan;
        # data asli MAPID akan berisi URL foto sungguhan di kolom yang sama
        foto_url = (
            generate_foto(foto_dir, i + 1, nama, jenis)
            if foto_dir is not None
            else f"https://data.transitwarga.example/foto/usaha-{i + 1}.jpg"
        )
        rows.append(
            {
                "Nama Tempat Makan": nama,
                "Jenis Tempat Makan": jenis,
                "Menu Andalan": rng.choice(_MENU),
                "Harga Rata-Rata Per Porsi": harga,
                "Tingkat Keramaian": rng.choices(_KERAMAIAN, weights=[0.2, 0.45, 0.35])[0],
                "Mobilitas": rng.choices(["Menetap", "Berpindah-pindah"], weights=[0.7, 0.3])[0],
                "Waktu Pencatatan": (
                    f"2026-07-{rng.randint(1, 12):02d} "
                    f"{rng.randint(6, 21):02d}:{rng.choice(['00', '15', '30', '45'])}"
                ),
                "Foto Tempat": foto_url,
                "Latitude": lat,
                "Longitude": lon,
            }
        )
    # data kotor: 2 duplikat persis + 1 koordinat (0,0) + 1 latitude kosong
    rows.append(dict(rows[3]))
    rows.append(dict(rows[7]))
    kotor1 = dict(rows[5])
    kotor1.update({"Nama Tempat Makan": "Warung Tanpa Koordinat", "Latitude": 0, "Longitude": 0})
    rows.append(kotor1)
    kotor2 = dict(rows[6])
    kotor2.update({"Nama Tempat Makan": "Warung Latitude Kosong", "Latitude": ""})
    rows.append(kotor2)
    return rows


def _struk_go_rows(rng: random.Random) -> list[dict]:
    rows = []
    for _i in range(N_ROWS):
        st = _station(rng)
        lat, lon = _offset_point(rng, float(st["lat"]), float(st["lon"]))
        tanggal_fmt = rng.choice(["iso", "slash", "dash"])
        hari = rng.randint(1, 12)
        if tanggal_fmt == "iso":
            tanggal = f"2026-07-{hari:02d}"
        elif tanggal_fmt == "slash":
            tanggal = f"{hari:02d}/07/2026"
        else:
            tanggal = f"{hari:02d}-07-2026"
        menit = rng.choice(["05", "10", "20", "30", "40", "55"])
        jam = f"{rng.randint(6, 21):02d}{rng.choice([':', '.'])}{menit}"
        # Struk Go menyimpan koordinat sebagai teks; sebagian pakai koma desimal/spasi
        gaya = rng.choice(["plain", "spasi", "koma"])
        if gaya == "plain":
            lat_s, lon_s = str(lat), str(lon)
        elif gaya == "spasi":
            lat_s, lon_s = f" {lat} ", f" {lon} "
        else:
            lat_s, lon_s = str(lat).replace(".", ","), str(lon).replace(".", ",")
        rows.append(
            {
                "Nama Merchant": rng.choice(_MERCHANT),
                "Kategori": rng.choices(_KATEGORI_STRUK, weights=_KATEGORI_BOBOT)[0],
                "Tanggal Transaksi": tanggal,
                "Jam Transaksi": jam,
                "Metode Pembayaran": rng.choices(_METODE, weights=_METODE_BOBOT)[0],
                "Total Belanja": rng.choice([12000, 15000, 18000, 22000, 30000, 42000, 55000]),
                "Latitude": lat_s,
                "Longitude": lon_s,
            }
        )
    # data kotor: 1 duplikat + 1 koordinat tak terparse + 1 di luar Jakarta
    rows.append(dict(rows[2]))
    kotor1 = dict(rows[4])
    kotor1.update({"Latitude": "abc", "Longitude": "-"})
    rows.append(kotor1)
    kotor2 = dict(rows[8])
    kotor2.update({"Latitude": "3.5952", "Longitude": "98.6722"})  # Medan
    rows.append(kotor2)
    return rows


def _activity_rows(rng: random.Random) -> list[dict]:
    rows = []
    for i in range(N_ROWS):
        st = _station(rng)
        lat, lon = _offset_point(rng, float(st["lat"]), float(st["lon"]), max_m=500.0)
        judul = rng.choice(_JUDUL_AKTIVITAS)
        rows.append(
            {
                "ID": f"act-{i + 1:03d}",
                "Judul": judul,
                "Deskripsi": f"{judul} di sekitar {st['nama']}",
                "Tanggal": f"2026-07-{rng.randint(1, 12):02d}",
                "Latitude": lat,
                "Longitude": lon,
            }
        )
    return rows


def _properti_rows(rng: random.Random) -> list[dict]:
    rows = []
    for i in range(N_ROWS):
        st = _station(rng)
        lat, lon = _offset_point(rng, float(st["lat"]), float(st["lon"]))
        rows.append(
            {
                "ID": f"prop-{i + 1:03d}",
                "Kategori Properti": rng.choice(_KATEGORI_PROPERTI),
                "Jenis Penawaran": rng.choices(["Sewa", "Jual"], weights=[0.7, 0.3])[0],
                "Harga": rng.choice([25, 40, 60, 85, 120, 250, 400]) * 1_000_000,
                "Latitude": lat,
                "Longitude": lon,
            }
        )
    return rows


def generate(
    raw_dir: Path, ref_dir: Path, seed: int = SEED, foto_dir: Path | None = None
) -> list[Path]:
    """Tulis fixtures ke raw_dir; file yang sudah ada dilewati (jangan timpa data asli).

    foto_dir: bila diisi, foto ilustrasi lokal dibuat dan Foto Tempat menunjuk
    /foto/usaha-N.jpg (dipakai 00_fixtures; test boleh melewatkan).
    """
    from .stations import write_ref_geojson

    raw_dir.mkdir(parents=True, exist_ok=True)
    write_ref_geojson(ref_dir)

    rng = random.Random(seed)
    builders = {
        "menu_go.csv": lambda r: _menu_go_rows(r, foto_dir),
        "struk_go.csv": _struk_go_rows,
        "activity.csv": _activity_rows,
        "properti_go.csv": _properti_rows,
    }
    written: list[Path] = []
    for name, build in builders.items():
        path = raw_dir / name
        if path.exists():
            print(f"[fixtures] {name} sudah ada, dilewati (tidak menimpa data asli)")
            continue
        _write_csv(path, build(rng))
        written.append(path)
        print(f"[fixtures] tulis {path}")
    return written
