import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { env } from '$env/dynamic/public';
import { SOURCE_ID, projectLayers } from './layers';
import {
	DEFAULT_MAPID_KEY,
	fetchMapidActivities,
	activitiesToGeoJson
} from '$lib/data/mapidActivities';

/**
 * Konfigurasi basemap dipusatkan di sini (blueprint bag. 11): seluruh style
 * berasal dari MAPID MAPS (basemap.mapid.io) memakai key tim yang sama dengan
 * API Activities. Ganti key cukup lewat env PUBLIC_MAPID_API_KEY.
 *
 * Glyph font untuk label layer proyek di-self-host (static/fonts) supaya label
 * tetap jalan offline dan lolos CSP 'self'.
 */
function glyphsUrl(): string {
	return `${location.origin}/fonts/{fontstack}/{range}.pbf`;
}

/** Pengidentifikasi style resmi MAPID MAPS (lihat katalog basemap panitia). */
export type BasemapPilihan = 'basic' | 'street-2d-building' | 'satellite' | 'dark' | 'light';

export const BASEMAP_LABELS: Record<BasemapPilihan, string> = {
	basic: 'Street',
	'street-2d-building': 'Street 2D',
	satellite: 'Satelit',
	dark: 'Gelap',
	light: 'Terang'
};

export function daftarBasemap(): BasemapPilihan[] {
	return ['basic', 'street-2d-building', 'satellite', 'dark', 'light'];
}

export function basemapAwal(): BasemapPilihan {
	return 'basic';
}

export function basemapStyleFor(pilihan: BasemapPilihan): string {
	const key = env.PUBLIC_MAPID_API_KEY || DEFAULT_MAPID_KEY;
	return `https://basemap.mapid.io/styles/${pilihan}/style.json?key=${key}`;
}

/**
 * Style fallback lokal (tanpa request eksternal sama sekali): dipakai otomatis
 * bila style basemap URL gagal dimuat supaya layer proyek tetap tampil.
 */
export function fallbackStyle(): StyleSpecification {
	return {
		version: 8,
		name: 'transitwarga-fallback',
		glyphs: glyphsUrl(),
		sources: {},
		layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8ecef' } }]
	};
}

let pmtilesRegistered = false;

/** Registrasi protokol pmtiles:// (sekali per sesi). */
export function registerPmtilesProtocol(): void {
	if (pmtilesRegistered) return;
	const protocol = new Protocol();
	maplibregl.addProtocol('pmtiles', protocol.tile);
	pmtilesRegistered = true;
}

/** URL arsip tiles proyek; dilayani dari static hosting via HTTP range request. */
export function tilesUrl(): string {
	return `pmtiles://${location.origin}/data/tiles.pmtiles`;
}

let pmtilesCheckPromise: Promise<boolean> | null = null;

export function checkPmtilesAvailable(): Promise<boolean> {
	if (!pmtilesCheckPromise) {
		pmtilesCheckPromise = fetch('/data/tiles.pmtiles', { method: 'HEAD' })
			.then((res) => res.ok)
			.catch(() => false);
	}
	return pmtilesCheckPromise;
}

/** Tambah source PMTiles / GeoJSON fallback + seluruh layer proyek (dipanggil setelah event load). */
export async function addProjectLayers(map: maplibregl.Map): Promise<void> {
	if (map.getSource(SOURCE_ID) || map.getSource('usaha')) return;

	// Daftarkan source kegiatan/survei lapangan MAPID (#Devunder)
	if (!map.getSource('mapid_activities')) {
		try {
			const activities = await fetchMapidActivities();
			const geojson = activitiesToGeoJson(activities);
			if (!map.getSource('mapid_activities')) {
				map.addSource('mapid_activities', { type: 'geojson', data: geojson });
			}
		} catch (err) {
			console.warn('Gagal memuat source mapid_activities:', err);
			if (!map.getSource('mapid_activities')) {
				map.addSource('mapid_activities', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				});
			}
		}
	}

	// Cek apakah tiles.pmtiles tersedia di server/static (cached)
	const adaPmtiles = await checkPmtilesAvailable();

	if (adaPmtiles) {
		map.addSource(SOURCE_ID, { type: 'vector', url: tilesUrl() });
		for (const layer of projectLayers('vector')) {
			map.addLayer(layer);
		}
	} else {
		// Fallback ke GeoJSON lokal yang sudah tersedia di static/data/
		map.addSource('kawasan_buffer', { type: 'geojson', data: '/data/kawasan_buffer.geojson' });
		map.addSource('transit', { type: 'geojson', data: '/data/transit.geojson' });
		map.addSource('usaha', { type: 'geojson', data: '/data/usaha.geojson' });

		for (const layer of projectLayers('geojson')) {
			map.addLayer(layer);
		}
	}
}

/** Pusat peta awal: koridor MRT Jakarta. */
export const INITIAL_VIEW = {
	center: [106.8074, -6.2295] as [number, number],
	zoom: 11.5
};

export function createMap(container: HTMLElement): maplibregl.Map {
	registerPmtilesProtocol();
	const map = new maplibregl.Map({
		container,
		style: basemapStyleFor(basemapAwal()),
		center: INITIAL_VIEW.center,
		zoom: INITIAL_VIEW.zoom,
		attributionControl: { compact: false }
	});
	map.addControl(new maplibregl.NavigationControl(), 'top-right');
	map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

	// Bila style basemap URL (mis. MAPID) gagal dimuat sebelum peta siap, ganti
	// ke style lokal agar event load tetap terjadi dan layer proyek tampil.
	let fallbackDipakai = false;
	map.on('error', (e) => {
		if (fallbackDipakai || map.isStyleLoaded()) return;
		const pesan = String((e as { error?: Error }).error?.message ?? '');
		if (/style|fetch|AJAX|network/i.test(pesan)) {
			fallbackDipakai = true;
			console.warn('Basemap gagal dimuat, memakai style fallback lokal:', pesan);
			// diff:false — style awal belum selesai dimuat, diffing pasti gagal
			map.setStyle(fallbackStyle(), { diff: false });
		}
	});
	return map;
}
