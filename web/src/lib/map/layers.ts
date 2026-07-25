/** Definisi layer & styling tipologi (blueprint 7.2).

Palet warna memakai skema Okabe-Ito (color-blind safe) — satu-satunya
konstanta warna tipologi/jenis di seluruh aplikasi.
*/

import type { DataDrivenPropertyValueSpecification, LayerSpecification } from 'maplibre-gl';
import type { JenisTempat, Moda, Tipologi } from '$lib/types';

export const SOURCE_ID = 'transitwarga';

export const TIPOLOGI_COLORS: Record<Tipologi, string> = {
	kuliner_matang: '#0072B2',
	padat_friksi: '#D55E00',
	potensi: '#009E73',
	prioritas_digital: '#CC79A7',
	sepi: '#999999'
};

export const TIPOLOGI_LABELS: Record<Tipologi, string> = {
	kuliner_matang: 'Kuliner matang',
	padat_friksi: 'Padat & friksi trotoar',
	potensi: 'Potensi berkembang',
	prioritas_digital: 'Prioritas digitalisasi',
	sepi: 'Sepi'
};

export const JENIS_COLORS: Record<JenisTempat, string> = {
	kaki_lima: '#E69F00',
	gerobak: '#D55E00',
	warung_tenda: '#009E73',
	kafe: '#CC79A7',
	restoran: '#0072B2',
	fast_food: '#56B4E9'
};

export const JENIS_LABELS: Record<JenisTempat, string> = {
	kaki_lima: 'Kaki lima',
	gerobak: 'Gerobak',
	warung_tenda: 'Warung tenda',
	kafe: 'Kafe',
	restoran: 'Restoran',
	fast_food: 'Fast food'
};

export const MODA_COLORS: Record<Moda, string> = {
	mrt: '#0072B2',
	krl: '#D55E00',
	tj: '#009E73',
	lrt: '#CC79A7'
};

export const MODA_LABELS: Record<Moda, string> = {
	mrt: 'MRT',
	krl: 'KRL',
	tj: 'TransJakarta',
	lrt: 'LRT'
};

/** Ekspresi match warna dari record warna (dipakai fill & circle). */
export function colorMatchExpression(
	attribute: string,
	colors: Record<string, string>,
	fallback = '#94a3b8'
): DataDrivenPropertyValueSpecification<string> {
	const pairs = Object.entries(colors).flat();
	return [
		'match',
		['get', attribute],
		...pairs,
		fallback
	] as unknown as DataDrivenPropertyValueSpecification<string>;
}

/** ID layer proyek, urut dari bawah (buffer) ke atas (titik + label). */
export const LAYER_IDS = {
	bufferFill: 'kawasan-buffer-fill',
	bufferLine: 'kawasan-buffer-line',
	highlightGlow: 'kawasan-highlight-glow',
	highlight: 'kawasan-highlight',
	usaha: 'usaha-icon',
	usahaLabel: 'usaha-label',
	transit: 'transit-circle',
	transitLabel: 'transit-label'
} as const;

/**
 * Font label — glyph di-self-host di static/fonts/. Bila style MAPID produksi
 * memakai nama font lain, cukup ganti konstanta ini (lihat docs/deployment.md).
 */
export const LABEL_FONT = ['Open Sans Semibold'];

/** Zoom minimal titik usaha tampil (selaras -Z tippecanoe di pipeline export). */
export const USAHA_MINZOOM = 10;

/** Grup layer untuk layer control. */
export const LAYER_GROUPS = {
	kawasan_buffer: [
		LAYER_IDS.bufferFill,
		LAYER_IDS.bufferLine,
		LAYER_IDS.highlightGlow,
		LAYER_IDS.highlight
	],
	usaha: [LAYER_IDS.usaha, LAYER_IDS.usahaLabel],
	transit: [LAYER_IDS.transit, LAYER_IDS.transitLabel]
} as const;

export type LayerGroup = keyof typeof LAYER_GROUPS;

