/** Query siap pakai atas parquet statis (blueprint 7.2).

Pembentuk SQL + parameter dan transformasi hasil dipisah sebagai fungsi murni
supaya bisa diuji tanpa worker. Semua nilai dinamis lewat parameter prepared
statement — tanpa konkatenasi string.
*/

import { query, type Row } from './duckdb';
import type { JenisTempat, Keramaian } from '$lib/types';

export interface SqlQuery {
	sql: string;
	params: (string | number)[];
}

export interface IndikatorKawasan {
	kawasanId: string;
	nUsaha: number;
	hargaMedian: number;
	pctDigital: number;
	nTransaksi: number;
}

export interface DistribusiJenis {
	jenis: JenisTempat;
	n: number;
}

export interface BinHarga {
	binLo: number;
	n: number;
}

export interface KomposisiMetode {
	metode: string;
	n: number;
	digital: boolean;
}

export interface DetailUsaha {
	id: string;
	nama: string;
	jenis_tempat: JenisTempat;
	menu_andalan: string | null;
	harga_rata: number;
	keramaian: Keramaian | null;
	mobilitas: string | null;
	waktu_catat: string | null;
	foto_url: string | null;
	sumber: string;
	jarak_stasiun_m: number | null;
	kawasan_id: string | null;
}

export interface CompareRow {
	kawasan_id: string;
	nama: string;
	tipologi: string;
	n_usaha_800: number;
	harga_median: number;
	skor_kepadatan: number;
	skor_keramaian: number;
	skor_digital: number;
	skor_friksi: number;
}

export interface FilterUsahaKriteria {
	hargaMin?: number;
	hargaMax?: number;
	skorKepadatanMin?: number;
}

// ---------- pembentuk SQL (murni) ----------

export function indikatorKawasanQuery(kawasanId: string): SqlQuery {
	return {
		sql: `SELECT
  u.kawasan_id,
  count(*)::INT AS n_usaha,
  CAST(median(u.harga_rata) AS INT) AS harga_median,
  coalesce(t.pct_digital, 0) AS pct_digital,
  coalesce(t.n_transaksi, 0) AS n_transaksi
FROM usaha u
LEFT JOIN (
  SELECT kawasan_id,
         100.0 * avg(CASE WHEN is_digital THEN 1 ELSE 0 END) AS pct_digital,
         count(*)::INT AS n_transaksi
  FROM transaksi GROUP BY kawasan_id
) t USING (kawasan_id)
WHERE u.kawasan_id = ?
GROUP BY u.kawasan_id, t.pct_digital, t.n_transaksi`,
		params: [kawasanId]
	};
}

export function distribusiJenisQuery(kawasanId: string): SqlQuery {
	return {
		sql: `SELECT jenis_tempat, count(*)::INT AS n
FROM usaha WHERE kawasan_id = ?
GROUP BY jenis_tempat ORDER BY n DESC`,
		params: [kawasanId]
	};
}

export const LEBAR_BIN_HARGA = 5000;

export function histogramHargaQuery(kawasanId: string): SqlQuery {
	return {
		sql: `SELECT CAST(floor(harga_rata / ?) AS INT) * ? AS bin_lo, count(*)::INT AS n
FROM usaha WHERE kawasan_id = ?
GROUP BY bin_lo ORDER BY bin_lo`,
		params: [LEBAR_BIN_HARGA, LEBAR_BIN_HARGA, kawasanId]
	};
}

export function komposisiMetodeQuery(kawasanId: string): SqlQuery {
	return {
		sql: `SELECT metode_bayar, count(*)::INT AS n, bool_or(is_digital) AS digital
FROM transaksi WHERE kawasan_id = ?
GROUP BY metode_bayar ORDER BY n DESC`,
		params: [kawasanId]
	};
}

/** Pencarian usaha berdasarkan nama (ILIKE, parameter aman). */
export function cariUsahaQuery(kataKunci: string): SqlQuery {
	return {
		sql: `SELECT id, nama, jenis_tempat, harga_rata, keramaian, kawasan_id, lat, lon
FROM usaha WHERE nama ILIKE ?
ORDER BY nama LIMIT 8`,
		params: [`%${kataKunci}%`]
	};
}

