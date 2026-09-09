<script lang="ts">
	import { cariUsaha, type HasilCariUsaha } from '$lib/db/queries';
	import { loadAgregat } from '$lib/data/agregat';
	import { fetchMapidActivities, type MapidActivity } from '$lib/data/mapidActivities';
	import { JENIS_LABELS, MODA_LABELS } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import { masukPanel } from '$lib/utils/motion';
	import type { AgregatKawasan } from '$lib/types';
	import Icon from './Icon.svelte';

	interface Hasil {
		key: string;
		label: string;
		sub: string;
		lnglat: [number, number];
		zoom: number;
		stasiunId?: string;
		usaha?: HasilCariUsaha;
		activityId?: string;
	}

	let teks = $state('');
	let hasil = $state<Hasil[]>([]);
	let terbuka = $state(false);
	let stasiun: AgregatKawasan[] = [];
	let activities: MapidActivity[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		loadAgregat()
			.then((a) => (stasiun = a.kawasan))
			.catch(() => (stasiun = []));

		fetchMapidActivities()
			.then((acts) => (activities = acts))
			.catch(() => (activities = []));
	});

	async function cari(q: string) {
		const kecil = q.toLowerCase();
		const dariStasiun: Hasil[] = stasiun
			.filter((k) => k.nama.toLowerCase().includes(kecil))
			.slice(0, 3)
			.map((k) => ({
				key: `st-${k.kawasan_id}`,
				label: k.nama,
				sub: `Stasiun/halte · ${MODA_LABELS[k.moda] ?? k.moda}`,
				lnglat: [k.lon, k.lat] as [number, number],
				zoom: 14.5,
				stasiunId: k.kawasan_id
			}));

		const dariObservasi: Hasil[] = activities
			.filter(
				(a) =>
					a.title.toLowerCase().includes(kecil) ||
					a.description.toLowerCase().includes(kecil) ||
					(a.user_full_name && a.user_full_name.toLowerCase().includes(kecil))
			)
			.slice(0, 4)
			.map((a) => ({
				key: `act-${a._id}`,
				label: a.title,
				sub: `📍 Observasi #Devunder · ${a.user_full_name || a.user_name}`,
				lnglat: a.geometry.coordinates,
				zoom: 16.5,
				activityId: a._id
			}));

		// usaha via DuckDB; bila gagal (perangkat lemah) pencarian stasiun tetap jalan
		const dariUsaha: Hasil[] = await cariUsaha(q)
			.then((rows) =>
				rows.map((u) => ({
					key: `u-${u.id}`,
					label: u.nama,
					sub: JENIS_LABELS[u.jenis_tempat] ?? 'Usaha',
					lnglat: [u.lon, u.lat] as [number, number],
					zoom: 16.5,
					usaha: u
				}))
			)
			.catch(() => []);
		hasil = [...dariObservasi, ...dariStasiun, ...dariUsaha].slice(0, 8);
		terbuka = true;
	}

	function onInput() {
		clearTimeout(timer);
		const q = teks.trim();
		if (q.length < 2) {
			hasil = [];
			terbuka = false;
			return;
		}
		timer = setTimeout(() => void cari(q), 200);
	}

	function pilih(r: Hasil) {
		terbuka = false;
		teks = '';
		hasil = [];
		if (r.stasiunId) mapStore.pilihKawasan(r.stasiunId);
		if (r.activityId) {
			mapStore.surveyTarget = {
				lnglat: r.lnglat,
				zoom: r.zoom,
				activityId: r.activityId
			};
			return;
		}
		mapStore.searchTarget = {
			lnglat: r.lnglat,
			zoom: r.zoom,
			usaha: r.usaha
				? {
						id: r.usaha.id,
						nama: r.usaha.nama,
						jenis_tempat: r.usaha.jenis_tempat,
						harga_rata: r.usaha.harga_rata,
						keramaian: r.usaha.keramaian,
						kawasan_id: r.usaha.kawasan_id ?? ''
					}
				: undefined
		};
	}
</script>

<div class="relative w-full max-w-sm">
	<label class="sr-only" for="cari-lokasi">Cari stasiun, usaha, atau observasi</label>
	<span class="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-black">
		<Icon name="cari" size={16} />
	</span>
	<input
		id="cari-lokasi"
		type="search"
		class="liquid-glass w-full rounded-full py-2.5 pr-3 pl-9 text-sm font-extrabold text-black placeholder:text-black/70 shadow-2xl focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
		placeholder="Cari stasiun, usaha, observasi… (mis. Blok M, ojek)"
		autocomplete="off"
		bind:value={teks}
		oninput={onInput}
		onfocus={() => (terbuka = hasil.length > 0)}
		data-testid="search-input"
	/>
	{#if terbuka && hasil.length > 0}
		<ul
			class="liquid-glass liquid-glass-scroll absolute top-full right-0 left-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-white/70 p-1 shadow-2xl"
			transition:masukPanel
			data-testid="search-results"
		>
			{#each hasil as r (r.key)}
				<li>
					<button
						type="button"
						class="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/50"
						onclick={() => pilih(r)}
						data-testid="search-result"
					>
						<span class="block text-sm font-extrabold text-black">{r.label}</span>
						<span class="block text-xs font-bold text-black/80">{r.sub}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if terbuka && teks.trim().length >= 2}
		<p
			class="liquid-glass absolute top-full right-0 left-0 z-20 mt-1.5 rounded-xl border border-white/70 px-3 py-2 text-xs font-bold text-black shadow-2xl"
		>
			Tidak ditemukan.
		</p>
	{/if}
</div>
