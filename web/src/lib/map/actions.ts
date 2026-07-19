/** Executor whitelist aksi peta dari AI (blueprint 7.3).

SATU-SATUNYA pintu eksekusi aksi AI. Setiap aksi dicek tipenya terhadap
whitelist, target dicek terhadap daftar kawasan dikenal, lalu dipetakan ke
store. Tanpa eval, tanpa {@html}; aksi tidak valid diabaikan diam-diam
(narasi tetap tampil).
*/

import { filters } from '$lib/stores/filters.svelte';
import { mapStore } from '$lib/stores/map.svelte';

export const AKSI_WHITELIST = ['highlight_kawasan', 'zoom_to', 'set_filter', 'compare'] as const;
export type AksiType = (typeof AKSI_WHITELIST)[number];

const FILTER_FIELDS = ['jenis_tempat', 'keramaian', 'moda'] as const;
type FilterField = (typeof FILTER_FIELDS)[number];

export interface AksiPeta {
	type: AksiType;
	target: string[];
	filter?: { field: FilterField; op: 'in'; value: string[] } | null;
}

/** Validasi struktur + target terhadap daftar kawasan dikenal (murni, teruji). */
export function validateAksi(raw: unknown, knownIds: ReadonlySet<string>): AksiPeta | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;
	if (!AKSI_WHITELIST.includes(obj.type as AksiType)) return null;
	if (!Array.isArray(obj.target) || obj.target.length === 0) return null;
	const target = obj.target.filter((t): t is string => typeof t === 'string');
	if (target.length !== obj.target.length) return null;
	if (!target.every((t) => knownIds.has(t))) return null;

	let filter: AksiPeta['filter'] = null;
	if (obj.filter !== undefined && obj.filter !== null) {
		const f = obj.filter as Record<string, unknown>;
		if (
			!FILTER_FIELDS.includes(f.field as FilterField) ||
			f.op !== 'in' ||
			!Array.isArray(f.value) ||
			!f.value.every((v) => typeof v === 'string')
		) {
			return null;
		}
		filter = { field: f.field as FilterField, op: 'in', value: f.value as string[] };
	}
	return { type: obj.type as AksiType, target, filter };
}

/** Petakan aksi tervalidasi ke store aplikasi. */
export function executeAksi(aksi: AksiPeta): void {
	switch (aksi.type) {
		case 'highlight_kawasan':
			mapStore.highlight = aksi.target;
			mapStore.zoomTarget = aksi.target; // pastikan kawasan tersorot terlihat
			break;
		case 'zoom_to':
			mapStore.zoomTarget = aksi.target;
			break;
		case 'set_filter':
			if (aksi.filter) {
				if (aksi.filter.field === 'jenis_tempat') filters.jenisTempat = aksi.filter.value;
				else if (aksi.filter.field === 'keramaian') filters.keramaian = aksi.filter.value;
				else filters.moda = aksi.filter.value;
			}
			mapStore.highlight = aksi.target;
			break;
		case 'compare':
			mapStore.highlight = aksi.target;
			mapStore.zoomTarget = aksi.target;
			mapStore.compareTarget = aksi.target.slice(0, 2) as [string, string];
			break;
	}
}

/** Validasi lalu eksekusi; kembalikan true bila aksi dijalankan. */
export function handleAksiPeta(raw: unknown, knownIds: ReadonlySet<string>): boolean {
	const aksi = validateAksi(raw, knownIds);
	if (!aksi) {
		console.warn('aksi peta AI diabaikan (tidak valid):', raw);
		return false;
	}
	executeAksi(aksi);
	return true;
}