export interface HasilCariUsaha {
	id: string;
	nama: string;
	jenis_tempat: JenisTempat;
	harga_rata: number;
	keramaian: Keramaian;
	kawasan_id: string | null;
	lat: number;
	lon: number;
}

export function toHasilCari(rows: Row[]): HasilCariUsaha[] {
	return rows.map((r) => ({
		id: String(r.id),
		nama: String(r.nama ?? ''),
		jenis_tempat: r.jenis_tempat as JenisTempat,
		harga_rata: Number(r.harga_rata ?? 0),
		keramaian: r.keramaian as Keramaian,
		kawasan_id: (r.kawasan_id as string) ?? null,
		lat: Number(r.lat),
		lon: Number(r.lon)
	}));
}

export async function cariUsaha(kataKunci: string): Promise<HasilCariUsaha[]> {
	const q = cariUsahaQuery(kataKunci);
	return toHasilCari(await query(q.sql, q.params));
}

/** Galeri temuan (halaman Survey): daftar usaha yang punya foto. */
export function galeriUsahaQuery(limit = 12): SqlQuery {
	return {
		sql: `SELECT nama, jenis_tempat, foto_url FROM usaha
WHERE foto_url IS NOT NULL AND foto_url != ''
ORDER BY nama LIMIT ?`,
		params: [limit]
	};
}

export interface ItemGaleri {
	nama: string;
	jenis_tempat: JenisTempat;
	foto_url: string;
}

export function toItemGaleri(rows: Row[]): ItemGaleri[] {
	return rows.map((r) => ({
		nama: String(r.nama ?? ''),
		jenis_tempat: r.jenis_tempat as JenisTempat,
		foto_url: String(r.foto_url ?? '')
	}));
}

export async function galeriUsaha(limit = 12): Promise<ItemGaleri[]> {
	const q = galeriUsahaQuery(limit);
	return toItemGaleri(await query(q.sql, q.params));
}

export function detailUsahaQuery(id: string): SqlQuery {
	return {
		sql: `SELECT id, nama, jenis_tempat, menu_andalan, harga_rata, keramaian, mobilitas,
  waktu_catat, foto_url, sumber, jarak_stasiun_m, kawasan_id
FROM usaha WHERE id = ? LIMIT 1`,
		params: [id]
	};
}

export function compareKawasanQuery(idA: string, idB: string): SqlQuery {
	return {
		sql: `SELECT kawasan_id, nama, tipologi, n_usaha_800, harga_median,
  skor_kepadatan, skor_keramaian, skor_digital, skor_friksi
FROM kawasan WHERE kawasan_id IN (?, ?)`,
		params: [idA, idB]
	};
}

/** Klausa dibangun hanya untuk kriteria yang diisi; nilai tetap lewat parameter. */
export function filterUsahaQuery(kriteria: FilterUsahaKriteria): SqlQuery {
	const clauses: string[] = [];
	const params: number[] = [];
	if (kriteria.hargaMin !== undefined) {
		clauses.push('u.harga_rata >= ?');
		params.push(kriteria.hargaMin);
	}
	if (kriteria.hargaMax !== undefined) {
		clauses.push('u.harga_rata <= ?');
		params.push(kriteria.hargaMax);
	}
	if (kriteria.skorKepadatanMin !== undefined) {
		clauses.push('k.skor_kepadatan >= ?');
		params.push(kriteria.skorKepadatanMin);
	}
	const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
	return {
		sql: `SELECT u.id FROM usaha u
LEFT JOIN kawasan k ON u.kawasan_id = k.kawasan_id
${where}
ORDER BY u.id`,
		params
	};
}

// ---------- transformasi hasil (murni) ----------

export function toIndikator(rows: Row[], kawasanId: string): IndikatorKawasan {
	const r = rows[0];
	if (!r) {
		return { kawasanId, nUsaha: 0, hargaMedian: 0, pctDigital: 0, nTransaksi: 0 };
	}
	return {
		kawasanId: String(r.kawasan_id ?? kawasanId),
		nUsaha: Number(r.n_usaha ?? 0),
		hargaMedian: Number(r.harga_median ?? 0),
		pctDigital: Number(r.pct_digital ?? 0),
		nTransaksi: Number(r.n_transaksi ?? 0)
	};
}

