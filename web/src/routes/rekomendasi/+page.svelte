<script lang="ts">
	import AngkaNaik from '$lib/components/AngkaNaik.svelte';
	import { loadAgregat } from '$lib/data/agregat';
	import { TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import type { AgregatPayload, Tipologi } from '$lib/types';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import Landmark from '@lucide/svelte/icons/landmark';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import Users from '@lucide/svelte/icons/users';
	import type { Component } from 'svelte';

	type Pihak = 'pemda' | 'operator' | 'pedagang' | 'digital';
	const PIHAK: { id: Pihak; label: string; ikon: Component<{ size?: number }> }[] = [
		{ id: 'pemda', label: 'Pemerintah daerah', ikon: Landmark },
		{ id: 'operator', label: 'Operator transit', ikon: TrainFront },
		{ id: 'pedagang', label: 'Pedagang dan komunitas', ikon: Users },
		{ id: 'digital', label: 'Program pembayaran digital', ikon: HandCoins }
	];

	interface Rekomendasi {
		tipologi: Tipologi;
		ringkas: string;
		fokus: string;
		aksi: { pihak: Pihak; langkah: string[] }[];
	}

	const daftar: Rekomendasi[] = [
		{
			tipologi: 'kuliner_matang',
			ringkas: 'Ekosistem kuliner sudah hidup, keramaian tinggi, friksi terkendali.',
			fokus: 'Pengakuan dan peningkatan kualitas, bukan penggusuran.',
			aksi: [
				{
					pihak: 'pemda',
					langkah: [
						'Formalisasi menjadi zona kuliner transit resmi dengan jam operasional dan standar kebersihan.',
						'Sediakan fasilitas dasar: air bersih, listrik terukur, pengelolaan sampah.'
					]
				},
				{
					pihak: 'operator',
					langkah: [
						'Masukkan zona kuliner ke wayfinding stasiun (papan penunjuk, peta stasiun).',
						'Jajaki kemitraan promosi kuliner stasiun untuk menaikkan trafik di jam tidak sibuk.'
					]
				},
				{
					pihak: 'pedagang',
					langkah: [
						'Bentuk paguyuban per kawasan sebagai mitra dialog resmi.',
						'Ikuti sertifikasi higiene pangan yang difasilitasi pemerintah daerah.'
					]
				},
				{
					pihak: 'digital',
					langkah: [
						'Pertahankan adopsi: pendampingan pembukuan digital bagi pedagang yang sudah memakai QRIS.'
					]
				}
			]
		},
		{
			tipologi: 'padat_friksi',
			ringkas:
				'Kepadatan usaha tinggi dan lapak menutup trotoar. Akses pejalan kaki ke stasiun terganggu.',
			fokus: 'Penataan ulang ruang, bukan sekadar penertiban.',
			aksi: [
				{
					pihak: 'pemda',
					langkah: [
						'Tata ulang titik lapak menjauhi jalur pejalan kaki utama; pakai peta friksi sebagai dasar penentuan titik.',
						'Siapkan kantong relokasi dalam radius 400 m (lihat layer properti sewa) agar pedagang tidak kehilangan pasar.'
					]
				},
				{
					pihak: 'operator',
					langkah: [
						'Prioritaskan pelebaran dan pembersihan koridor pejalan kaki pada jam sibuk.',
						'Sediakan area tunggu ojek daring terpisah agar tidak menumpuk dengan lapak.'
					]
				},
				{
					pihak: 'pedagang',
					langkah: [
						'Sepakati batas lapak dan jam gelar-bongkar lewat paguyuban.',
						'Manfaatkan skema relokasi berimbang: tempat baru dengan kepastian izin.'
					]
				}
			]
		},
		{
			tipologi: 'potensi',
			ringkas: 'Aktivitas usaha cukup tetapi belum padat. Ruang masih lega.',
			fokus: 'Menumbuhkan dengan tertib sejak awal, lebih murah daripada menata belakangan.',
			aksi: [
				{
					pihak: 'pemda',
					langkah: [
						'Tetapkan zona tumbuh dengan slot lapak resmi sebelum kepadatan terjadi.',
						'Pantau tren kepadatan per kuartal dari data TransitWarga.'
					]
				},
				{
					pihak: 'operator',
					langkah: ['Uji coba bazar atau kuliner tematik akhir pekan untuk mengaktivasi kawasan.']
				},
				{
					pihak: 'digital',
					langkah: ['Masuk lebih awal: onboarding QRIS gratis bagi pedagang baru di zona tumbuh.']
				}
			]
		},
		{
			tipologi: 'prioritas_digital',
			ringkas: 'Kawasan ramai tetapi transaksi non-tunai masih rendah.',
			fokus: 'Percepatan inklusi digital yang tepat sasaran.',
			aksi: [
				{
					pihak: 'digital',
					langkah: [
						'Kampanye onboarding QRIS terarah ke kawasan ini, bukan sebar rata se-kota.',
						'Sediakan pendampingan literasi digital, bukan hanya stiker QRIS.'
					]
				},
				{
					pihak: 'pemda',
					langkah: [
						'Insentif retribusi bagi pedagang yang aktif menerima pembayaran digital.',
						'Pantau pergeseran persentase transaksi digital sebagai indikator keberhasilan program.'
					]
				},
				{
					pihak: 'pedagang',
					langkah: ['Manfaatkan riwayat transaksi digital untuk akses kredit mikro formal.']
				}
			]
		},
		{
			tipologi: 'sepi',
			ringkas: 'Aktivitas usaha minim.',
			fokus: 'Pahami penyebabnya (permintaan rendah atau akses buruk) sebelum intervensi.',
			aksi: [
				{
					pihak: 'pemda',
					langkah: [
						'Audit akses pejalan kaki dan penerangan; kawasan sepi sering bermula dari akses yang buruk.',
						'Jangan jadikan target relokasi tanpa perbaikan akses; pedagang akan kembali ke tempat ramai.'
					]
				},
				{
					pihak: 'operator',
					langkah: ['Evaluasi integrasi antarmoda: jarak halte pengumpan dan penyeberangan.']
				}
			]
		}
	];

	let agregat = $state<AgregatPayload | null>(null);
	$effect(() => {
		loadAgregat()
			.then((a) => (agregat = a))
			.catch(() => (agregat = null));
	});

	let pihakAktif = $state<Pihak | 'semua'>('semua');
	let tersalin = $state<Tipologi | null>(null);

	function kawasanUntuk(t: Tipologi) {
		return (agregat?.kawasan ?? []).filter((k) => k.tipologi === t);
	}

	function aksiTampil(item: Rekomendasi) {
		return pihakAktif === 'semua' ? item.aksi : item.aksi.filter((a) => a.pihak === pihakAktif);
	}

	async function salin(item: Rekomendasi) {
		const baris = [
			`${TIPOLOGI_LABELS[item.tipologi]}: ${item.ringkas} Fokus: ${item.fokus}`,
			...aksiTampil(item).flatMap((a) => [
				PIHAK.find((p) => p.id === a.pihak)?.label ?? a.pihak,
				...a.langkah.map((l) => `- ${l}`)
			])
		];
		try {
			await navigator.clipboard.writeText(baris.join('\n'));
			tersalin = item.tipologi;
			setTimeout(() => (tersalin = null), 1800);
		} catch {
			tersalin = null;
		}
	}
</script>

<svelte:head>
	<title>Rekomendasi kebijakan</title>
	<meta
		name="description"
		content="Rekomendasi per tipologi kawasan untuk pemerintah daerah, operator transit, pedagang, dan program pembayaran digital."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
	<header class="masuk max-w-3xl" style="--i: 0">
		<h1 class="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
			Rekomendasi kebijakan
		</h1>
		<p class="mt-2 text-[15px] leading-7 text-ink-2">
			Setiap kawasan masuk ke satu dari lima tipologi berdasarkan skor kepadatan, keramaian, inklusi
			digital, dan friksi trotoar. Rekomendasi di bawah disusun per tipologi dan per pihak,
			konsisten dengan skor kawasannya.
		</p>
	</header>

	<div
		class="masuk mt-6 flex flex-wrap items-center gap-1.5"
		style="--i: 1"
		role="group"
		aria-label="Saring menurut pihak"
	>
		<span class="label mr-1">Tampilkan untuk</span>
		<button
			type="button"
			class="chip"
			aria-pressed={pihakAktif === 'semua'}
			onclick={() => (pihakAktif = 'semua')}>Semua pihak</button
		>
		{#each PIHAK as p (p.id)}
			<button
				type="button"
				class="chip"
				aria-pressed={pihakAktif === p.id}
				onclick={() => (pihakAktif = p.id)}>{p.label}</button
			>
		{/each}
	</div>

	<div class="mt-8 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
		<nav
			class="masuk hidden self-start lg:sticky lg:top-20 lg:block"
			style="--i: 2"
			aria-label="Daftar tipologi"
		>
			<ol class="space-y-1">
				{#each daftar as item (item.tipologi)}
					{@const n = kawasanUntuk(item.tipologi).length}
					<li>
						<a
							href={`#tip-${item.tipologi}`}
							class="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] text-ink-2 hover:bg-line-2 hover:text-ink"
						>
							<span
								class="h-2.5 w-2.5 shrink-0 rounded-sm"
								style:background-color={TIPOLOGI_COLORS[item.tipologi]}
							></span>
							<span class="flex-1">{TIPOLOGI_LABELS[item.tipologi]}</span>
							{#if agregat}<span class="num text-muted"><AngkaNaik nilai={n} /></span>{:else}<span
									class="shimmer h-3 w-4"
								></span>{/if}
						</a>
					</li>
				{/each}
			</ol>
		</nav>

		<div class="space-y-10">
			{#each daftar as item, idx (item.tipologi)}
				{@const kawasan = kawasanUntuk(item.tipologi)}
				{@const aksi = aksiTampil(item)}
				<section
					id={`tip-${item.tipologi}`}
					class="masuk scroll-mt-20"
					style={`--i: ${2 + idx}`}
					aria-labelledby={`judul-${item.tipologi}`}
				>
					<div class="border-l-4 pl-4" style:border-color={TIPOLOGI_COLORS[item.tipologi]}>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2
									id={`judul-${item.tipologi}`}
									class="text-xl font-semibold tracking-tight text-ink"
								>
									{TIPOLOGI_LABELS[item.tipologi]}
								</h2>
								<p class="mt-1 text-[14.5px] leading-6 text-ink-2">
									{item.ringkas} <span class="text-ink">Fokus: {item.fokus}</span>
								</p>
							</div>
							<button type="button" class="btn btn-sm gap-1.5" onclick={() => salin(item)}>
								{#if tersalin === item.tipologi}<Check size={14} /> Tersalin{:else}<Copy
										size={14}
									/> Salin rekomendasi{/if}
							</button>
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-1.5">
							{#if !agregat}
								<span class="shimmer h-7 w-40"></span>
							{:else if kawasan.length === 0}
								<span class="text-[12.5px] text-muted"
									>Belum ada kawasan pada tipologi ini di data saat ini.</span
								>
							{:else}
								{#each kawasan as k (k.kawasan_id)}
									<a
										href={`/peta?kawasan=${encodeURIComponent(k.kawasan_id)}`}
										class="chip gap-1.5"
									>
										<MapPinned size={12} />
										{k.nama}
									</a>
								{/each}
							{/if}
						</div>
					</div>

					{#if aksi.length === 0}
						<p class="mt-4 text-[13px] text-muted">
							Tidak ada langkah khusus untuk pihak ini pada tipologi ini.
						</p>
					{:else}
						<div class="mt-5 grid gap-4 md:grid-cols-2">
							{#each aksi as blok (blok.pihak)}
								<div class="card p-4">
									<h3 class="text-[13.5px] font-semibold text-ink">
										{PIHAK.find((p) => p.id === blok.pihak)?.label}
									</h3>
									<ul class="mt-2 space-y-1.5 text-[13.5px] leading-6 text-ink-2">
										{#each blok.langkah as langkah, i (i)}
											<li class="flex gap-2">
												<span class="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2"
												></span><span>{langkah}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>
	</div>
</div>
