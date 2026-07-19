/** Klien GET /api/summary/:kawasanId (blueprint 6.2). */

import { apiBase } from './api';

export interface SummaryData {
	kawasan_id: string;
	data_version: string;
	narasi: string;
	indikator: {
		n_usaha: number;
		harga_median: number;
		pct_digital: number;
		tipologi: string;
	};
}

export class SummaryError extends Error {
	constructor(
		public code: string,
		message: string
	) {
		super(message);
	}
}

export async function fetchSummary(kawasanId: string): Promise<SummaryData> {
	const res = await fetch(`${apiBase()}/api/summary/${encodeURIComponent(kawasanId)}`);
	if (!res.ok) {
		const body = (await res.json().catch(() => null)) as {
			error?: { code?: string; message?: string };
		} | null;
		throw new SummaryError(
			body?.error?.code ?? `HTTP_${res.status}`,
			body?.error?.message ?? 'Ringkasan tidak dapat dimuat'
		);
	}
	return (await res.json()) as SummaryData;
}
