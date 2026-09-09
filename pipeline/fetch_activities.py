"""pipeline/fetch_activities.py

Mengunduh data observasi lapangan dari MAPID Activities API dengan hashtag #Devunder
dan menyimpannya ke pipeline/data/raw/activity.csv.
"""

import csv
import json
import os
import sys
import urllib.request
from pathlib import Path

API_URL = "https://server.mapid.io/web/competition/activities"
DEFAULT_API_KEY = "6a919d9453df37905b3a5d49"

JABODETABEK_POLYGON = [
    [
        [106.3, -7.0],
        [107.3, -7.0],
        [107.3, -5.9],
        [106.3, -5.9],
        [106.3, -7.0],
    ]
]


def fetch_activities(api_key: str = DEFAULT_API_KEY) -> list[dict]:
    payload = {
        "feature": {
            "type": "Polygon",
            "coordinates": JABODETABEK_POLYGON,
        },
        "start_date": "2024-01-01",
        "end_date": "2026-12-31",
        "hashtag": ["Devunder"],
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if not data.get("success"):
            raise RuntimeError(f"Gagal memuat activities: {data.get('message')}")
        return data.get("data", {}).get("activities", [])


def save_to_csv(activities: list[dict], output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Judul", "Deskripsi", "Tanggal", "Latitude", "Longitude"])
        for act in activities:
            coords = act.get("geometry", {}).get("coordinates", [0, 0])
            lon, lat = coords[0], coords[1]
            created = act.get("created_at", "")[:10]
            writer.writerow([
                act.get("_id", ""),
                act.get("title", ""),
                act.get("description", "").replace("\n", " "),
                created,
                lat,
                lon,
            ])
    print(f"[fetch_activities] Berhasil menyimpan {len(activities)} baris ke {output_path}")


def main():
    api_key = os.environ.get("MAPID_API_KEY", DEFAULT_API_KEY)
    raw_dir = Path(__file__).resolve().parent / "data" / "raw"
    csv_file = raw_dir / "activity.csv"

    print(f"Mengunduh data observasi lapangan MAPID (#Devunder)...")
    try:
        acts = fetch_activities(api_key)
        save_to_csv(acts, csv_file)
    except Exception as e:
        print(f"Error saat mengambil data: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
