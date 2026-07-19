"""Generate fixtures sintetis ke data/raw/ (tidak menimpa data asli MAPID)."""

from twpipe import fixtures, paths

if __name__ == "__main__":
    fixtures.generate(paths.RAW_DIR, paths.REF_DIR, foto_dir=paths.WEB_FOTO_DIR)
