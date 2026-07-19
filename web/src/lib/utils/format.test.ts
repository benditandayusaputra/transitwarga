import { describe, expect, it } from 'vitest';
import { formatAngka, formatPersen, formatRupiah, formatSkor } from './format';

describe('formatRupiah', () => {
	it('memformat ribuan dengan titik gaya Indonesia', () => {
		expect(formatRupiah(15000)).toBe('Rp 15.000');
	});

	it('tanpa desimal', () => {
		expect(formatRupiah(12500.75)).toBe('Rp 12.501');
	});

	it('nol', () => {
		expect(formatRupiah(0)).toBe('Rp 0');
	});
});

describe('formatAngka', () => {
	it('pemisah ribuan', () => {
		expect(formatAngka(1234567)).toBe('1.234.567');
	});
});

describe('formatSkor', () => {
	it('membulatkan skor', () => {
		expect(formatSkor(73.4)).toBe('73');
		expect(formatSkor(73.6)).toBe('74');
	});
});

describe('formatPersen', () => {
	it('menambah tanda persen', () => {
		expect(formatPersen(30)).toBe('30%');
		expect(formatPersen(29.6)).toBe('30%');
	});
});
