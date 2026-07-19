"""Export artefak final: parquet + tiles.pmtiles + agregat.json."""

import sys

from twpipe import export, paths

if __name__ == "__main__":
    export.run(
        paths.INTERIM_DIR,
        paths.WEB_DATA_DIR,
        paths.API_GENERATED_DIR,
        skip_tiles="--skip-tiles" in sys.argv,
    )