export const LAYER_GROUP_LABELS: Record<LayerGroup, string> = {
	kawasan_buffer: 'Kawasan (buffer 400/800 m)',
	usaha: 'Titik usaha',
	transit: 'Stasiun & halte'
};

/** Definisi seluruh layer proyek; urutan array = urutan render (buffer di bawah). */
export function projectLayers(): LayerSpecification[] {
	return [
		{
			id: LAYER_IDS.bufferFill,
			type: 'fill',
			source: SOURCE_ID,
			'source-layer': 'kawasan_buffer',
			paint: {
				'fill-color': colorMatchExpression('tipologi', TIPOLOGI_COLORS),
				'fill-opacity': ['case', ['==', ['get', 'radius_m'], 400], 0.35, 0.15]
			}
		},
		{
			id: LAYER_IDS.bufferLine,
			type: 'line',
			source: SOURCE_ID,
			'source-layer': 'kawasan_buffer',
			paint: {
				'line-color': colorMatchExpression('tipologi', TIPOLOGI_COLORS),
				'line-width': 1,
				'line-opacity': 0.6
			}
		},
		// Glow lembut di bawah garis highlight (kesan fokus tanpa berlebihan)
		{
			id: LAYER_IDS.highlightGlow,
			type: 'line',
			source: SOURCE_ID,
			'source-layer': 'kawasan_buffer',
			filter: ['boolean', false],
			paint: {
				'line-color': '#2563eb',
				'line-width': 11,
				'line-blur': 8,
				'line-opacity': 0.45
			}
		},
		{
			id: LAYER_IDS.highlight,
			type: 'line',
			source: SOURCE_ID,
			'source-layer': 'kawasan_buffer',
			filter: ['boolean', false],
			paint: {
				'line-color': '#2563eb',
				'line-width': 2.5
			}
		},
		// Marker ikon per jenis usaha (pin canvas, lihat icons.ts).
		{
			id: LAYER_IDS.usaha,
			type: 'symbol',
			source: SOURCE_ID,
			'source-layer': 'usaha',
			minzoom: USAHA_MINZOOM,
			layout: {
				'icon-image': ['concat', 'jenis-', ['get', 'jenis_tempat']],
				'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.55, 13, 0.7, 15, 0.85, 17, 1],
				'icon-anchor': 'bottom',
				'icon-allow-overlap': true,
				'icon-ignore-placement': true
			}
		},
		{
			id: LAYER_IDS.transit,
			type: 'circle',
			source: SOURCE_ID,
			'source-layer': 'transit',
			paint: {
				'circle-color': colorMatchExpression('moda', MODA_COLORS),
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 5, 13, 9, 16, 12],
				'circle-stroke-color': '#ffffff',
				'circle-stroke-width': 2
			}
		},
		// Label nama usaha: muncul saat cukup dekat supaya tidak menumpuk.
		{
			id: LAYER_IDS.usahaLabel,
			type: 'symbol',
			source: SOURCE_ID,
			'source-layer': 'usaha',
			minzoom: 14,
			layout: {
				'text-field': ['get', 'nama'],
				'text-font': LABEL_FONT,
				'text-size': 11,
				'text-offset': [0, 0.4],
				'text-anchor': 'top',
				'text-max-width': 9
			},
			paint: {
				'text-color': '#1e293b',
				'text-halo-color': '#ffffff',
				'text-halo-width': 1.5
			}
		},
		// Label nama stasiun/halte: selalu terlihat sejak zoom kawasan.
		{
			id: LAYER_IDS.transitLabel,
			type: 'symbol',
			source: SOURCE_ID,
			'source-layer': 'transit',
			minzoom: 10,
			layout: {
				'text-field': ['get', 'nama'],
				'text-font': LABEL_FONT,
				'text-size': 12,
				'text-offset': [0, 1.2],
				'text-anchor': 'top',
				'text-max-width': 10
			},
			paint: {
				'text-color': colorMatchExpression('moda', MODA_COLORS),
				'text-halo-color': '#ffffff',
				'text-halo-width': 2
			}
		}
	];
}
