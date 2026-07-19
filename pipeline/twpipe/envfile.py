"""Loader pipeline/.env sederhana (tanpa dependensi): isi os.environ bila belum ada."""

import os
from pathlib import Path

from .paths import PIPELINE_DIR


def muat_env(path: Path | None = None) -> None:
    """Baca KEY=VALUE dari pipeline/.env (gitignored); env yang sudah di-set menang."""
    path = path or PIPELINE_DIR / ".env"
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())
