<script lang="ts">
	import AngkaNaik from '$lib/components/AngkaNaik.svelte';
	import { loadAgregat } from '$lib/data/agregat';
	import { TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import { formatAngka, formatPersen } from '$lib/utils/format';
	import type { AgregatPayload } from '$lib/types';
	import type { Component } from 'svelte';
	import Bot from '@lucide/svelte/icons/bot';
	import Database from '@lucide/svelte/icons/database';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Footprints from '@lucide/svelte/icons/footprints';
	import Gauge from '@lucide/svelte/icons/gauge';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import Radius from '@lucide/svelte/icons/radius';
	import Store from '@lucide/svelte/icons/store';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import Smartphone from '@lucide/svelte/icons/smartphone';

	let agregat = $state<AgregatPayload | null>(null);
	let gagal = $state(false);
	$effect(() => {
		loadAgregat()
			.then((a) => (agregat = a))
			.catch(() => (gagal = true));
	});

	const insight = $derived.by(() => {
		if (!agregat || agregat.kawasan.length === 0) return null;
		const ks = agregat.kawasan;
		return {
			kawasan: ks.length,
			totalUsaha: ks.reduce((a, k) => a + k.n_usaha_800, 0),
			rataDigital: ks.reduce((a, k) => a + k.pct_digital, 0) / ks.length,
			perluPenataan: ks.filter((k) => k.tipologi === 'padat_friksi').length
		};
	});

	/** Papan kawasan: urut skor friksi tertinggi, lima teratas. */
	const papan = $derived(
		[...(agregat?.kawasan ?? [])].sort((a, b) => b.skor_friksi - a.skor_friksi).slice(0, 6)
	);

	const langkah: { judul: string; isi: string; ikon: Component<{ size?: number }> }[] = [
		{
			ikon: Database,
			judul: 'Data lapangan',
			isi: 'Menu Go dan Struk Go dari MAPID, ditambah observasi tim Devunder di koridor MRT.'
		},
		{
			ikon: Radius,
			judul: 'Analisis spasial',
			isi: 'Buffer 400 dan 800 meter dari tiap stasiun, spatial join seluruh titik usaha dan transaksi.'
		},
		{
			ikon: Gauge,
			judul: 'Empat skor, lima tipologi',
			isi: 'Kepadatan, keramaian, inklusi digital, dan friksi trotoar menentukan tipologi kawasan.'
		},
		{
			ikon: Bot,
			judul: 'Asisten yang membaca peta',
			isi: 'AI merangkum angka menjadi kalimat dan menunjuk kawasan yang dimaksud langsung di peta.'
		}
	];
</script>

<svelte:head>
	<title>TransitWarga</title>
	<meta
		name="description"
		content="WebGIS yang memetakan kaki lima, gerobak, dan warung tenda di sekitar stasiun MRT dan halte TransJakarta, lalu menilai kawasan dengan empat skor dan lima tipologi."
	/>
</svelte:head>

<section class="border-b border-line bg-surface">
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
		<div class="max-w-xl">
			<p class="masuk text-sm font-medium text-accent-2" style="--i: 0">
				Ekonomi informal di ekosistem transportasi massal Jakarta
			</p>
			<h1
				class="masuk mt-3 text-[34px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]"
				style="--i: 1"
			>
				Warung kecil menghidupkan stasiun. Data membantu menatanya.
			</h1>
			<p class="masuk mt-5 text-[16px] leading-7 text-ink-2" style="--i: 2">
				TransitWarga memetakan kaki lima, gerobak, dan warung tenda di sekitar stasiun MRT dan halte
				TransJakarta, menilai setiap kawasan dengan empat skor, lalu mengelompokkannya ke lima
				tipologi. Hasilnya adalah dasar angka untuk penataan pedagang, zona kuliner transit, dan
				program pembayaran digital.
			</p>
			<div class="masuk mt-7 flex flex-wrap gap-2.5" style="--i: 3">
				<a href="/peta" class="btn btn-primary h-10 px-5" data-testid="cta-peta">Buka peta</a>
				<a href="/analisis" class="btn h-10 px-5">Lihat analisis</a>
			</div>

			<dl
				class="masuk mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
				style="--i: 4"
				aria-live="polite"
			>
				{#if insight}
					<div>
						<dt class="label inline-flex items-center gap-1.5">
							<TrainFront size={13} /> Kawasan
						</dt>
						<dd class="num mt-1 text-2xl">
							<AngkaNaik nilai={insight.kawasan} format={formatAngka} />
						</dd>
					</div>
					<div>
						<dt class="label inline-flex items-center gap-1.5"><Store size={13} /> Titik usaha</dt>
						<dd class="num mt-1 text-2xl">
							<AngkaNaik nilai={insight.totalUsaha} format={formatAngka} />
						</dd>
					</div>
					<div>
						<dt class="label inline-flex items-center gap-1.5">
							<QrCode size={13} /> Transaksi digital
						</dt>
						<dd class="num mt-1 text-2xl">
							<AngkaNaik nilai={insight.rataDigital} format={formatPersen} />
						</dd>
					</div>
					<div>
						<dt class="label inline-flex items-center gap-1.5">
							<Footprints size={13} /> Perlu penataan
						</dt>
						<dd class="num mt-1 text-2xl">
							<AngkaNaik nilai={insight.perluPenataan} format={formatAngka} />
						</dd>
					</div>
				{:else if gagal}
					<p class="col-span-full text-sm text-muted">Data ringkasan belum dapat dimuat.</p>
				{:else}
					{#each [0, 1, 2, 3] as i (i)}
						<div>
							<div class="shimmer h-3 w-24"></div>
							<div class="shimmer mt-2 h-7 w-14"></div>
						</div>
					{/each}
				{/if}
			</dl>
		</div>

		<div class="masuk card self-start p-5" style="--i: 2" aria-labelledby="papan-judul">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id="papan-judul" class="text-[15px] font-semibold text-ink">
					Kawasan dengan friksi trotoar tertinggi
				</h2>
				<a href="/analisis" class="text-[12.5px] font-medium text-accent">Semua kawasan</a>
			</div>
			<p class="mt-1 text-[12.5px] text-muted">
				Skor 0 sampai 100. Semakin tinggi, semakin banyak lapak menutup jalur pejalan kaki.
			</p>
			{#if papan.length > 0}
				<ol class="mt-4 divide-y divide-line-2">
					{#each papan as k, i (k.kawasan_id)}
						<li
							class="masuk grid grid-cols-[1fr_auto] items-center gap-3 py-2.5"
							style={`--i: ${3 + i}`}
						>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<span
										class="h-2.5 w-2.5 shrink-0 rounded-sm"
										style:background-color={TIPOLOGI_COLORS[k.tipologi]}
										aria-hidden="true"
									></span>
									<span class="truncate text-sm font-medium text-ink">{k.nama}</span>
								</div>
								<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line-2">
									<div
										class="bar-tumbuh h-full rounded-full bg-signal"
										style:width={`${k.skor_friksi}%`}
										style:animation-delay={`${300 + i * 60}ms`}
									></div>
								</div>
								<span class="mt-1 block text-[11.5px] text-muted"
									>{TIPOLOGI_LABELS[k.tipologi]}</span
								>
							</div>
							<span class="num text-lg"><AngkaNaik nilai={k.skor_friksi} /></span>
						</li>
					{/each}
				</ol>
			{:else}
				<div class="mt-4 space-y-3">
					{#each [0, 1, 2, 3, 4, 5] as i (i)}
						<div class="shimmer h-11 w-full"></div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<section class="mx-auto max-w-7xl px-4 py-14 sm:px-6">
	<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_2fr]">
		<div>
			<h2 class="text-2xl font-semibold tracking-tight text-ink">Masalah yang diangkat</h2>
			<p class="mt-3 text-[15px] leading-7 text-ink-2">
				Tidak ada data publik yang menjelaskan berapa banyak pedagang di sekitar simpul transit, apa
				yang mereka jual, kapan ramainya, dan seberapa jauh lapak menutup jalur pejalan kaki.
			</p>
		</div>
		<div class="grid gap-8 sm:grid-cols-3">
			<div>
				<span
					class="mb-3 grid h-9 w-9 place-items-center rounded-[8px] bg-accent-soft text-accent-2"
					><EyeOff size={17} /></span
				>
				<h3 class="font-semibold text-ink">Tidak terlihat di peta kebijakan</h3>
				<p class="mt-2 text-sm leading-6 text-ink-2">
					Pedagang informal melayani ribuan penglaju setiap hari tetapi jarang masuk basis data
					resmi. Penertiban berulang di titik yang sama tanpa dasar angka.
				</p>
			</div>
			<div>
				<span class="mb-3 grid h-9 w-9 place-items-center rounded-[8px] bg-signal-soft text-signal"
					><Footprints size={17} /></span
				>
				<h3 class="font-semibold text-ink">Friksi di jalur pejalan kaki</h3>
				<p class="mt-2 text-sm leading-6 text-ink-2">
					Di beberapa kawasan, lapak menempati trotoar sempit sehingga penglaju berjalan memutar
					atau turun ke badan jalan.
				</p>
			</div>
			<div>
				<span class="mb-3 grid h-9 w-9 place-items-center rounded-[8px] bg-ok-soft text-ok"
					><Smartphone size={17} /></span
				>
				<h3 class="font-semibold text-ink">Kesenjangan pembayaran digital</h3>
				<p class="mt-2 text-sm leading-6 text-ink-2">
					Sebagian pedagang sudah menerima QRIS, sebagian masih tunai sepenuhnya. Program
					digitalisasi berjalan tanpa peta prioritas.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="border-t border-line bg-surface">
	<div class="mx-auto max-w-7xl px-4 py-14 sm:px-6">
		<h2 class="text-2xl font-semibold tracking-tight text-ink">Cara kerjanya</h2>
		<ol class="mt-8 grid gap-6 md:grid-cols-4">
			{#each langkah as l, i (l.judul)}
				<li class="border-t-2 border-ink pt-4">
					<div class="flex items-center justify-between">
						<span class="num text-sm text-muted">Langkah {i + 1}</span>
						<span class="text-ink-2"><l.ikon size={18} /></span>
					</div>
					<h3 class="mt-1 font-semibold text-ink">{l.judul}</h3>
					<p class="mt-2 text-sm leading-6 text-ink-2">{l.isi}</p>
				</li>
			{/each}
		</ol>
		<div class="mt-10 flex flex-wrap gap-2.5">
			<a href="/rekomendasi" class="btn gap-1.5"><MapPinned size={15} /> Rekomendasi per tipologi</a
			>
			<a href="/metodologi" class="btn btn-ghost">Metodologi dan sumber data</a>
		</div>
	</div>
</section>
