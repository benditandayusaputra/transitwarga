"""Klasifikasi foto usaha via LiteLLM (env VISION_MODEL); --mock tanpa API."""

import sys

from twpipe import paths, vision
from twpipe.envfile import muat_env

if __name__ == "__main__":
    muat_env()  # VISION_MODEL/VISION_API_KEY boleh dari pipeline/.env
    vision.run(paths.INTERIM_DIR, paths.REVIEW_DIR, mock="--mock" in sys.argv)
