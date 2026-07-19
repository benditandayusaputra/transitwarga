/** Tipe domain bersama (skema blueprint 5.1). */

export type Tipologi = 'kuliner_matang' | 'padat_friksi' | 'potensi' | 'prioritas_digital' | 'sepi';

export type JenisTempat =
	'kaki_lima' | 'gerobak' | 'warung_tenda' | 'kafe' | 'restoran' | 'fast_food';

export type Keramaian = 'sepi' | 'sedang' | 'ramai';
export type Moda = 'mrt' | 'krl' | 'tj' | 'lrt';

/** Satu entri ringkas_stats di agregat.json (digest per kawasan). */
export interface AgregatKawasan {
	kawasan_id: string;
	nama: string;
	moda: Moda;
	lat: number;
	lon: number;
	tipologi: Tipologi;
	n_usaha_400: number;
	n_usaha_800: number;
	harga_median: number;
	pct_digital: number;
	skor_kepadatan: number;
	skor_keramaian: number;
	skor_digital: number;
	skor_friksi: number;
	top_jenis: JenisTempat[];
	n_transaksi: number;
}

export interface AgregatPayload {
	data_version: string;
	kawasan: AgregatKawasan[];
}

/** Baris usaha untuk tabel atribut (atribut ringkas dari tile). */
export interface UsahaRow {
	id: string;
	nama: string;
	jenis_tempat: JenisTempat;
	harga_rata: number;
	keramaian: Keramaian;
	kawasan_id: string;
}
