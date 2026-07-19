<script lang="ts">
	import { cariUsaha, type HasilCariUsaha } from '$lib/db/queries';
	import { loadAgregat } from '$lib/data/agregat';
	import { JENIS_LABELS, MODA_LABELS } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
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
	}

	let teks = $state('');
	let hasil = $state<Hasil[]>([]);
	let terbuka = $state(false);
	let stasiun: AgregatKawasan[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		loadAgregat()
			.then((a) => (stasiun = a.kawasan))
			.catch(() => (stasiun = []));
	});

	async function cari(q: string) {
		const kecil = q.toLowerCase();
		const dariStasiun: Hasil[] = stasiun
			.filter((k) => k.nama.toLowerCase().includes(kecil))
			.slice(0, 4)
			.map((k) => ({
				key: `st-${k.kawasan_id}`,
				label: k.nama,
				sub: `Stasiun/halte · ${MODA_LABELS[k.moda] ?? k.moda}`,
				lnglat: [k.lon, k.lat] as [number, number],
				zoom: 14.5,
				stasiunId: k.kawasan_id
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
		hasil = [...dariStasiun, ...dariUsaha].slice(0, 8);
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
	<label class="sr-only" for="cari-lokasi">Cari stasiun atau usaha</label>
	<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
		<Icon name="cari" size={16} />
	</span>
	<input
		id="cari-lokasi"
		type="search"
		class="w-full rounded-full border border-slate-200/80 bg-white/95 py-2 pr-3 pl-9 text-sm shadow-lg backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
		placeholder="Cari stasiun / usaha… (mis. Blok M, soto)"
		autocomplete="off"
		bind:value={teks}
		oninput={onInput}
		onfocus={() => (terbuka = hasil.length > 0)}
		data-testid="search-input"
	/>
	{#if terbuka && hasil.length > 0}
		<ul
			class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
			data-testid="search-results"
		>
			{#each hasil as r (r.key)}
				<li>
					<button
						type="button"
						class="w-full px-3 py-2 text-left hover:bg-primary-50"
						onclick={() => pilih(r)}
						data-testid="search-result"
					>
						<span class="block text-sm font-medium text-slate-800">{r.label}</span>
						<span class="block text-xs text-slate-500">{r.sub}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if terbuka && teks.trim().length >= 2}
		<p
			class="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 shadow-lg"
		>
			Tidak ditemukan.
		</p>
	{/if}
</div>
