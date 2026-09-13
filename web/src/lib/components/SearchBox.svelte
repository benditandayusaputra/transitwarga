<script lang="ts">
	import { cariUsaha, type HasilCariUsaha } from '$lib/db/queries';
	import { loadAgregat } from '$lib/data/agregat';
	import { fetchMapidActivities, type MapidActivity } from '$lib/data/mapidActivities';
	import { JENIS_LABELS, MODA_LABELS } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import { masukPanel } from '$lib/utils/motion';
	import type { AgregatKawasan } from '$lib/types';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Search from '@lucide/svelte/icons/search';

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

	/** Prefix testid; undefined = instance ini bukan yang diuji (mencegah testid ganda). */
	let { testid }: { testid?: string } = $props();

	let teks = $state('');
	let hasil = $state<Hasil[]>([]);
	let terbuka = $state(false);
	let mencari = $state(false);
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
		mencari = true;
		const kecil = q.toLowerCase();
		const dariStasiun: Hasil[] = stasiun
			.filter((k) => k.nama.toLowerCase().includes(kecil))
			.slice(0, 3)
			.map((k) => ({
				key: `st-${k.kawasan_id}`,
				label: k.nama,
				sub: `Stasiun atau halte, ${MODA_LABELS[k.moda] ?? k.moda}`,
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
				sub: `Observasi lapangan, ${a.user_full_name || a.user_name}`,
				lnglat: a.geometry.coordinates,
				zoom: 16.5,
				activityId: a._id
			}));

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
		hasil = [...dariStasiun, ...dariUsaha, ...dariObservasi].slice(0, 8);
		terbuka = true;
		mencari = false;
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
			mapStore.surveyTarget = { lnglat: r.lnglat, zoom: r.zoom, activityId: r.activityId };
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

<div class="relative w-full">
	<label class="sr-only" for="cari-lokasi">Cari stasiun, usaha, atau observasi</label>
	<span class="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted">
		{#if mencari}<LoaderCircle size={15} class="animate-spin" />{:else}<Search size={15} />{/if}
	</span>
	<input
		id="cari-lokasi"
		type="search"
		class="input pl-9 shadow-[var(--shadow-float)] md:shadow-none"
		placeholder="Cari stasiun, usaha, atau observasi"
		autocomplete="off"
		bind:value={teks}
		oninput={onInput}
		onfocus={() => (terbuka = hasil.length > 0)}
		data-testid={testid ? `${testid}-input` : undefined}
	/>
	{#if terbuka && hasil.length > 0}
		<ul
			class="panel-float absolute top-full right-0 left-0 z-20 mt-1.5 max-h-72 overflow-y-auto p-1"
			transition:masukPanel
			data-testid={testid ? `${testid}-results` : undefined}
		>
			{#each hasil as r (r.key)}
				<li>
					<button
						type="button"
						class="w-full rounded-[6px] px-3 py-2 text-left transition-colors hover:bg-line-2"
						onclick={() => pilih(r)}
						data-testid={testid ? `${testid}-result` : undefined}
					>
						<span class="block truncate text-[13.5px] font-medium text-ink">{r.label}</span>
						<span class="block truncate text-[12px] text-muted">{r.sub}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if terbuka && teks.trim().length >= 2}
		<p
			class="panel-float absolute top-full right-0 left-0 z-20 mt-1.5 px-3 py-2 text-[12.5px] text-muted"
		>
			Tidak ada hasil untuk kata itu.
		</p>
	{/if}
</div>
