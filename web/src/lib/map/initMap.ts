import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { env } from '$env/dynamic/public';
import { SOURCE_ID, projectLayers } from './layers';

/**
 * Konfigurasi basemap diisolasi di sini (blueprint bag. 11): ganti style MAPID MAPS
 * cukup lewat env PUBLIC_BASEMAP_STYLE_URL tanpa menyentuh kode lain.
 *
 * Glyph font untuk label di-self-host (static/fonts) supaya label tetap jalan
 * offline dan lolos CSP 'self'.
 */
function glyphsUrl(): string {
	return `${location.origin}/fonts/{fontstack}/{range}.pbf`;
}

/**
 * Basemap default dev/demo (sebelum style MAPID dipasang): raster OpenStreetMap —
 * detail penuh sampai level jalan. Produksi memakai MAPID via env.
 */
export function localDefaultStyle(): StyleSpecification {
	return {
		version: 8,
		name: 'transitwarga-osm',
		glyphs: glyphsUrl(),
		sources: {
			osm: {
				type: 'raster',
				tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
				tileSize: 256,
				maxzoom: 19,
				attribution: '© OpenStreetMap contributors'
			}
		},
		layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
	};
}

/** Basemap citra satelit (Esri World Imagery, gratis dengan atribusi). */
export function satelliteStyle(): StyleSpecification {
	return {
		version: 8,
		name: 'transitwarga-satelit',
		glyphs: glyphsUrl(),
		sources: {
			esri: {
				type: 'raster',
				tiles: [
					'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
				],
				tileSize: 256,
				maxzoom: 19,
				attribution: 'Esri, Maxar, Earthstar Geographics'
			}
		},
		layers: [{ id: 'esri', type: 'raster', source: 'esri' }]
	};
}

export type BasemapPilihan = 'jalan' | 'satelit' | 'mapid';

/** Daftar basemap yang tersedia (mapid hanya bila env style URL di-set). */
export function daftarBasemap(): BasemapPilihan[] {
	return env.PUBLIC_BASEMAP_STYLE_URL ? ['mapid', 'jalan', 'satelit'] : ['jalan', 'satelit'];
}

export function basemapAwal(): BasemapPilihan {
	return env.PUBLIC_BASEMAP_STYLE_URL ? 'mapid' : 'jalan';
}

export function basemapStyleFor(pilihan: BasemapPilihan): string | StyleSpecification {
	if (pilihan === 'mapid' && env.PUBLIC_BASEMAP_STYLE_URL) return env.PUBLIC_BASEMAP_STYLE_URL;
	if (pilihan === 'satelit') return satelliteStyle();
	return localDefaultStyle();
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

/** Tambah source PMTiles + seluruh layer proyek (dipanggil setelah event load). */
export function addProjectLayers(map: maplibregl.Map): void {
	if (map.getSource(SOURCE_ID)) return;
	map.addSource(SOURCE_ID, { type: 'vector', url: tilesUrl() });
	for (const layer of projectLayers()) {
		map.addLayer(layer);
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
