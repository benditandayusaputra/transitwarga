<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import {
		fetchMapidActivities,
		getUserAvatar,
		type MapidActivity
	} from '$lib/data/mapidActivities';
	import { mapStore } from '$lib/stores/map.svelte';

	let activities = $state<MapidActivity[]>([]);
	let loading = $state(true);
	let refreshing = $state(false);
	let errorMsg = $state<string | null>(null);

	let searchQuery = $state('');
	let selectedSurveyor = $state('semua');
	let sortBy = $state<'terbaru' | 'terlama' | 'judul'>('terbaru');
	let activeTab = $state<'temuan' | 'protokol'>('temuan');

	// State Lightbox Modal Foto
	let lightboxItem = $state<MapidActivity | null>(null);
	let lightboxFotoIdx = $state(0);

	async function muatData(force = false) {
		if (force) refreshing = true;
		else loading = true;
		errorMsg = null;
		try {
			const data = await fetchMapidActivities({ forceRefresh: force });
			activities = data;
		} catch (err) {
			console.error(err);
			errorMsg = 'Gagal memuat data aktivitas survei.';
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	$effect(() => {
		muatData(false);
	});

	// Daftar surveyor unik
	const daftarSurveyor = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- map lokal, bukan state reaktif
		const map = new Map<string, string>();
		for (const a of activities) {
			if (a.user_name) {
				map.set(a.user_name, a.user_full_name || a.user_name);
			}
		}
		return Array.from(map.entries()).map(([username, fullname]) => ({
			username,
			fullname
		}));
	});

	// Statistik agregat survei
	const stats = $derived.by(() => {
		const totalFoto = activities.reduce((acc, a) => acc + (a.medias?.length || 0), 0);
		return {
			totalTitik: activities.length,
			totalFoto,
			totalSurveyor: daftarSurveyor.length
		};
	});

	// Filter dan sort aktivitas
	const filteredActivities = $derived.by(() => {
		let res = [...activities];

		if (selectedSurveyor !== 'semua') {
			res = res.filter((a) => a.user_name === selectedSurveyor);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			res = res.filter(
				(a) =>
					a.title.toLowerCase().includes(q) ||
					a.description.toLowerCase().includes(q) ||
					(a.user_full_name && a.user_full_name.toLowerCase().includes(q))
			);
		}

		if (sortBy === 'terbaru') {
			res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		} else if (sortBy === 'terlama') {
			res.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
		} else if (sortBy === 'judul') {
			res.sort((a, b) => a.title.localeCompare(b.title, 'id'));
		}

		return res;
	});

	function formatTanggal(iso: string): string {
		try {
			const d = new Date(iso);
			if (isNaN(d.getTime())) return iso;
			return d.toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function bukaDiPeta(item: MapidActivity) {
		mapStore.surveyTarget = {
			lnglat: item.geometry.coordinates,
			zoom: 16,
			activityId: item._id
		};
		goto('/peta');
	}

	function bukaLightbox(item: MapidActivity, index = 0) {
		lightboxItem = item;
		lightboxFotoIdx = index;
	}

	function tutupLightbox() {
		lightboxItem = null;
		lightboxFotoIdx = 0;
	}

	function navigasiLightbox(arah: 1 | -1) {
		if (!lightboxItem || !lightboxItem.medias?.length) return;
		const len = lightboxItem.medias.length;
		lightboxFotoIdx = (lightboxFotoIdx + arah + len) % len;
	}
</script>

<svelte:head>
	<title>Survey Lapangan (#Devunder) — TransitWarga</title>
	<meta
		name="description"
		content="Hasil observasi dan survei lapangan ekonomi informal TransitWarga terintegrasi langsung dengan MAPID Activities API (#Devunder)."
	/>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (lightboxItem) {
			if (e.key === 'Escape') tutupLightbox();
			if (e.key === 'ArrowRight') navigasiLightbox(1);
			if (e.key === 'ArrowLeft') navigasiLightbox(-1);
		}
	}}
/>

<div class="mx-auto max-w-6xl px-4 py-8 sm:py-10">
	<!-- Header Utama -->
	<header class="anim-masuk border-b border-slate-200 pb-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<div
					class="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</span>
					Live MAPID Activities (#Devunder)
				</div>
				<h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
					Survey &amp; Observasi Lapangan
				</h1>
				<p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
					Dokumentasi spasial hasil observasi lapangan tim <strong>#Devunder</strong> di koridor stasiun
					MRT Jakarta &amp; halte TransJakarta: memvalidasi keramaian, lapak PKL, tata ruang trotoar,
					serta adopsi QRIS.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => muatData(true)}
					disabled={refreshing || loading}
					class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
					title="Segarkan data dari server MAPID"
				>
					<span class={refreshing ? 'animate-spin' : ''}>🔄</span>
					{refreshing ? 'Menyinkronkan…' : 'Segarkan Data'}
				</button>
				<a
					href="/peta"
					class="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
				>
					<Icon name="peta" size={14} />
					Buka Peta Interaktif
				</a>
			</div>
		</div>

		<!-- Ringkasan Statistik -->
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
				<p class="text-xs font-bold text-slate-500">Total Titik Temuan</p>
				<p class="mt-1 text-2xl font-black text-slate-900">
					{loading ? '…' : stats.totalTitik}
				</p>
				<p class="text-[11px] text-slate-400">Koordinat GPS aktual</p>
			</div>
			<div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
				<p class="text-xs font-bold text-slate-500">Foto Lapangan</p>
				<p class="mt-1 text-2xl font-black text-amber-600">
					{loading ? '…' : stats.totalFoto}
				</p>
				<p class="text-[11px] text-slate-400">Dokumentasi visual CDN</p>
			</div>
			<div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
				<p class="text-xs font-bold text-slate-500">Surveyor Kontributor</p>
				<p class="mt-1 text-2xl font-black text-primary-700">
					{loading ? '…' : stats.totalSurveyor}
				</p>
				<p class="text-[11px] text-slate-400">Tim lapangan #Devunder</p>
			</div>
			<div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
				<p class="text-xs font-bold text-slate-500">Koridor Transit</p>
				<p class="mt-1 text-2xl font-black text-emerald-600">8+ Stasiun</p>
				<p class="text-[11px] text-slate-400">MRT &amp; Halte TransJakarta</p>
			</div>
		</div>

		<!-- Tab Navigasi -->
		<div class="mt-6 flex border-b border-slate-200 text-sm font-bold">
			<button
				type="button"
				class={`border-b-2 px-4 py-2.5 transition-colors ${
					activeTab === 'temuan'
						? 'border-slate-950 text-slate-950 font-black'
						: 'border-transparent text-slate-500 hover:text-slate-800'
				}`}
				onclick={() => (activeTab = 'temuan')}
			>
				Hasil Observasi Lapangan ({filteredActivities.length})
			</button>
			<button
				type="button"
				class={`border-b-2 px-4 py-2.5 transition-colors ${
					activeTab === 'protokol'
						? 'border-slate-950 text-slate-950 font-black'
						: 'border-transparent text-slate-500 hover:text-slate-800'
				}`}
				onclick={() => (activeTab = 'protokol')}
			>
				Rencana &amp; Protokol Survey
			</button>
		</div>
	</header>

	{#if activeTab === 'temuan'}
		<!-- Toolbar Filter & Pencarian -->
		<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
			<div class="relative min-w-[260px] flex-1 sm:max-w-md">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari tempat, trotoar, PKL, QRIS, stasiun..."
					class="w-full rounded-xl border border-slate-300 bg-white py-2 pr-4 pl-9 text-xs font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
				/>
				<div
					class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400"
				>
					<Icon name="cari" size={15} />
				</div>
				{#if searchQuery}
					<button
						type="button"
						class="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600"
						onclick={() => (searchQuery = '')}
						aria-label="Bersihkan pencarian"
					>
						<Icon name="tutup" size={13} />
					</button>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2 text-xs">
				<label class="flex items-center gap-1.5 font-bold text-slate-600">
					<span>Surveyor:</span>
					<select
						bind:value={selectedSurveyor}
						class="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
					>
						<option value="semua">Semua Surveyor ({activities.length})</option>
						{#each daftarSurveyor as s (s.username)}
							<option value={s.username}>{s.fullname} (@{s.username})</option>
						{/each}
					</select>
				</label>

				<label class="flex items-center gap-1.5 font-bold text-slate-600">
					<span>Urutkan:</span>
					<select
						bind:value={sortBy}
						class="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
					>
						<option value="terbaru">Terbaru</option>
						<option value="terlama">Terlama</option>
						<option value="judul">Judul (A-Z)</option>
					</select>
				</label>
			</div>
		</div>

		<!-- Grid Daftar Temuan Lapangan -->
		{#if loading}
			<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each [1, 2, 3, 4, 5, 6] as i (i)}
					<div class="shimmer h-80 rounded-2xl"></div>
				{/each}
			</div>
		{:else if errorMsg}
			<p class="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{errorMsg}</p>
		{:else if filteredActivities.length === 0}
			<div class="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
				<p class="text-base font-bold text-slate-700">Tidak ada observasi yang sesuai</p>
				<p class="mt-1 text-xs text-slate-500">
					Coba sesuaikan kata kunci pencarian atau pilih surveyor lain.
				</p>
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						selectedSurveyor = 'semua';
					}}
					class="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
				>
					Reset Filter
				</button>
			</div>
		{:else}
			<div
				class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
				data-testid="survey-cards"
			>
				{#each filteredActivities as item (item._id)}
					{@const avatar = getUserAvatar(item.user_profile_picture)}
					<article
						class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
					>
						<!-- Bagian Foto -->
						<div class="relative h-48 w-full overflow-hidden bg-slate-100">
							{#if item.medias && item.medias.length > 0}
								<img
									src={item.medias[0]}
									alt={item.title}
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
									loading="lazy"
								/>
								<button
									type="button"
									onclick={() => bukaLightbox(item, 0)}
									class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"
									aria-label={`Perbesar foto ${item.title}`}
								>
									<span
										class="rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
									>
										🔎 Perbesar Foto
									</span>
								</button>
								{#if item.medias.length > 1}
									<span
										class="absolute top-2.5 right-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm"
									>
										📷 {item.medias.length} Foto
									</span>
								{/if}
							{:else}
								<div
									class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400"
								>
									Tanpa foto dokumentasi
								</div>
							{/if}
						</div>

						<!-- Konten Kartu -->
						<div class="flex flex-1 flex-col p-4">
							<div class="flex items-center gap-2">
								{#if avatar}
									<img
										src={avatar}
										alt={item.user_full_name || item.user_name}
										class="h-6 w-6 rounded-full object-cover border border-slate-200"
										loading="lazy"
									/>
								{:else}
									<div
										class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700"
									>
										{(item.user_full_name || item.user_name || 'S').slice(0, 1).toUpperCase()}
									</div>
								{/if}
								<div class="min-w-0 flex-1 text-[11px]">
									<span class="block truncate font-bold text-slate-900">
										{item.user_full_name || item.user_name}
									</span>
									<span class="text-[10px] text-slate-400">
										{formatTanggal(item.created_at)}
									</span>
								</div>
							</div>

							<h2
								class="mt-2.5 text-sm font-black text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors"
							>
								{item.title}
							</h2>

							<p
								class="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 line-clamp-3 font-normal"
							>
								{item.description}
							</p>

							<div
								class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]"
							>
								<span class="font-mono text-[10px] text-slate-400">
									[{item.geometry.coordinates[0].toFixed(4)}, {item.geometry.coordinates[1].toFixed(
										4
									)}]
								</span>

								<button
									type="button"
									onclick={() => bukaDiPeta(item)}
									class="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-500/20 transition-colors"
								>
									<Icon name="pin" size={13} />
									Lihat di Peta
								</button>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Tab Rencana & Protokol Survey (Dokumentasi Asli Lengkap) -->
		<div class="anim-masuk mt-8 space-y-8">
			<section>
				<h2 class="text-xl font-bold text-slate-900">Tujuan</h2>
				<p class="mt-2 text-sm leading-relaxed text-slate-600">
					Melengkapi data mission MAPID (Menu Go, Struk Go) dengan observasi lapangan di kawasan
					stasiun terpilih: memverifikasi keberadaan dan jenis lapak, memotret kondisi trotoar, dan
					mencatat jam ramai — bahan validasi untuk skor friksi dan tipologi.
				</p>
			</section>

			<section>
				<h2 class="text-xl font-bold text-slate-900">Protokol pencatatan</h2>
				<ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
					<li>
						<strong>Menu Go</strong> — satu entri per tempat makan informal: nama, jenis tempat (dropdown),
						menu andalan, harga rata-rata per porsi, tingkat keramaian, mobilitas, dan foto.
					</li>
					<li>
						<strong>Struk Go</strong> — foto struk belanja di sekitar stasiun sebagai sampel transaksi
						riil: merchant, kategori, tanggal-jam, metode pembayaran.
					</li>
					<li>
						<strong>Community Maps / Activities</strong> — aktivitas penataan, festival, atau kejadian
						relevan di kawasan (judul, deskripsi, koordinat).
					</li>
					<li>
						Setiap titik dicatat dari lokasi sebenarnya (GPS aktif), pada rentang jam sibuk pagi
						(06.30–09.00) dan sore (16.30–19.30) untuk menangkap keramaian puncak.
					</li>
				</ol>
			</section>

			<section>
				<h2 class="text-xl font-bold text-slate-900">Etika &amp; privasi</h2>
				<ul class="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
					<li>Meminta izin pedagang sebelum memotret lapak dari dekat.</li>
					<li>
						Wajah dan pelat nomor di-blur pada tahap pembersihan data sebelum foto dipakai pipeline
						— tidak ada data pribadi sensitif yang dipublikasikan.
					</li>
					<li>Data mentah mission tidak pernah dipublikasikan; hanya hasil olahan agregat.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-xl font-bold text-slate-900">Rencana cakupan</h2>
				<p class="mt-2 text-sm leading-relaxed text-slate-600">
					Prioritas: 8 stasiun koridor MRT Lebak Bulus–Bundaran HI dan 4 halte TransJakarta
					penghubungnya (daftar lengkap di halaman <a
						class="text-primary-700 underline underline-offset-2"
						href="/peta">peta</a
					>). Target minimal 15 titik Menu Go dan 15 struk per kawasan; hasil survey masuk lewat
					pipeline yang sama (<code class="rounded bg-slate-100 px-1">make build-data</code>) tanpa
					perubahan kode.
				</p>
			</section>
		</div>
	{/if}
</div>

<!-- Lightbox Modal Foto Ukuran Penuh -->
{#if lightboxItem}
	{@const medias = lightboxItem.medias || []}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label={`Foto ${lightboxItem.title}`}
	>
		<!-- Backdrop button -->
		<button
			type="button"
			class="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-default"
			onclick={tutupLightbox}
			aria-label="Tutup modal"
		></button>

		<div
			class="relative z-10 flex max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
		>
			<!-- Header Modal -->
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div class="min-w-0 pr-4">
					<h3 class="truncate text-sm font-black text-slate-900">{lightboxItem.title}</h3>
					<p class="text-[11px] text-slate-500">
						Oleh {lightboxItem.user_full_name || lightboxItem.user_name} • {formatTanggal(
							lightboxItem.created_at
						)}
					</p>
				</div>
				<button
					type="button"
					onclick={tutupLightbox}
					class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
					aria-label="Tutup"
				>
					<Icon name="tutup" size={18} />
				</button>
			</div>

			<!-- Tampilan Foto -->
			<div class="relative flex items-center justify-center bg-slate-950 p-2">
				{#if medias.length > 0}
					<img
						src={medias[lightboxFotoIdx]}
						alt={lightboxItem.title}
						class="max-h-[60vh] w-auto max-w-full rounded-lg object-contain"
					/>
				{/if}

				{#if medias.length > 1}
					<button
						type="button"
						onclick={() => navigasiLightbox(-1)}
						class="absolute left-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90"
						aria-label="Foto sebelumnya"
					>
						‹
					</button>
					<button
						type="button"
						onclick={() => navigasiLightbox(1)}
						class="absolute right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90"
						aria-label="Foto berikutnya"
					>
						›
					</button>
					<span
						class="absolute bottom-4 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-bold text-white"
					>
						{lightboxFotoIdx + 1} / {medias.length}
					</span>
				{/if}
			</div>

			<!-- Footer Deskripsi & Aksi -->
			<div class="border-t border-slate-100 p-4">
				<p class="text-xs leading-relaxed text-slate-700">
					{lightboxItem.description}
				</p>
				<div class="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
					<span class="font-mono text-[10px] text-slate-400">
						Koordinat: {lightboxItem.geometry.coordinates[0].toFixed(5)}, {lightboxItem.geometry.coordinates[1].toFixed(
							5
						)}
					</span>
					<button
						type="button"
						onclick={() => {
							if (lightboxItem) bukaDiPeta(lightboxItem);
						}}
						class="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
					>
						<Icon name="pin" size={13} />
						Buka Lokasi di Peta
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
