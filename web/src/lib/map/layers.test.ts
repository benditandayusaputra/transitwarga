import { describe, expect, it } from 'vitest';
import {
	colorMatchExpression,
	JENIS_COLORS,
	JENIS_LABELS,
	LAYER_GROUPS,
	projectLayers,
	TIPOLOGI_COLORS,
	TIPOLOGI_LABELS
} from './layers';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('palet tipologi', () => {
	it('kelima tipologi punya warna hex valid dan label', () => {
		const tipologi = ['kuliner_matang', 'padat_friksi', 'potensi', 'prioritas_digital', 'sepi'];
		for (const t of tipologi) {
			expect(TIPOLOGI_COLORS[t as keyof typeof TIPOLOGI_COLORS]).toMatch(HEX);
			expect(TIPOLOGI_LABELS[t as keyof typeof TIPOLOGI_LABELS]).toBeTruthy();
		}
	});

	it('warna tipologi unik satu sama lain', () => {
		const values = Object.values(TIPOLOGI_COLORS);
		expect(new Set(values).size).toBe(values.length);
	});

	it('keenam jenis tempat punya warna dan label', () => {
		expect(Object.keys(JENIS_COLORS)).toHaveLength(6);
		expect(Object.keys(JENIS_LABELS)).toHaveLength(6);
	});
});

describe('colorMatchExpression', () => {
	it('membangun ekspresi match tipologi -> warna', () => {
		const expr = colorMatchExpression('tipologi', { sepi: '#999999' }, '#000000') as unknown[];
		expect(expr).toEqual(['match', ['get', 'tipologi'], 'sepi', '#999999', '#000000']);
	});
});

describe('projectLayers', () => {
	it('urutan layer: buffer di bawah, titik di atas', () => {
		const ids = projectLayers().map((l) => l.id);
		expect(ids.indexOf('kawasan-buffer-fill')).toBeLessThan(ids.indexOf('usaha-icon'));
		expect(ids.indexOf('usaha-icon')).toBeLessThan(ids.indexOf('transit-circle'));
	});

	it('semua layer di LAYER_GROUPS ada di definisi', () => {
		const ids = new Set(projectLayers().map((l) => l.id));
		for (const group of Object.values(LAYER_GROUPS)) {
			for (const id of group) expect(ids.has(id)).toBe(true);
		}
	});
});
