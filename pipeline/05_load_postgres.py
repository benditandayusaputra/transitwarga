"""Muat artefak olahan ke PostgreSQL (opsional; env DATABASE_URL)."""

from twpipe import paths, postgres

if __name__ == "__main__":
    postgres.load(paths.INTERIM_DIR)
