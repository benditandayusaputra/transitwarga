import { describe, expect, it } from 'vitest';
import { validateAksi } from './actions';

const KNOWN = new Set(['mrt-blok-m', 'tj-harmoni']);

describe('validateAksi (whitelist executor)', () => {
	it('aksi valid lolos', () => {
		const aksi = { type: 'highlight_kawasan', target: ['mrt-blok-m'] };
		expect(validateAksi(aksi, KNOWN)).toEqual({
			type: 'highlight_kawasan',
			target: ['mrt-blok-m'],
			filter: null
		});
	});

	it('tipe di luar whitelist ditolak', () => {
		expect(validateAksi({ type: 'eval', target: ['mrt-blok-m'] }, KNOWN)).toBeNull();
		expect(validateAksi({ type: 'navigate', target: ['mrt-blok-m'] }, KNOWN)).toBeNull();
	});

	it('target tidak dikenal ditolak', () => {
		expect(validateAksi({ type: 'zoom_to', target: ['kawasan-asing'] }, KNOWN)).toBeNull();
		expect(validateAksi({ type: 'zoom_to', target: ['mrt-blok-m', 'asing'] }, KNOWN)).toBeNull();
	});

	it('target kosong / bukan array ditolak', () => {
		expect(validateAksi({ type: 'zoom_to', target: [] }, KNOWN)).toBeNull();
		expect(validateAksi({ type: 'zoom_to', target: 'mrt-blok-m' }, KNOWN)).toBeNull();
		expect(validateAksi(null, KNOWN)).toBeNull();
		expect(validateAksi('highlight', KNOWN)).toBeNull();
	});

	it('filter valid ikut lolos; field asing ditolak', () => {
		const valid = {
			type: 'set_filter',
			target: ['mrt-blok-m'],
			filter: { field: 'jenis_tempat', op: 'in', value: ['kaki_lima'] }
		};
		expect(validateAksi(valid, KNOWN)?.filter?.value).toEqual(['kaki_lima']);

		const fieldAsing = {
			type: 'set_filter',
			target: ['mrt-blok-m'],
			filter: { field: 'password', op: 'in', value: ['x'] }
		};
		expect(validateAksi(fieldAsing, KNOWN)).toBeNull();
	});
});
