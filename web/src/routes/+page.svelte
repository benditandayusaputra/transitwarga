<script lang="ts">
	import AngkaNaik from '$lib/components/AngkaNaik.svelte';
	import { loadAgregat } from '$lib/data/agregat';
	import { formatAngka, formatPersen } from '$lib/utils/format';
	import type { AgregatPayload } from '$lib/types';

	let agregat = $state<AgregatPayload | null>(null);
	$effect(() => {
		loadAgregat()
			.then((a) => (agregat = a))
			.catch(() => (agregat = null));
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
</script>

<svelte:head>
	<title>TransitWarga — Ekonomi Informal di Ekosistem Transit Jakarta</title>
	<meta
		name="description"
		content="WebGIS yang memetakan PKL, gerobak, dan warung tenda di sekitar stasiun MRT dan halte TransJakarta, lalu menghubungkannya dengan pengalaman first/last mile penumpang."
	/>
</svelte:head>

<section class="hero-pola">
	<div class="mx-auto max-w-6xl px-4 py-16 md:py-24">
		<p class="anim-masuk text-primary-700 text-sm font-semibold tracking-wide uppercase">
			MAPID WebGIS Competition 2026 · Maps That Think!
		</p>
		<h1
			class="anim-masuk mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
		>
			Warung kecil menghidupkan stasiun. Data membantu menatanya.
		</h1>
		<p class="anim-masuk-lambat mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
			TransitWarga memetakan ekonomi informal - kaki lima, gerobak, warung tenda - di sekitar
			stasiun MRT dan halte TransJakarta, lalu menghubungkannya dengan pengalaman
			<em>first/last mile</em> penumpang. Hasilnya: tipologi kawasan dan rekomendasi kebijakan yang bisa
			langsung ditindaklanjuti.
		</p>
		<div class="anim-masuk-lambat mt-8 flex flex-wrap gap-3">
			<a
				href="/peta"
				class="from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary-600/25 rounded-xl bg-linear-to-r px-6 py-3 font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
				data-testid="cta-peta"
			>
				Jelajahi Peta
			</a>
			<a
				href="/analisis"
				class="border-primary-200 text-primary-700 hover:border-primary-600 hover:bg-primary-50 rounded-xl border bg-white/70 px-6 py-3 font-semibold transition-colors"
			>
				Lihat Analisis
			</a>
		</div>

		<!-- Insight langsung dari data terolah (tinggi tetap: tanpa layout shift) -->
		<dl class="mt-12 grid min-h-20 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4" aria-live="polite">
			{#if insight}
				<div>
					<dt class="text-xs text-slate-500">Kawasan dianalisis</dt>
					<dd class="text-primary-800 mt-0.5 text-2xl font-bold">
						<AngkaNaik nilai={insight.kawasan} format={formatAngka} />
					</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">Titik usaha terpetakan</dt>
					<dd class="text-primary-800 mt-0.5 text-2xl font-bold">
						<AngkaNaik nilai={insight.totalUsaha} format={formatAngka} />
					</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">Rata-rata transaksi digital</dt>
					<dd class="text-primary-800 mt-0.5 text-2xl font-bold">
						<AngkaNaik nilai={insight.rataDigital} format={formatPersen} />
					</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">Kawasan perlu penataan</dt>
					<dd class="text-primary-800 mt-0.5 text-2xl font-bold">
						<AngkaNaik nilai={insight.perluPenataan} format={formatAngka} />
					</dd>
				</div>
			{:else}
				{#each [0, 1, 2, 3] as i (i)}
					<div>
						<div class="shimmer h-3 w-24 rounded-full"></div>
						<div class="shimmer mt-2 h-7 w-14 rounded-lg"></div>
					</div>
				{/each}
			{/if}
		</dl>
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 py-14">
	<h2 class="text-2xl font-bold text-slate-900">Masalahnya</h2>
	<div class="mt-6 grid gap-6 md:grid-cols-3">
		<div class="rounded-xl border border-slate-200 p-5">
			<h3 class="font-semibold text-slate-900">Tak terlihat di peta kebijakan</h3>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">
				Pedagang informal menghidupi ribuan penumpang setiap hari, tetapi jarang masuk basis data
				resmi. Penataan sering dilakukan tanpa data: digusur dari satu titik, muncul di titik lain.
			</p>
		</div>
		<div class="rounded-xl border border-slate-200 p-5">
			<h3 class="font-semibold text-slate-900">Friksi di jalur pejalan kaki</h3>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">
				Di beberapa kawasan, lapak menempati trotoar sempit dan memperlambat akses penumpang ke
				stasiun — masalah first/last mile yang nyata namun jarang terukur.
			</p>
		</div>
		<div class="rounded-xl border border-slate-200 p-5">
			<h3 class="font-semibold text-slate-900">Kesenjangan digitalisasi</h3>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">
				Sebagian pedagang sudah menerima QRIS, sebagian masih tunai sepenuhnya. Tanpa peta inklusi
				digital, program QRIS sulit menyasar kawasan yang paling membutuhkan.
			</p>
		</div>
	</div>
</section>

<section class="border-t border-slate-100 bg-slate-50">
	<div class="mx-auto max-w-6xl px-4 py-14">
		<h2 class="text-2xl font-bold text-slate-900">Apa yang TransitWarga lakukan</h2>
		<div class="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-3xl font-bold text-primary-700">400/800 m</p>
				<p class="mt-1 text-sm text-slate-600">
					Buffer kawasan di sekitar setiap stasiun/halte; semua titik usaha dan transaksi dianalisis
					spasial di dalamnya.
				</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-primary-700">5 tipologi</p>
				<p class="mt-1 text-sm text-slate-600">
					Kuliner matang, padat &amp; friksi, potensi, prioritas digitalisasi, dan sepi — dihitung
					dari skor kepadatan, keramaian, digital, dan friksi trotoar.
				</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-primary-700">AI di peta</p>
				<p class="mt-1 text-sm text-slate-600">
					Klik stasiun untuk ringkasan AI; tanya kebijakan lewat chat dan peta ikut bergerak —
					jawaban selalu dibatasi data yang ada.
				</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-primary-700">100% di browser</p>
				<p class="mt-1 text-sm text-slate-600">
					Analitik berjalan lokal via DuckDB-WASM di atas file statis — cepat, hemat biaya, dan
					datanya tidak ke mana-mana.
				</p>
			</div>
		</div>
		<a
			href="/rekomendasi"
			class="mt-8 inline-block text-sm font-semibold text-primary-700 underline underline-offset-4"
		>
			Lihat rekomendasi kebijakan per tipologi →
		</a>
	</div>
</section>
