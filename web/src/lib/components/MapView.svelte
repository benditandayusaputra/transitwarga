<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibregl from 'maplibre-gl';
	import { mount, onMount, unmount } from 'svelte';
	import { addProjectLayers, basemapStyleFor, createMap } from '$lib/map/initMap';
	import { ensureMapIcons } from '$lib/map/icons';
	import { LAYER_GROUPS, LAYER_IDS, SOURCE_ID } from '$lib/map/layers';
	import {
		combineFilters,
		highlightFilterExpression,
		idFilterExpression,
		modaFilterExpression,
		surveyFilterExpression,
		usahaFilterExpression
	} from '$lib/map/filterExpr';
	import { filters } from '$lib/stores/filters.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import { loadAgregat } from '$lib/data/agregat';
	import type { AgregatKawasan, UsahaRow } from '$lib/types';
	import UsahaPopup from './UsahaPopup.svelte';
	import SurveyPopup from './SurveyPopup.svelte';
	import { sortMediasPhotosFirst } from '$lib/data/mapidActivities';

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = $state.raw(null);
	let layersReady = $state(false);
	let daftarKawasan: AgregatKawasan[] = [];

	function toUsahaRow(props: Record<string, unknown>): UsahaRow | null {
		if (typeof props.id !== 'string') return null;
		return {
			id: props.id,
			nama: String(props.nama ?? ''),
			jenis_tempat: props.jenis_tempat as UsahaRow['jenis_tempat'],
			harga_rata: Number(props.harga_rata ?? 0),
			keramaian: props.keramaian as UsahaRow['keramaian'],
			kawasan_id: String(props.kawasan_id ?? '')
		};
	}

	/** Baris usaha kawasan terpilih dari tile yang sudah termuat (dedup antar zoom). */
	function extractUsahaRows(m: maplibregl.Map, kawasanId: string): UsahaRow[] {
		const feats = m.querySourceFeatures(SOURCE_ID, {
			sourceLayer: 'usaha',
			filter: ['==', ['get', 'kawasan_id'], kawasanId]
		});
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- set lokal, bukan state reaktif
		const seen = new Set<string>();
		const rows: UsahaRow[] = [];
		for (const f of feats) {
			const row = toUsahaRow(f.properties ?? {});
			if (!row || seen.has(row.id)) continue;
			seen.add(row.id);
			rows.push(row);
		}
		return rows.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
	}

	function showUsahaPopup(m: maplibregl.Map, lngLat: maplibregl.LngLatLike, usaha: UsahaRow) {
		const el = document.createElement('div');
		const comp = mount(UsahaPopup, { target: el, props: { usaha } });
		const popup = new maplibregl.Popup({ maxWidth: '320px', offset: 10 })
			.setLngLat(lngLat)
			.setDOMContent(el)
			.addTo(m);
		popup.on('close', () => unmount(comp));
	}

	function showSurveyPopup(m: maplibregl.Map, lngLat: maplibregl.LngLatLike, props: Record<string, unknown>) {
		const el = document.createElement('div');
		let medias: string[] = [];
		try {
			if (typeof props.medias_json === 'string') {
				medias = JSON.parse(props.medias_json);
			} else if (Array.isArray(props.medias)) {
				medias = props.medias as string[];
			}
		} catch {
			medias = [];
		}
		medias = sortMediasPhotosFirst(medias);

		const comp = mount(SurveyPopup, {
			target: el,
			props: {
				title: String(props.title ?? 'Observasi Lapangan'),
				description: String(props.description ?? ''),
				userName: String(props.user_name ?? ''),
				userFullName: String(props.user_full_name ?? ''),
				avatar: String(props.avatar ?? ''),
				createdAt: String(props.created_at ?? ''),
				medias
			}
		});
		const popup = new maplibregl.Popup({ maxWidth: '340px', offset: 10 })
			.setLngLat(lngLat)
			.setDOMContent(el)
			.addTo(m);
		popup.on('close', () => unmount(comp));
	}

	function handleClick(m: maplibregl.Map, e: maplibregl.MapMouseEvent) {
		const checkLayers = [
			LAYER_IDS.survey,
			LAYER_IDS.surveyLabel,
			LAYER_IDS.usaha,
			LAYER_IDS.usahaLabel,
			LAYER_IDS.transit,
			LAYER_IDS.transitLabel,
			LAYER_IDS.bufferFill,
			LAYER_IDS.bufferLine
		].filter((id) => m.getLayer(id));

		const feats = m.queryRenderedFeatures(e.point, { layers: checkLayers });

		const surveyFeat = feats.find(
			(f) => f.layer.id === LAYER_IDS.survey || f.layer.id === LAYER_IDS.surveyLabel
		);
		if (surveyFeat) {
			showSurveyPopup(m, e.lngLat, surveyFeat.properties ?? {});
			return;
		}

		const usahaFeat = feats.find(
			(f) => f.layer.id === LAYER_IDS.usaha || f.layer.id === LAYER_IDS.usahaLabel
		);
		if (usahaFeat) {
			const row = toUsahaRow(usahaFeat.properties ?? {});
			if (row) showUsahaPopup(m, e.lngLat, row);
			return;
		}
		const kawasanFeat = feats.find(
			(f) =>
				f.layer.id === LAYER_IDS.transit ||
				f.layer.id === LAYER_IDS.transitLabel ||
				f.layer.id === LAYER_IDS.bufferFill ||
				f.layer.id === LAYER_IDS.bufferLine
		);
		if (kawasanFeat) {
			const id = String(kawasanFeat.properties?.kawasan_id ?? '');
			if (id) {
				mapStore.pilihKawasan(id);
				mapStore.usahaTerpilih = extractUsahaRows(m, id);
			}
			return;
		}
	}

	// ---- penerapan state -> peta (dipakai efek DAN setelah ganti basemap) ----

	function applyUsahaFilter(m: maplibregl.Map) {
		const expr = combineFilters(
			usahaFilterExpression({ jenisTempat: filters.jenisTempat, keramaian: filters.keramaian }),
			idFilterExpression(filters.idWhitelist)
		);
		m.setFilter(LAYER_IDS.usaha, expr);
		m.setFilter(LAYER_IDS.usahaLabel, expr);
	}

	function applyModaFilter(m: maplibregl.Map) {
		const expr = modaFilterExpression(filters.moda);
		m.setFilter(LAYER_IDS.transit, expr);
		m.setFilter(LAYER_IDS.transitLabel, expr);
		m.setFilter(LAYER_IDS.bufferFill, expr);
		m.setFilter(LAYER_IDS.bufferLine, expr);
	}

	function applySurveyFilter(m: maplibregl.Map) {
		if (!m.getLayer(LAYER_IDS.survey)) return;
		const expr = surveyFilterExpression({
			surveyTopik: filters.surveyTopik,
			surveyor: filters.surveyor
		});
		m.setFilter(LAYER_IDS.survey, expr);
		if (m.getLayer(LAYER_IDS.surveyLabel)) {
			m.setFilter(LAYER_IDS.surveyLabel, expr);
		}
	}

	function applyHighlight(m: maplibregl.Map) {
		const ids = [...new Set([...mapStore.highlight, mapStore.kawasanAktif ?? ''])].filter(Boolean);
		const expr = highlightFilterExpression(ids);
		m.setFilter(LAYER_IDS.highlight, expr);
		m.setFilter(LAYER_IDS.highlightGlow, expr);
	}

	function applyVisibility(m: maplibregl.Map) {
		for (const [group, layerIds] of Object.entries(LAYER_GROUPS)) {
			const visible = mapStore.layerVisibility[group as keyof typeof LAYER_GROUPS];
			for (const id of layerIds) {
				m.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
			}
		}
	}

	onMount(() => {
		const m = createMap(container);
		map = m;
		// Ekspos untuk E2E (assert layer/feature) dan debugging demo.
		(window as unknown as { __twMap?: maplibregl.Map }).__twMap = m;
		loadAgregat()
			.then((a) => (daftarKawasan = a.kawasan))
			.catch(() => (daftarKawasan = []));

		// style.load terjadi saat init DAN setiap ganti basemap: pasang ulang
		// ikon + source/layer proyek + state filter/visibilitas.
		const setupLayers = async () => {
			ensureMapIcons(m);
			await addProjectLayers(m);
			applyUsahaFilter(m);
			applyModaFilter(m);
			applySurveyFilter(m);
			applyHighlight(m);
			applyVisibility(m);
			layersReady = true;
			m.resize();
		};

		if (m.isStyleLoaded()) {
			setupLayers();
		}
		m.on('style.load', setupLayers);
		m.on('styleimagemissing', () => ensureMapIcons(m));
		m.once('idle', () => container.setAttribute('data-map-idle', 'true'));
		m.on('moveend', () => {
			const c = m.getCenter();
			mapStore.viewport = { center: [c.lng, c.lat], zoom: m.getZoom() };
		});
		m.on('click', (e) => handleClick(m, e));
		for (const id of [LAYER_IDS.survey, LAYER_IDS.usaha, LAYER_IDS.transit, LAYER_IDS.bufferFill]) {
			m.on('mouseenter', id, () => {
				if (m.getLayer(id)) m.getCanvas().style.cursor = 'pointer';
			});
			m.on('mouseleave', id, () => (m.getCanvas().style.cursor = ''));
		}
		return () => {
			map = null;
			delete (window as unknown as { __twMap?: maplibregl.Map }).__twMap;
			m.remove();
		};
	});

	// Ganti basemap realtime: setStyle lalu style.load memasang ulang segalanya.
	let basemapTerpasang = mapStore.basemap;
	$effect(() => {
		const pilihan = mapStore.basemap;
		if (!map || pilihan === basemapTerpasang) return;
		basemapTerpasang = pilihan;
		layersReady = false;
		map.setStyle(basemapStyleFor(pilihan), { diff: false });
	});

	// Filter kategorikal + whitelist id (filter numerik DuckDB) -> filter expression.
	$effect(() => {
		if (!map || !layersReady) return;
		applyUsahaFilter(map);
	});

	$effect(() => {
		if (!map || !layersReady) return;
		applyModaFilter(map);
	});

	$effect(() => {
		if (!map || !layersReady) return;
		applySurveyFilter(map);
	});

	// Highlight: kawasan aktif + daftar highlight (aksi AI).
	$effect(() => {
		if (!map || !layersReady) return;
		applyHighlight(map);
	});

	// Toggle visibilitas grup layer dari layer control.
	$effect(() => {
		if (!map || !layersReady) return;
		applyVisibility(map);
	});

	// Zoom programatik (aksi peta AI zoom_to / highlight).
	$effect(() => {
		if (!map || !layersReady || !mapStore.zoomTarget) return;
		const targets = daftarKawasan.filter((k) => mapStore.zoomTarget?.includes(k.kawasan_id));
		if (targets.length === 1) {
			map.flyTo({ center: [targets[0].lon, targets[0].lat], zoom: 14.5 });
		} else if (targets.length > 1) {
			const bounds = new maplibregl.LngLatBounds();
			for (const t of targets) bounds.extend([t.lon, t.lat]);
			map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
		}
		mapStore.zoomTarget = null;
	});

	// Hasil pencarian lokasi: terbang ke target, lalu buka popup usaha bila ada.
	$effect(() => {
		const target = mapStore.searchTarget;
		if (!map || !target) return;
		const m = map;
		m.flyTo({ center: target.lnglat, zoom: target.zoom });
		if (target.usaha) {
			const usaha = target.usaha;
			const lnglat = target.lnglat;
			m.once('moveend', () => showUsahaPopup(m, lnglat, usaha));
		}
		mapStore.searchTarget = null;
	});

	// Hasil klik titik survey dari halaman /survey: terbang ke lokasi dan buka popup
	$effect(() => {
		const target = mapStore.surveyTarget;
		if (!map || !target) return;
		const m = map;
		m.flyTo({ center: target.lnglat, zoom: target.zoom });
		if (target.activityId) {
			const actId = target.activityId;
			m.once('moveend', () => {
				const feats = m.querySourceFeatures('mapid_activities', {
					filter: ['==', ['get', 'id'], actId]
				});
				if (feats.length > 0) {
					showSurveyPopup(m, target.lnglat, feats[0].properties ?? {});
				}
			});
		}
		mapStore.surveyTarget = null;
	});
</script>

<div bind:this={container} class="h-full w-full" data-testid="map-container"></div>
