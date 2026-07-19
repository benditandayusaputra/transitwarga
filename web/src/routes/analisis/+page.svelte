<script lang="ts">
	import BarChartSimple from '$lib/components/BarChartSimple.svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import CompareView from '$lib/components/CompareView.svelte';
	import HistogramChart from '$lib/components/HistogramChart.svelte';
	import StackedBar from '$lib/components/StackedBar.svelte';
	import { loadAgregat } from '$lib/data/agregat';
	import {
		distribusiJenis,
		histogramHarga,
		komposisiMetode,
		statsKawasan,
		type BinHarga,
		type DistribusiJenis,
		type IndikatorKawasan,
		type KomposisiMetode
	} from '$lib/db/queries';
	import { JENIS_COLORS, JENIS_LABELS } from '$lib/map/layers';
	import { formatAngka, formatPersen, formatRupiah } from '$lib/utils/format';
	import type { AgregatPayload } from '$lib/types';

	const METODE_COLORS: Record<string, string> = {
		tunai: '#999999',
		qris: '#0072B2',
		debit: '#56B4E9',
		kredit: '#CC79A7',
		ewallet: '#009E73'
	};

	let agregat = $state<AgregatPayload | null>(null);
	let kawasanId = $state('');
	let dbGagal = $state(false);
	let memuat = $state(false);

	let indikator = $state<IndikatorKawasan | null>(null);
	let jenis = $state<DistribusiJenis[]>([]);
	let bins = $state<BinHarga[]>([]);
	let metode = $state<KomposisiMetode[]>([]);

	$effect(() => {
		loadAgregat()
			.then((a) => {
				agregat = a;
				if (!kawasanId && a.kawasan.length > 0) kawasanId = a.kawasan[0].kawasan_id;
			})
			.catch(() => (agregat = null));
	});

	/** Fallback blueprint bag. 11: indikator dari agregat.json bila DuckDB gagal. */
	function indikatorDariAgregat(id: string): IndikatorKawasan | null {
		const k = agregat?.kawasan.find((x) => x.kawasan_id === id);
		if (!k) return null;
		return {
			kawasanId: k.kawasan_id,
			nUsaha: k.n_usaha_800,
			hargaMedian: k.harga_median,
			pctDigital: k.pct_digital,
			nTransaksi: k.n_transaksi
		};
	}

	$effect(() => {
		if (!kawasanId) return;
		const id = kawasanId;
		memuat = true;
		Promise.all([statsKawasan(id), distribusiJenis(id), histogramHarga(id), komposisiMetode(id)])
			.then(([ind, j, b, m]) => {
				if (id !== kawasanId) return;
				indikator = ind;
				jenis = j;
				bins = b;
				metode = m;
				dbGagal = false;
			})
			.catch(() => {
				dbGagal = true;
				indikator = indikatorDariAgregat(id);
				jenis = [];
				bins = [];
				metode = [];
			})
			.finally(() => (memuat = false));
	});

	const kawasanAktifNama = $derived(
		agregat?.kawasan.find((k) => k.kawasan_id === kawasanId)?.nama ?? kawasanId
	);

	const kartu = $derived(
		indikator
			? [
					{ label: 'Usaha informal (≤800 m)', nilai: formatAngka(indikator.nUsaha) },
					{ label: 'Harga median per porsi', nilai: formatRupiah(indikator.hargaMedian) },
					{ label: 'Transaksi non-tunai', nilai: formatPersen(indikator.pctDigital) },
					{ label: 'Jumlah transaksi tercatat', nilai: formatAngka(indikator.nTransaksi) }
				]
			: []
	);
</script>

<svelte:head>
	<title>Analisis — TransitWarga</title>
	<meta
		name="description"
		content="Analitik interaktif ekonomi informal per kawasan stasiun: indikator, distribusi, dan perbandingan"
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold text-slate-900">Analisis Kawasan</h1>
	<!-- <p class="mt-1 text-sm text-slate-500">
		Analitik berjalan langsung di browser Anda (DuckDB-WASM di atas file Parquet statis) — tanpa
		server analitik.
	</p> -->

	{#if dbGagal}
		<p
			class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
			data-testid="fallback-message"
		>
			Analitik interaktif tidak dapat dijalankan di perangkat ini. Kami menampilkan statistik
			pra-hitung per kawasan; fitur grafik dan filter bebas disembunyikan.
		</p>
	{/if}

	<label class="mt-6 block max-w-sm text-xs font-semibold text-slate-500 uppercase">
		Pilih kawasan
		<select
			class="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-normal text-slate-800"
			bind:value={kawasanId}
			data-testid="pilih-kawasan"
		>
			{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
				<option value={k.kawasan_id}>{k.nama}</option>
			{/each}
		</select>
	</label>

	{#if memuat}
		<p class="mt-6 text-sm text-slate-400">Memuat analitik…</p>
	{:else if indikator}
		<h2 class="sr-only">Indikator {kawasanAktifNama}</h2>
		<dl class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="indikator-kawasan">
			{#each kartu as item (item.label)}
				<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<dt class="text-xs text-slate-500">{item.label}</dt>
					<dd class="mt-1 text-xl font-bold text-slate-900">{item.nilai}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#if !dbGagal}
		<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
			<ChartCard title="Distribusi jenis tempat">
				<BarChartSimple
					items={jenis.map((j) => ({
						label: JENIS_LABELS[j.jenis] ?? j.jenis,
						value: j.n,
						color: JENIS_COLORS[j.jenis] ?? '#94a3b8'
					}))}
				/>
			</ChartCard>
			<ChartCard title="Histogram harga per porsi">
				<HistogramChart
					bins={bins.map((b) => ({ label: `${Math.round(b.binLo / 1000)}rb`, n: b.n }))}
				/>
			</ChartCard>
			<ChartCard title="Metode bayar: tunai vs digital">
				<StackedBar
					segments={metode.map((m) => ({
						label: m.metode === 'tunai' ? 'Tunai' : `${m.metode.toUpperCase()} (digital)`,
						value: m.n,
						color: METODE_COLORS[m.metode] ?? '#94a3b8'
					}))}
				/>
			</ChartCard>
		</div>
	{/if}

	<div class="mt-6">
		<CompareView {agregat} {dbGagal} />
	</div>
</div>