export function toDistribusiJenis(rows: Row[]): DistribusiJenis[] {
	return rows.map((r) => ({ jenis: r.jenis_tempat as JenisTempat, n: Number(r.n ?? 0) }));
}

export function toBinHarga(rows: Row[]): BinHarga[] {
	return rows.map((r) => ({ binLo: Number(r.bin_lo ?? 0), n: Number(r.n ?? 0) }));
}

export function toKomposisiMetode(rows: Row[]): KomposisiMetode[] {
	return rows.map((r) => ({
		metode: String(r.metode_bayar ?? ''),
		n: Number(r.n ?? 0),
		digital: Boolean(r.digital)
	}));
}

export function toDetailUsaha(rows: Row[]): DetailUsaha | null {
	const r = rows[0];
	if (!r) return null;
	return {
		id: String(r.id),
		nama: String(r.nama ?? ''),
		jenis_tempat: r.jenis_tempat as JenisTempat,
		menu_andalan: (r.menu_andalan as string) ?? null,
		harga_rata: Number(r.harga_rata ?? 0),
		keramaian: (r.keramaian as Keramaian) ?? null,
		mobilitas: (r.mobilitas as string) ?? null,
		waktu_catat: (r.waktu_catat as string) ?? null,
		foto_url: (r.foto_url as string) ?? null,
		sumber: String(r.sumber ?? ''),
		jarak_stasiun_m: r.jarak_stasiun_m === null ? null : Number(r.jarak_stasiun_m),
		kawasan_id: (r.kawasan_id as string) ?? null
	};
}

export function toCompareRows(rows: Row[], idA: string, idB: string): CompareRow[] {
	const byId = new Map(rows.map((r) => [String(r.kawasan_id), r]));
	// urutan hasil mengikuti urutan pilihan pengguna, bukan urutan SQL
	return [idA, idB]
		.map((id) => byId.get(id))
		.filter((r): r is Row => r !== undefined)
		.map((r) => ({
			kawasan_id: String(r.kawasan_id),
			nama: String(r.nama ?? ''),
			tipologi: String(r.tipologi ?? ''),
			n_usaha_800: Number(r.n_usaha_800 ?? 0),
			harga_median: Number(r.harga_median ?? 0),
			skor_kepadatan: Number(r.skor_kepadatan ?? 0),
			skor_keramaian: Number(r.skor_keramaian ?? 0),
			skor_digital: Number(r.skor_digital ?? 0),
			skor_friksi: Number(r.skor_friksi ?? 0)
		}));
}

export function toIdList(rows: Row[]): string[] {
	return rows.map((r) => String(r.id));
}

// ---------- API tingkat tinggi (memakai worker) ----------

export async function statsKawasan(kawasanId: string): Promise<IndikatorKawasan> {
	const q = indikatorKawasanQuery(kawasanId);
	return toIndikator(await query(q.sql, q.params), kawasanId);
}

export async function distribusiJenis(kawasanId: string): Promise<DistribusiJenis[]> {
	const q = distribusiJenisQuery(kawasanId);
	return toDistribusiJenis(await query(q.sql, q.params));
}

export async function histogramHarga(kawasanId: string): Promise<BinHarga[]> {
	const q = histogramHargaQuery(kawasanId);
	return toBinHarga(await query(q.sql, q.params));
}

export async function komposisiMetode(kawasanId: string): Promise<KomposisiMetode[]> {
	const q = komposisiMetodeQuery(kawasanId);
	return toKomposisiMetode(await query(q.sql, q.params));
}

export async function detailUsaha(id: string): Promise<DetailUsaha | null> {
	const q = detailUsahaQuery(id);
	return toDetailUsaha(await query(q.sql, q.params));
}

export async function compareKawasan(idA: string, idB: string): Promise<CompareRow[]> {
	const q = compareKawasanQuery(idA, idB);
	return toCompareRows(await query(q.sql, q.params), idA, idB);
}

export async function filterUsaha(kriteria: FilterUsahaKriteria): Promise<string[]> {
	const q = filterUsahaQuery(kriteria);
	return toIdList(await query(q.sql, q.params));
}
