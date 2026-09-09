# Override di CI: make build-data PY=python
PY ?= .venv/bin/python
PYTEST ?= .venv/bin/pytest
RUFF ?= .venv/bin/ruff

# VISION=mock (default) mengisi kolom ai_* deterministik tanpa API;
# VISION=live memanggil model via LiteLLM (butuh env VISION_MODEL + VISION_API_KEY).
VISION ?= mock
ifeq ($(VISION),live)
VISION_FLAG :=
else
VISION_FLAG := --mock
endif

.PHONY: build-data check-tippecanoe load-db test lint format clean fetch-activities

fetch-activities:
	$(PY) fetch_activities.py

build-data: check-tippecanoe
	$(PY) 00_fixtures.py
	$(PY) 01_clean.py
	$(PY) 02_vision.py $(VISION_FLAG)
	$(PY) 03_analyze.py
	$(PY) 04_export.py

check-tippecanoe:
	@command -v tippecanoe >/dev/null 2>&1 && command -v tile-join >/dev/null 2>&1 || { \
		echo "ERROR: tippecanoe/tile-join tidak ditemukan."; \
		echo "  macOS : brew install tippecanoe"; \
		echo "  Ubuntu: git clone https://github.com/felt/tippecanoe && make -j && sudo make install"; \
		exit 1; }

# Opsional: muat artefak olahan ke PostgreSQL (env DATABASE_URL / pipeline/.env)
load-db:
	$(PY) 05_load_postgres.py

test:
	$(PYTEST)

lint:
	$(RUFF) check . && $(RUFF) format --check .

format:
	$(RUFF) format . && $(RUFF) check --fix .

clean:
	rm -rf data/interim data/review
