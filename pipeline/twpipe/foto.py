"""Generator foto ilustrasi untuk fixtures (Pillow, deterministik).

Dataset asli MAPID (Menu Go) menyimpan URL foto tempat; fixtures sintetis
tidak punya foto nyata, jadi kita gambar ilustrasi lapak sederhana per usaha
ke web/static/foto/ (dilayani same-origin -> lolos CSP img-src 'self',
jalan offline). Saat data asli dipakai, foto_url berisi URL foto sungguhan
dan generator ini otomatis tidak dipakai.
"""

import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LEBAR, TINGGI = 640, 480

# selaras JENIS_COLORS di web/src/lib/map/layers.ts (Okabe-Ito)
WARNA_JENIS: dict[str, tuple[int, int, int]] = {
    "Kaki Lima": (230, 159, 0),
    "Gerobak": (213, 94, 0),
    "Warung Tenda": (0, 158, 115),
    "Kafe": (204, 121, 167),
    "Restoran": (0, 114, 178),
    "Fast Food": (86, 180, 233),
}


def _muda(warna: tuple[int, int, int], faktor: float = 0.82) -> tuple[int, int, int]:
    return tuple(int(c + (255 - c) * faktor) for c in warna)  # type: ignore[return-value]


def _font(ukuran: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    try:
        return ImageFont.load_default(size=ukuran)
    except TypeError:  # Pillow lama tanpa argumen size
        return ImageFont.load_default()


def _gambar_lapak(d: ImageDraw.ImageDraw, warna: tuple[int, int, int], variasi: int) -> None:
    """Ilustrasi kios sederhana: badan, jendela, dan tenda bergaris."""
    kiri, atas, kanan, bawah = 140, 170, 500, 390
    d.rounded_rectangle(
        [kiri, atas, kanan, bawah], radius=14, fill=(255, 255, 255), outline=warna, width=4
    )
    # jendela/etalase
    d.rounded_rectangle(
        [kiri + 40, atas + 60, kanan - 40, bawah - 40], radius=8, fill=_muda(warna, 0.6)
    )
    # tenda bergaris di atas badan
    n_strip = 8
    lebar_strip = (kanan - kiri + 40) / n_strip
    for i in range(n_strip):
        x0 = kiri - 20 + i * lebar_strip
        warna_strip = warna if i % 2 == (variasi % 2) else (255, 255, 255)
        d.rectangle(
            [x0, atas - 46, x0 + lebar_strip, atas + 6], fill=warna_strip, outline=warna, width=2
        )
    # tiang
    d.rectangle([kiri + 8, bawah, kiri + 20, bawah + 40], fill=warna)
    d.rectangle([kanan - 20, bawah, kanan - 8, bawah + 40], fill=warna)


def generate_foto(foto_dir: Path, nomor: int, nama: str, jenis: str) -> str:
    """Tulis satu JPG ilustrasi; kembalikan path URL relatif (/foto/usaha-N.jpg)."""
    foto_dir.mkdir(parents=True, exist_ok=True)
    nama_file = f"usaha-{nomor}.jpg"
    tujuan = foto_dir / nama_file
    if not tujuan.exists():
        warna = WARNA_JENIS.get(jenis, (100, 116, 139))
        variasi = int(hashlib.sha1(nama.encode()).hexdigest(), 16)
        img = Image.new("RGB", (LEBAR, TINGGI), _muda(warna))
        d = ImageDraw.Draw(img)
        _gambar_lapak(d, warna, variasi)
        d.text((LEBAR / 2, 62), jenis, font=_font(26), fill=warna, anchor="mm")
        teks_nama = nama if len(nama) <= 34 else nama[:33] + "..."
        d.text((LEBAR / 2, 436), teks_nama, font=_font(30), fill=(30, 41, 59), anchor="mm")
        d.text(
            (LEBAR / 2, 464),
            "Foto ilustrasi: data sintetis TransitWarga",
            font=_font(16),
            fill=(100, 116, 139),
            anchor="mm",
        )
        img.save(tujuan, "JPEG", quality=82)
    return f"/foto/{nama_file}"
