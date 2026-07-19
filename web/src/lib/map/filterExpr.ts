/** Konversi state filter -> MapLibre filter expression (murni, teruji Vitest).

Filter diterapkan sebagai expression di layer, bukan reload data (blueprint 7.3).
*/

import type { FilterSpecification } from 'maplibre-gl';

export interface UsahaFilterState {
	jenisTempat: string[];
	keramaian: string[];
}

type Expr = unknown[];

function inClause(attribute: string, values: string[]): Expr {
	return ['in', ['get', attribute], ['literal', values]];
}

/** null = tanpa filter (semua tampil). */
export function usahaFilterExpression(state: UsahaFilterState): FilterSpecification | null {
	const clauses: Expr[] = [];
	if (state.jenisTempat.length > 0) clauses.push(inClause('jenis_tempat', state.jenisTempat));
	if (state.keramaian.length > 0) clauses.push(inClause('keramaian', state.keramaian));
	if (clauses.length === 0) return null;
	if (clauses.length === 1) return clauses[0] as FilterSpecification;
	return ['all', ...clauses] as FilterSpecification;
}

/** Filter moda untuk layer transit dan kawasan_buffer. */
export function modaFilterExpression(moda: string[]): FilterSpecification | null {
	if (moda.length === 0) return null;
	return inClause('moda', moda) as FilterSpecification;
}

/**
 * Filter layer highlight: kawasan di daftar `ids` (ring 800 m saja supaya
 * garis tidak dobel). Daftar kosong -> tidak ada yang di-highlight.
 */
export function highlightFilterExpression(ids: string[]): FilterSpecification {
	if (ids.length === 0) return ['boolean', false] as unknown as FilterSpecification;
	return [
		'all',
		['==', ['get', 'radius_m'], 800],
		inClause('kawasan_id', ids)
	] as unknown as FilterSpecification;
}

/**
 * Filter whitelist id hasil filter numerik DuckDB. null = tidak aktif.
 * Daftar kosong menghasilkan filter yang menyembunyikan semua titik (benar:
 * tidak ada usaha yang lolos kriteria).
 */
export function idFilterExpression(ids: string[] | null): FilterSpecification | null {
	if (ids === null) return null;
	return inClause('id', ids) as FilterSpecification;
}

/** Gabungkan filter dasar layer dengan filter moda (untuk kawasan_buffer + filter radius). */
export function combineFilters(
	...filters: (FilterSpecification | null)[]
): FilterSpecification | null {
	const active = filters.filter((f): f is FilterSpecification => f !== null);
	if (active.length === 0) return null;
	if (active.length === 1) return active[0];
	return ['all', ...active] as unknown as FilterSpecification;
}
