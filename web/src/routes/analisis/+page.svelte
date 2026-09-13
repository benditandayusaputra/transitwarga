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
	import {
		JENIS_COLORS,
		JENIS_LABELS,
		MODA_LABELS,
		TIPOLOGI_COLORS,
		TIPOLOGI_LABELS
	} from '$lib/map/layers';
	import { formatAngka, formatPersen, formatRupiah } from '$lib/utils/format';
	import type { AgregatPayload } from '$lib/types';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import Banknote from '@lucide/svelte/icons/banknote';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Store from '@lucide/svelte/icons/store';
	import type { Component } from 'svelte';

	const METODE_COLORS: Record<string, string> = {
		tunai: '#94a3b8',
		qris: '#0b5fd1',
		debit: '#56B4E9',
		kredit: '#CC79A7',
		ewallet: '#009E73'
	};

	const METRIK_RANKING = [
		{ id: 'skor_kepadatan', label: 'Kepadatan' },
		{ id: 'skor_keramaian', label: 'Keramaian' },
		{ id: 'skor_digital', label: 'Digital' },
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

	const kawasanAktif = $derived(agregat?.kawasan.find((k) => k.kawasan_id === kawasanId) ?? null);

	const kartu = $derived(
		indikator
			? [
					{
						label: 'Usaha informal dalam 800 m',
						nilai: indikator.nUsaha,
						format: formatAngka,
						ikon: Store as Component<{ size?: number }>
					},
					{
						label: 'Harga median per porsi',
						nilai: indikator.hargaMedian,
						format: formatRupiah,
						ikon: Banknote as Component<{ size?: number }>
					},
					{
						label: 'Transaksi non-tunai',
						nilai: indikator.pctDigital,
						format: formatPersen,
						ikon: QrCode as Component<{ size?: number }>
					},
					{
						label: 'Transaksi tercatat',
						nilai: indikator.nTransaksi,
						format: formatAngka,
						ikon: Receipt as Component<{ size?: number }>
					}
				]
			: []
	);

	const skor = $derived(
		kawasanAktif
			? [
					{ label: 'Kepadatan usaha', nilai: kawasanAktif.skor_kepadatan },
					{ label: 'Keramaian', nilai: kawasanAktif.skor_keramaian },
					{ label: 'Inklusi digital', nilai: kawasanAktif.skor_digital },
					{ label: 'Friksi trotoar', nilai: kawasanAktif.skor_friksi }
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
	<title>Analisis kawasan</title>
	<meta
		name="description"
		content="Indikator, distribusi usaha, komposisi metode bayar, peringkat, dan perbandingan dua kawasan stasiun."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
	<header class="masuk flex flex-wrap items-end justify-between gap-4" style="--i: 0">
		<div>
			<h1 class="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
				Analisis kawasan
			</h1>
			<p class="mt-1 max-w-2xl text-[14px] leading-6 text-ink-2">
				Seluruh kueri dijalankan di browser Anda di atas file Parquet statis. Tidak ada server
				analitik.
			</p>
		</div>
		<label class="label w-full sm:w-72">
			Kawasan yang ditinjau
			{#if agregat}
				<select class="input mt-1" bind:value={kawasanId} data-testid="pilih-kawasan">
					{#each agregat.kawasan as k (k.kawasan_id)}
						<option value={k.kawasan_id}>{k.nama}</option>
					{/each}
				</select>
			{:else}
				<div class="shimmer mt-1 h-9 w-full"></div>
			{/if}
		</label>
	</header>

	{#if dbGagal}
		<p
			class="mt-5 flex items-start gap-2 rounded-[8px] border border-signal/30 bg-signal-soft px-3.5 py-3 text-sm text-ink"
			data-testid="fallback-message"
		>
			<CircleAlert size={16} class="mt-0.5 shrink-0 text-signal" />
			<span>
				Analitik interaktif tidak dapat dijalankan di perangkat ini. Yang tampil adalah statistik
				yang sudah dihitung per kawasan. Grafik distribusi disembunyikan.
			</span>
		</p>
	{/if}

	{#if kawasanAktif}
		<div class="masuk mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5" style="--i: 1">
			<span
				class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium text-white"
				style:background-color={TIPOLOGI_COLORS[kawasanAktif.tipologi]}
			>
				{TIPOLOGI_LABELS[kawasanAktif.tipologi]}
			</span>
			<span class="text-[13px] text-ink-2"
				>{MODA_LABELS[kawasanAktif.moda] ?? kawasanAktif.moda}</span
			>
			<a
				href={`/peta?kawasan=${encodeURIComponent(kawasanAktif.kawasan_id)}`}
				class="inline-flex items-center gap-1 text-[13px] font-medium text-accent"
			>
				<MapPinned size={14} /> Lihat di peta
			</a>
		</div>
	{/if}

	<dl
		class="masuk mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
		style="--i: 2"
		data-testid="indikator-kawasan"
		aria-live="polite"
	>
		{#if memuat && !indikator}
			{#each [0, 1, 2, 3] as i (i)}
				<div class="card p-4">
					<div class="shimmer h-3 w-2/3"></div>
					<div class="shimmer mt-3 h-7 w-1/2"></div>
				</div>
			{/each}
		{:else}
			{#each kartu as item (item.label)}
				<div class="card p-4" aria-busy={memuat}>
					<dt class="label flex items-center gap-1.5"><item.ikon size={13} /> {item.label}</dt>
					<dd class="num mt-1.5 text-[22px]">
						<AngkaNaik nilai={item.nilai} format={item.format} />
					</dd>
				</div>
			{/each}
		{/if}
	</dl>

	{#if skor.length > 0}
		<section class="masuk card mt-4 p-4 sm:p-5" style="--i: 3" aria-label="Empat skor kawasan">
			<div class="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each skor as s, i (s.label)}
					<div>
						<div class="flex items-baseline justify-between text-[12.5px]">
							<span class="text-ink-2">{s.label}</span>
							<span class="num text-base"><AngkaNaik nilai={s.nilai} /></span>
						</div>
						<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-line-2">
							<div
								class="bar-tumbuh h-full rounded-full bg-ink"
								style:width={`${s.nilai}%`}
								style:animation-delay={`${i * 60}ms`}
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if !dbGagal}
		<div class="masuk mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3" style="--i: 4">
			<ChartCard
				title="Jenis tempat usaha"
				keterangan="Jumlah usaha per jenis dalam 800 m"
				{memuat}
			>
				<BarChartSimple
					items={jenis.map((j) => ({
						label: JENIS_LABELS[j.jenis] ?? j.jenis,
						value: j.n,
						color: JENIS_COLORS[j.jenis] ?? '#94a3b8'
					}))}
				/>
			</ChartCard>
			<ChartCard
				title="Sebaran harga per porsi"
				keterangan="Kelas harga dalam ribuan rupiah"
				{memuat}
			>
				<HistogramChart
					bins={bins.map((b) => ({ label: `${Math.round(b.binLo / 1000)}rb`, n: b.n }))}
				/>
			</ChartCard>
			<ChartCard title="Metode pembayaran" keterangan="Tunai dibandingkan non-tunai" {memuat}>
				<DonutChart
					irisan={metode.map((m) => ({
						label:
							m.metode === 'tunai'
								? 'Tunai'
								: m.metode === 'ewallet'
									? 'E-wallet'
									: m.metode.toUpperCase(),
						value: m.n,
						color: METODE_COLORS[m.metode] ?? '#94a3b8'
					}))}
					tengah={pctDigitalAktif !== null ? `${pctDigitalAktif}% digital` : ''}
				/>
			</ChartCard>
		</div>
	{/if}

	<div class="masuk mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2" style="--i: 5">
		<ChartCard
			title="Peringkat kawasan"
			keterangan="Klik kawasan untuk meninjaunya"
			memuat={!agregat}
		>
			<div class="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Pilih metrik peringkat">
				{#each METRIK_RANKING as m (m.id)}
					<button
						type="button"
						class="chip"
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
