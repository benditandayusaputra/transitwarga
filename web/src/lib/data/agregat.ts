/** Loader agregat.json (statistik pra-hitung per kawasan + data_version). */

import type { AgregatKawasan, AgregatPayload } from '$lib/types';

let cache: AgregatPayload | null = null;

export async function loadAgregat(): Promise<AgregatPayload> {
	if (cache) return cache;
	const res = await fetch('/data/agregat.json');
	if (!res.ok) throw new Error(`gagal memuat agregat.json: ${res.status}`);
	cache = (await res.json()) as AgregatPayload;
	return cache;
}

export function findKawasan(
	payload: AgregatPayload,
	kawasanId: string
): AgregatKawasan | undefined {
	return payload.kawasan.find((k) => k.kawasan_id === kawasanId);
}
