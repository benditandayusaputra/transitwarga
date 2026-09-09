/** Store peta (runes): viewport, kawasan aktif, highlight, visibilitas layer. */

import { basemapAwal, INITIAL_VIEW, type BasemapPilihan } from '$lib/map/initMap';
import type { LayerGroup } from '$lib/map/layers';
import type { UsahaRow } from '$lib/types';

export interface Viewport {
	center: [number, number];
	zoom: number;
}

/** Target hasil pencarian lokasi: peta terbang ke sini lalu (opsional) buka popup. */
export interface SearchTarget {
	lnglat: [number, number];
	zoom: number;
	usaha?: UsahaRow;
}

export interface SurveyTarget {
	lnglat: [number, number];
	zoom: number;
	activityId?: string;
}

class MapStore {
	viewport = $state<Viewport>({ center: INITIAL_VIEW.center, zoom: INITIAL_VIEW.zoom });
	kawasanAktif = $state<string | null>(null);
	/** Daftar kawasan_id yang di-highlight (mis. oleh aksi peta AI). */
	highlight = $state<string[]>([]);
	/** Permintaan zoom programatik (dikonsumsi MapView lalu di-null-kan). */
	zoomTarget = $state<string[] | null>(null);
	/** Dua kawasan yang diminta AI untuk dibandingkan (aksi compare). */
	compareTarget = $state<[string, string] | null>(null);
	/** Basemap aktif (ganti realtime tanpa reload; layer proyek dipasang ulang). */
	basemap = $state<BasemapPilihan>(basemapAwal());
	/** Target pencarian lokasi (dikonsumsi MapView lalu di-null-kan). */
	searchTarget = $state<SearchTarget | null>(null);
	/** Target titik survey (dikonsumsi MapView lalu di-null-kan). */
	surveyTarget = $state<SurveyTarget | null>(null);
	layerVisibility = $state<Record<LayerGroup, boolean>>({
		kawasan_buffer: true,
		usaha: true,
		transit: true,
		survey: true
	});
	/** Baris usaha pada kawasan terpilih (untuk tabel atribut). */
	usahaTerpilih = $state<UsahaRow[]>([]);
	/** True bila detail kawasan ditampilkan sebagai dialog penuh (bukan panel pojok). */
	detailPenuh = $state(false);

	pilihKawasan(id: string | null) {
		this.kawasanAktif = id;
		if (id === null) {
			this.usahaTerpilih = [];
			this.detailPenuh = false;
		}
	}

	toggleLayer(group: LayerGroup) {
		this.layerVisibility[group] = !this.layerVisibility[group];
	}

	reset() {
		this.kawasanAktif = null;
		this.highlight = [];
		this.zoomTarget = null;
		this.usahaTerpilih = [];
	}
}

export const mapStore = new MapStore();
