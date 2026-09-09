/**
 * Layanan integrasi MAPID Activities API (#Devunder).
 *
 * Mengambil data observasi & survei lapangan dari MAPID Apps dengan filter poligon
 * Jabodetabek dan tagar #Devunder. Dilengkapi fallback otomatis ke cache statis lokal
 * (/data/survey_activities.json) jika offline atau gagal koneksi.
 */

import { env } from '$env/dynamic/public';

export interface MapidUserProfilePic {
	name?: string;
	url?: string;
	name_compressed?: string;
	url_compressed?: string;
}

export interface MapidActivity {
	_id: string;
	title: string;
	description: string;
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lon, lat]
	};
	medias: string[];
	total_comment?: number;
	created_at: string;
	likes?: Array<{
		_id: string;
		user_name: string;
		full_name?: string;
		profile_picture?: unknown;
		created_at?: string;
	}>;
	user_name: string;
	user_full_name: string;
	user_profile_picture?: string | MapidUserProfilePic;
	community_name?: string;
	community_picture?: string;
	community_description?: string;
}

export interface MapidActivitiesResponse {
	success: boolean;
	message: string;
	data: {
		activities: MapidActivity[];
	};
	meta?: {
		total: number;
		filters?: Record<string, unknown>;
	};
}

export const DEFAULT_MAPID_KEY = '6a919d9453df37905b3a5d49';

/** Poligon cakupan area Jabodetabek (sesuai koridor transit & batas wajar koordinat). */
export const DEFAULT_JABODETABEK_POLYGON = [
	[
		[106.3, -7.0],
		[107.3, -7.0],
		[107.3, -5.9],
		[106.3, -5.9],
		[106.3, -7.0]
	]
];

export function getUserAvatar(pic?: string | MapidUserProfilePic | unknown): string {
	if (!pic) return '';
	if (typeof pic === 'string') return pic;
	if (typeof pic === 'object' && pic !== null) {
		const obj = pic as MapidUserProfilePic;
		return obj.url_compressed || obj.url || '';
	}
	return '';
}

let cachedActivities: MapidActivity[] | null = null;
let activeFetchPromise: Promise<MapidActivity[]> | null = null;

export interface FetchActivitiesOptions {
	apiKey?: string;
	hashtag?: string[];
	polygon?: number[][][];
	startDate?: string;
	endDate?: string;
	forceRefresh?: boolean;
}

/**
 * Mengambil daftar aktivitas lapangan MAPID (#Devunder).
 * Otomatis fallback ke data statis lokal bila request jaringan gagal.
 */
export async function fetchMapidActivities(
	options: FetchActivitiesOptions = {}
): Promise<MapidActivity[]> {
	if (!options.forceRefresh && cachedActivities) {
		return cachedActivities;
	}

	if (!options.forceRefresh && activeFetchPromise) {
		return activeFetchPromise;
	}

	const apiKey = options.apiKey || env.PUBLIC_MAPID_API_KEY || DEFAULT_MAPID_KEY;
	const hashtag = options.hashtag ?? ['Devunder'];
	const polygon = options.polygon ?? DEFAULT_JABODETABEK_POLYGON;
	const startDate = options.startDate ?? '2024-01-01';
	const endDate = options.endDate ?? '2026-12-31';

	activeFetchPromise = (async () => {
		try {
			const res = await fetch('https://server.mapid.io/web/competition/activities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey
				},
				body: JSON.stringify({
					feature: {
						type: 'Polygon',
						coordinates: polygon
					},
					start_date: startDate,
					end_date: endDate,
					hashtag
				})
			});

			if (!res.ok) {
				throw new Error(`MAPID API error: ${res.status} ${res.statusText}`);
			}

			const json = (await res.json()) as MapidActivitiesResponse;
			if (json.success && Array.isArray(json.data?.activities)) {
				cachedActivities = json.data.activities;
				return cachedActivities;
			}
			throw new Error(json.message || 'Respon API tidak valid');
		} catch (err) {
			console.warn('Gagal memuat data dari MAPID API langsung, beralih ke cache lokal:', err);
			try {
				const fallbackRes = await fetch('/data/survey_activities.json');
				if (fallbackRes.ok) {
					const fallbackJson = (await fallbackRes.json()) as MapidActivitiesResponse;
					if (Array.isArray(fallbackJson.data?.activities)) {
						cachedActivities = fallbackJson.data.activities;
						return cachedActivities;
					}
				}
			} catch (fallbackErr) {
				console.error('Fallback survey_activities.json juga gagal:', fallbackErr);
			}
			return cachedActivities ?? [];
		} finally {
			activeFetchPromise = null;
		}
	})();

	return activeFetchPromise;
}

export interface ActivityGeoJsonFeature {
	type: 'Feature';
	id: string;
	properties: {
		id: string;
		title: string;
		description: string;
		user_name: string;
		user_full_name: string;
		avatar: string;
		created_at: string;
		medias_count: number;
		first_media: string;
		medias_json: string;
	};
	geometry: {
		type: 'Point';
		coordinates: [number, number];
	};
}

export interface ActivityGeoJsonCollection {
	type: 'FeatureCollection';
	features: ActivityGeoJsonFeature[];
}

/**
 * Konversi list MapidActivity menjadi GeoJSON FeatureCollection
 * untuk dikonsumsi MapLibre GL.
 */
export function activitiesToGeoJson(
	activities: MapidActivity[]
): ActivityGeoJsonCollection {
	return {
		type: 'FeatureCollection',
		features: activities.map((act) => ({
			type: 'Feature',
			id: act._id,
			properties: {
				id: act._id,
				title: act.title,
				description: act.description,
				user_name: act.user_name,
				user_full_name: act.user_full_name,
				avatar: getUserAvatar(act.user_profile_picture),
				created_at: act.created_at,
				medias_count: (act.medias || []).length,
				first_media: act.medias?.[0] || '',
				medias_json: JSON.stringify(act.medias || [])
			},
			geometry: {
				type: 'Point',
				coordinates: act.geometry.coordinates
			}
		}))
	};
}
