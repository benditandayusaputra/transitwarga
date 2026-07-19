"""Standardisasi data mentah -> data/interim/*.parquet (skema blueprint 5.1)."""

from twpipe import cleaning, paths

if __name__ == "__main__":
    cleaning.run(paths.RAW_DIR, paths.REF_DIR, paths.INTERIM_DIR)
