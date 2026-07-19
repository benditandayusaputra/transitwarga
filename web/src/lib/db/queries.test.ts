import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock lapisan worker: queries.ts tidak boleh menyentuh DuckDB asli di unit test.
vi.mock('./duckdb', () => ({
	query: vi.fn(async () => []),
	dbDimatikanLewatQuery: () => false
}));

import { query, type Row } from './duckdb';
import {
	compareKawasan,
	compareKawasanQuery,
	detailUsahaQuery,
	filterUsahaQuery,
	histogramHargaQuery,
	indikatorKawasanQuery,
	statsKawasan,
	toBinHarga,
	toCompareRows,
	toDetailUsaha,
	toIdList,
	toIndikator,
	toKomposisiMetode
} from './queries';

const mockQuery = vi.mocked(query);

beforeEach(() => {
	mockQuery.mockReset();
	mockQuery.mockResolvedValue([]);
});

describe('pembentuk SQL parameter aman', () => {
	it('indikatorKawasanQuery memakai placeholder, bukan konkatenasi', () => {
		const q = indikatorKawasanQuery("mrt-blok-m'; DROP TABLE usaha; --");
		expect(q.sql).not.toContain('DROP TABLE');
		expect(q.sql).toContain('?');
		expect(q.params).toEqual(["mrt-blok-m'; DROP TABLE usaha; --"]);
	});

	it('detailUsahaQuery satu parameter id', () => {
		const q = detailUsahaQuery('abc123');
		expect(q.params).toEqual(['abc123']);
		expect(q.sql).toContain('WHERE id = ?');
	});

	it('compareKawasanQuery dua parameter', () => {
		const q = compareKawasanQuery('a', 'b');
		expect(q.params).toEqual(['a', 'b']);
		expect(q.sql).toContain('IN (?, ?)');
	});

	it('histogramHargaQuery menyertakan lebar bin sebagai parameter', () => {
		const q = histogramHargaQuery('mrt-senayan');
		expect(q.params).toEqual([5000, 5000, 'mrt-senayan']);
	});

	it('cariUsahaQuery memakai ILIKE berparameter (aman injeksi)', async () => {
		const { cariUsahaQuery, toHasilCari } = await import('./queries');
		const q = cariUsahaQuery("soto'; DROP TABLE usaha; --");
		expect(q.sql).toContain('ILIKE ?');
		expect(q.sql).not.toContain('DROP');
		expect(q.params).toEqual(["%soto'; DROP TABLE usaha; --%"]);
		expect(toHasilCari([{ id: 'a', nama: 'Soto', lat: -6.2, lon: 106.8 }])[0]).toMatchObject({
			id: 'a',
			nama: 'Soto',
			lat: -6.2
		});
	});
});

describe('filterUsahaQuery dinamis', () => {
	it('tanpa kriteria -> tanpa WHERE, tanpa parameter', () => {
		const q = filterUsahaQuery({});
		expect(q.sql).not.toContain('WHERE');
		expect(q.params).toEqual([]);
	});

	it('rentang harga -> dua klausa berparameter', () => {
		const q = filterUsahaQuery({ hargaMin: 10000, hargaMax: 25000 });
		expect(q.sql).toContain('u.harga_rata >= ?');
		expect(q.sql).toContain('u.harga_rata <= ?');
		expect(q.params).toEqual([10000, 25000]);
	});

	it('skor kepadatan ikut bila diisi', () => {
		const q = filterUsahaQuery({ hargaMax: 20000, skorKepadatanMin: 60 });
		expect(q.sql).toContain('k.skor_kepadatan >= ?');
		expect(q.params).toEqual([20000, 60]);
	});
});

describe('transformasi hasil', () => {
	it('toIndikator: baris kosong -> nol semua', () => {
		expect(toIndikator([], 'mrt-x')).toEqual({
			kawasanId: 'mrt-x',
			nUsaha: 0,
			hargaMedian: 0,
			pctDigital: 0,
			nTransaksi: 0
		});
	});

	it('toIndikator: konversi angka', () => {
		const rows: Row[] = [
			{ kawasan_id: 'mrt-x', n_usaha: 5, harga_median: 15000, pct_digital: 40.5, n_transaksi: 8 }
		];
		expect(toIndikator(rows, 'mrt-x').pctDigital).toBeCloseTo(40.5);
	});

	it('toBinHarga & toIdList & toKomposisiMetode', () => {
		expect(toBinHarga([{ bin_lo: 10000, n: 3 }])).toEqual([{ binLo: 10000, n: 3 }]);
		expect(toIdList([{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
		expect(toKomposisiMetode([{ metode_bayar: 'qris', n: 4, digital: true }])).toEqual([
			{ metode: 'qris', n: 4, digital: true }
		]);
	});

	it('toDetailUsaha: kosong -> null', () => {
		expect(toDetailUsaha([])).toBeNull();
	});

	it('toCompareRows: urutan mengikuti pilihan pengguna', () => {
		const rows: Row[] = [
			{ kawasan_id: 'b', nama: 'B', tipologi: 'sepi' },
			{ kawasan_id: 'a', nama: 'A', tipologi: 'potensi' }
		];
		const hasil = toCompareRows(rows, 'a', 'b');
		expect(hasil.map((r) => r.kawasan_id)).toEqual(['a', 'b']);
	});
});

describe('API tingkat tinggi memakai mock worker', () => {
	it('statsKawasan meneruskan SQL + params ke query()', async () => {
		await statsKawasan('mrt-blok-m');
		expect(mockQuery).toHaveBeenCalledOnce();
		const [sql, params] = mockQuery.mock.calls[0];
		expect(sql).toContain('FROM usaha');
		expect(params).toEqual(['mrt-blok-m']);
	});

	it('compareKawasan mengubah baris menjadi CompareRow terurut', async () => {
		mockQuery.mockResolvedValue([
			{ kawasan_id: 'tj-harmoni', nama: 'Harmoni', tipologi: 'potensi', n_usaha_800: 4 },
			{ kawasan_id: 'mrt-blok-m', nama: 'Blok M', tipologi: 'padat_friksi', n_usaha_800: 9 }
		]);
		const hasil = await compareKawasan('mrt-blok-m', 'tj-harmoni');
		expect(hasil.map((r) => r.nama)).toEqual(['Blok M', 'Harmoni']);
	});
});
