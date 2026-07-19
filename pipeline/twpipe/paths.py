"""Lokasi standar artefak pipeline (bisa dioverride di test)."""

from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = PIPELINE_DIR.parent

RAW_DIR = PIPELINE_DIR / "data" / "raw"
REF_DIR = PIPELINE_DIR / "data" / "ref"
INTERIM_DIR = PIPELINE_DIR / "data" / "interim"
REVIEW_DIR = PIPELINE_DIR / "data" / "review"

WEB_DATA_DIR = REPO_DIR / "web" / "static" / "data"
WEB_FOTO_DIR = REPO_DIR / "web" / "static" / "foto"
API_GENERATED_DIR = REPO_DIR / "api" / "src" / "generated"
