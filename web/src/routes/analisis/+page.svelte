<script lang="ts">
	import AngkaNaik from '$lib/components/AngkaNaik.svelte';
	import BarChartSimple from '$lib/components/BarChartSimple.svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import CompareView from '$lib/components/CompareView.svelte';
	import DonutChart from '$lib/components/DonutChart.svelte';
	import HistogramChart from '$lib/components/HistogramChart.svelte';
	import RankingChart from '$lib/components/RankingChart.svelte';
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
		tunai: '#94a3b8',
		qris: '#2563eb',
		debit: '#56B4E9',
		kredit: '#CC79A7',
		ewallet: '#009E73'
	};

	const METRIK_RANKING = [
		{ id: 'skor_kepadatan', label: 'Kepadatan' },
		{ id: 'skor_keramaian', label: 'Keramaian' },
		{ id: 'skor_digital', label: 'Digitalisasi' },
		{ id: 'skor_friksi', label: 'Friksi' }
	] as const;
	type MetrikId = (typeof METRIK_RANKING)[number]['id'];

	let agregat = $state<AgregatPayload | null>(null);
	let kawasanId = $state('');
	let dbGagal = $state(false);
	let memuat = $state(false);
	let metrikRanking = $state<MetrikId>('skor_kepadatan');

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

	const kartu = $derived(
		indikator
			? [
					{ label: 'Usaha informal (≤800 m)', nilai: indikator.nUsaha, format: formatAngka },
					{ label: 'Harga median per porsi', nilai: indikator.hargaMedian, format: formatRupiah },
					{ label: 'Transaksi non-tunai', nilai: indikator.pctDigital, format: formatPersen },
					{ label: 'Jumlah transaksi tercatat', nilai: indikator.nTransaksi, format: formatAngka }
				]
			: []
	);

	const pctDigitalAktif = $derived(
		metode.length > 0
			? Math.round(
					(metode.filter((m) => m.digital).reduce((a, m) => a + m.n, 0) /
						metode.reduce((a, m) => a + m.n, 0)) *
						100
				)
			: null
	);

	const dataRanking = $derived(
		(agregat?.kawasan ?? []).map((k) => ({
			id: k.kawasan_id,
			nama: k.nama,
			nilai: k[metrikRanking],
			tipologi: k.tipologi
		}))
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
	<div class="anim-masuk">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Analisis Kawasan</h1>
		<p class="mt-1 text-sm text-slate-500">
			Analitik berjalan langsung di browser Anda (DuckDB-WASM di atas file Parquet statis) — tanpa
			server analitik.
		</p>
	</div>

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
			class="focus-visible:ring-primary-600 mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal text-slate-800 focus-visible:ring-2 focus-visible:outline-none"
			bind:value={kawasanId}
			data-testid="pilih-kawasan"
		>
			{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
				<option value={k.kawasan_id}>{k.nama}</option>
			{/each}
		</select>
	</label>

	{#if memuat}
		<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
			{#each [0, 1, 2, 3] as i (i)}
				<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div class="shimmer h-3 w-2/3 rounded-full"></div>
					<div class="shimmer mt-2.5 h-6 w-1/2 rounded-lg"></div>
				</div>
			{/each}
		</div>
	{:else if indikator}
		<dl
			class="anim-masuk mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
			data-testid="indikator-kawasan"
		>
			{#each kartu as item (item.label)}
				<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<dt class="text-xs text-slate-500">{item.label}</dt>
					<dd class="mt-1 text-xl font-bold text-slate-900">
						<AngkaNaik nilai={item.nilai} format={item.format} />
					</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#if !dbGagal}
		<div class="anim-masuk-lambat mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
				<DonutChart
					irisan={metode.map((m) => ({
						label: m.metode === 'tunai' ? 'Tunai' : m.metode.toUpperCase(),
						value: m.n,
						color: METODE_COLORS[m.metode] ?? '#94a3b8'
					}))}
					tengah={pctDigitalAktif !== null ? `${pctDigitalAktif}% digital` : ''}
				/>
			</ChartCard>
		</div>
	{/if}

	<!-- Peringkat antar kawasan dari statistik pra-hitung: tetap hidup walau
	     DuckDB gagal, dan klik baris memindahkan kawasan terpilih -->
	<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<ChartCard title="Peringkat kawasan">
			<div class="mb-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Pilih metrik peringkat">
				{#each METRIK_RANKING as m (m.id)}
					<button
						type="button"
						class={metrikRanking === m.id
							? 'bg-primary-700 rounded-full px-2.5 py-1 text-xs font-semibold text-white'
							: 'hover:border-primary-600 hover:text-primary-700 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors'}
						aria-pressed={metrikRanking === m.id}
						onclick={() => (metrikRanking = m.id)}
					>
						{m.label}
					</button>
				{/each}
			</div>
			<RankingChart data={dataRanking} aktifId={kawasanId} onPilih={(id) => (kawasanId = id)} />
		</ChartCard>
		<CompareView {agregat} {dbGagal} />
	</div>
</div>
