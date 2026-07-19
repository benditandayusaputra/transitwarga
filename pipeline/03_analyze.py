"""Buffer 400/800 m, spatial join, skor & tipologi -> kawasan.parquet + buffer."""

from twpipe import analyze, paths

if __name__ == "__main__":
    analyze.run(paths.REF_DIR, paths.INTERIM_DIR)
