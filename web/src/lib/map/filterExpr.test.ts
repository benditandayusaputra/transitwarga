import { describe, expect, it } from 'vitest';
import {
	combineFilters,
	highlightFilterExpression,
	modaFilterExpression,
	surveyFilterExpression,
	usahaFilterExpression
} from './filterExpr';

describe('usahaFilterExpression', () => {
	it('tanpa filter -> null (semua tampil)', () => {
		expect(usahaFilterExpression({ jenisTempat: [], keramaian: [] })).toBeNull();
	});

	it('satu dimensi -> klausa in tunggal', () => {
		const expr = usahaFilterExpression({ jenisTempat: ['kaki_lima'], keramaian: [] });
		expect(expr).toEqual(['in', ['get', 'jenis_tempat'], ['literal', ['kaki_lima']]]);
	});

	it('dua dimensi -> digabung all', () => {
		const expr = usahaFilterExpression({
			jenisTempat: ['kaki_lima', 'gerobak'],
			keramaian: ['ramai']
		});
		expect(expr).toEqual([
			'all',
			['in', ['get', 'jenis_tempat'], ['literal', ['kaki_lima', 'gerobak']]],
			['in', ['get', 'keramaian'], ['literal', ['ramai']]]
		]);
	});
});

describe('surveyFilterExpression', () => {
	it('tanpa filter -> null', () => {
		expect(surveyFilterExpression({ surveyTopik: [], surveyor: [] })).toBeNull();
	});

	it('filter satu topik -> klausa == topik', () => {
		const expr = surveyFilterExpression({ surveyTopik: ['pkl'], surveyor: [] });
		expect(expr).toEqual(['==', ['get', 'topik_pkl'], true]);
	});

	it('filter multi topik -> klausa any', () => {
		const expr = surveyFilterExpression({ surveyTopik: ['pkl', 'trotoar'], surveyor: [] });
		expect(expr).toEqual([
			'any',
			['==', ['get', 'topik_pkl'], true],
			['==', ['get', 'topik_trotoar'], true]
		]);
	});

	it('filter topik dan surveyor -> digabung all', () => {
		const expr = surveyFilterExpression({ surveyTopik: ['pkl'], surveyor: ['nurhadi17'] });
		expect(expr).toEqual([
			'all',
			['==', ['get', 'topik_pkl'], true],
			['in', ['get', 'user_name'], ['literal', ['nurhadi17']]]
		]);
	});
});

describe('modaFilterExpression', () => {
	it('kosong -> null', () => {
		expect(modaFilterExpression([])).toBeNull();
	});

	it('berisi -> klausa in moda', () => {
		expect(modaFilterExpression(['mrt'])).toEqual(['in', ['get', 'moda'], ['literal', ['mrt']]]);
	});
});

describe('highlightFilterExpression', () => {
	it('kosong -> ekspresi false (tidak ada highlight)', () => {
		expect(highlightFilterExpression([])).toEqual(['boolean', false]);
	});

	it('berisi -> ring 800 saja + daftar id', () => {
		expect(highlightFilterExpression(['mrt-blok-m'])).toEqual([
			'all',
			['==', ['get', 'radius_m'], 800],
			['in', ['get', 'kawasan_id'], ['literal', ['mrt-blok-m']]]
		]);
	});
});

describe('combineFilters', () => {
	it('semua null -> null', () => {
		expect(combineFilters(null, null)).toBeNull();
	});

	it('satu aktif -> dikembalikan apa adanya', () => {
		const f = modaFilterExpression(['tj']);
		expect(combineFilters(null, f)).toEqual(f);
	});

	it('dua aktif -> all', () => {
		const a = modaFilterExpression(['tj']);
		const b = highlightFilterExpression(['tj-harmoni']);
		expect(combineFilters(a, b)).toEqual(['all', a, b]);
	});
});
