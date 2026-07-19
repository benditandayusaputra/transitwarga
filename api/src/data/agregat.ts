/** Digest agregat (dibundel bersama Worker saat deploy) — satu-satunya sumber
fakta untuk prompt AI (blueprint 6.2 & 6.3). Digenerate ulang oleh pipeline
(04_export.py) ke src/generated/agregat.json. */

import agregatJson from '../generated/agregat.json';

export interface KawasanDigest {
  kawasan_id: string;
  nama: string;
  moda: string;
  lat: number;
  lon: number;
  tipologi: string;
  n_usaha_400: number;
  n_usaha_800: number;
  harga_median: number;
  pct_digital: number;
  skor_kepadatan: number;
  skor_keramaian: number;
  skor_digital: number;
  skor_friksi: number;
  top_jenis: string[];
  n_transaksi: number;
}

interface AgregatPayload {
  data_version: string;
  kawasan: KawasanDigest[];
}

const agregat = agregatJson as AgregatPayload;

export const DATA_VERSION: string = agregat.data_version;
export const KAWASAN: KawasanDigest[] = agregat.kawasan;
export const KAWASAN_IDS: ReadonlySet<string> = new Set(KAWASAN.map((k) => k.kawasan_id));

export function findKawasan(id: string): KawasanDigest | undefined {
  return KAWASAN.find((k) => k.kawasan_id === id);
}

/** Digest ringkas seluruh kawasan untuk system prompt chat. */
export function digestSemuaKawasan(): string {
  return JSON.stringify(KAWASAN);
}
