<script lang="ts">
	import { goto } from '$app/navigation';
	import AngkaNaik from '$lib/components/AngkaNaik.svelte';
	import {
		fetchMapidActivities,
		getUserAvatar,
		type MapidActivity
	} from '$lib/data/mapidActivities';
	import { mapStore } from '$lib/stores/map.svelte';
	import { masukDialog, pudar } from '$lib/utils/motion';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Image from '@lucide/svelte/icons/image';
	import Images from '@lucide/svelte/icons/images';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import UserRound from '@lucide/svelte/icons/user-round';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	let activities = $state<MapidActivity[]>([]);
	let loading = $state(true);
	let refreshing = $state(false);
	let errorMsg = $state<string | null>(null);

	let searchQuery = $state('');
	let selectedSurveyor = $state('semua');
	let sortBy = $state<'terbaru' | 'terlama' | 'judul'>('terbaru');
	let activeTab = $state<'temuan' | 'protokol'>('temuan');

	let lightboxItem = $state<MapidActivity | null>(null);
	let lightboxFotoIdx = $state(0);

	async function muatData(force = false) {
		if (force) refreshing = true;
		else loading = true;
		errorMsg = null;
		try {
			activities = await fetchMapidActivities({ forceRefresh: force });
		} catch {
			errorMsg = 'Data observasi belum dapat dimuat. Coba segarkan beberapa saat lagi.';
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	$effect(() => {
		muatData(false);
	});

	const daftarSurveyor = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- map lokal, bukan state reaktif
		const map = new Map<string, string>();
		for (const a of activities)
			if (a.user_name) map.set(a.user_name, a.user_full_name || a.user_name);
		return Array.from(map.entries()).map(([username, fullname]) => ({ username, fullname }));
	});

	const stats = $derived({
		totalTitik: activities.length,
		totalFoto: activities.reduce((acc, a) => acc + (a.medias?.length || 0), 0),
		totalSurveyor: daftarSurveyor.length
	});

	const filteredActivities = $derived.by(() => {
		let res = [...activities];
		if (selectedSurveyor !== 'semua') res = res.filter((a) => a.user_name === selectedSurveyor);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			res = res.filter(
				(a) =>
					a.title.toLowerCase().includes(q) ||
					a.description.toLowerCase().includes(q) ||
					(a.user_full_name && a.user_full_name.toLowerCase().includes(q))
			);
		}
		if (sortBy === 'terbaru')
			res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		else if (sortBy === 'terlama')
			res.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
		else res.sort((a, b) => a.title.localeCompare(b.title, 'id'));
		return res;
	});

	function formatTanggal(iso: string): string {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function bukaDiPeta(item: MapidActivity) {
		mapStore.surveyTarget = { lnglat: item.geometry.coordinates, zoom: 16, activityId: item._id };
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
		if (!lightboxItem?.medias?.length) return;
		const len = lightboxItem.medias.length;
		lightboxFotoIdx = (lightboxFotoIdx + arah + len) % len;
	}
</script>

<svelte:head>
	<title>Survey lapangan</title>
	<meta
		name="description"
		content="Dokumentasi observasi lapangan tim Devunder di kawasan stasiun MRT dan halte TransJakarta, ditarik langsung dari MAPID."
	/>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (!lightboxItem) return;
		if (e.key === 'Escape') tutupLightbox();
		if (e.key === 'ArrowRight') navigasiLightbox(1);
		if (e.key === 'ArrowLeft') navigasiLightbox(-1);
	}}
/>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
	<header class="masuk flex flex-wrap items-end justify-between gap-4" style="--i: 0">
		<div class="max-w-3xl">
			<h1 class="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
				Survey lapangan
			</h1>
			<p class="mt-2 text-[15px] leading-7 text-ink-2">
				Observasi tim Devunder pada 13 sampai 30 Agustus 2026 di delapan kawasan koridor MRT dan
				simpul integrasi antarmoda. Data ditarik langsung dari MAPID dan menjadi bahan validasi skor
				friksi dan keramaian.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-sm gap-1.5"
				onclick={() => muatData(true)}
				disabled={refreshing || loading}
			>
				<RefreshCw size={14} class={refreshing ? 'animate-spin' : ''} />
				{refreshing ? 'Menyegarkan' : 'Segarkan'}
			</button>
			<a href="/peta" class="btn btn-primary btn-sm gap-1.5"><MapPinned size={14} /> Buka peta</a>
		</div>
	</header>

	<dl class="masuk mt-6 grid grid-cols-3 gap-3" style="--i: 1" aria-live="polite">
		<div class="card p-4">
			<dt class="label flex items-center gap-1.5"><MapPin size={13} /> Titik observasi</dt>
			<dd class="num mt-1 text-[22px]">
				{#if loading}<span class="shimmer inline-block h-6 w-12"></span>{:else}<AngkaNaik
						nilai={stats.totalTitik}
					/>{/if}
			</dd>
		</div>
		<div class="card p-4">
			<dt class="label flex items-center gap-1.5"><Images size={13} /> Foto lapangan</dt>
			<dd class="num mt-1 text-[22px]">
				{#if loading}<span class="shimmer inline-block h-6 w-12"></span>{:else}<AngkaNaik
						nilai={stats.totalFoto}
					/>{/if}
			</dd>
		</div>
		<div class="card p-4">
			<dt class="label flex items-center gap-1.5"><UserRound size={13} /> Surveyor</dt>
			<dd class="num mt-1 text-[22px]">
				{#if loading}<span class="shimmer inline-block h-6 w-12"></span>{:else}<AngkaNaik
						nilai={stats.totalSurveyor}
					/>{/if}
			</dd>
		</div>
	</dl>

	<div class="masuk mt-6 flex gap-1 border-b border-line" style="--i: 2" role="tablist">
		<button
			type="button"
			role="tab"
			aria-selected={activeTab === 'temuan'}
			class={`-mb-px border-b-2 px-3 py-2.5 text-sm ${activeTab === 'temuan' ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-ink-2 hover:text-ink'}`}
			onclick={() => (activeTab = 'temuan')}
		>
			Hasil observasi {#if !loading}<span class="num text-muted">({filteredActivities.length})</span
				>{/if}
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={activeTab === 'protokol'}
			class={`-mb-px border-b-2 px-3 py-2.5 text-sm ${activeTab === 'protokol' ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-ink-2 hover:text-ink'}`}
			onclick={() => (activeTab = 'protokol')}
		>
			Rencana dan protokol
		</button>
	</div>

	{#if activeTab === 'temuan'}
		<div class="masuk mt-5 flex flex-wrap items-center gap-3" style="--i: 3">
			<div class="relative min-w-[240px] flex-1 sm:max-w-md">
				<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
					><Search size={15} /></span
				>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Cari judul, narasi, atau surveyor"
					class="input pl-9"
					aria-label="Cari observasi"
				/>
			</div>
			<label class="label flex items-center gap-2">
				Surveyor
				<select bind:value={selectedSurveyor} class="input h-8 w-auto text-[13px]">
					<option value="semua">Semua</option>
					{#each daftarSurveyor as s (s.username)}<option value={s.username}>{s.fullname}</option
						>{/each}
				</select>
			</label>
			<label class="label flex items-center gap-2">
				Urutkan
				<select bind:value={sortBy} class="input h-8 w-auto text-[13px]">
					<option value="terbaru">Terbaru</option>
					<option value="terlama">Terlama</option>
					<option value="judul">Judul A sampai Z</option>
				</select>
			</label>
		</div>

		{#if loading}
			<div
				class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				aria-label="Memuat observasi"
			>
				{#each [1, 2, 3, 4, 5, 6] as i (i)}<div class="shimmer h-80"></div>{/each}
			</div>
		{:else if errorMsg}
			<p
				class="mt-5 rounded-[8px] border border-signal/30 bg-signal-soft px-3.5 py-3 text-sm text-ink"
			>
				{errorMsg}
			</p>
		{:else if filteredActivities.length === 0}
			<div class="card mt-5 p-10 text-center">
				<p class="font-semibold text-ink">Tidak ada observasi yang cocok</p>
				<p class="mt-1 text-[13px] text-muted">Ubah kata kunci atau pilih surveyor lain.</p>
				<button
					type="button"
					class="btn btn-sm mt-4"
					onclick={() => {
						searchQuery = '';
						selectedSurveyor = 'semua';
					}}>Hapus filter</button
				>
			</div>
		{:else}
			<div
				class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				data-testid="survey-cards"
			>
				{#each filteredActivities as item, i (item._id)}
					{@const avatar = getUserAvatar(item.user_profile_picture)}
					<article
						class="masuk card flex flex-col overflow-hidden"
						style={`--i: ${Math.min(i, 8)}`}
					>
						<div class="relative h-44 w-full bg-line-2">
							{#if item.medias && item.medias.length > 0}
								<button
									type="button"
									class="block h-full w-full"
									onclick={() => bukaLightbox(item, 0)}
									aria-label={`Perbesar foto ${item.title}`}
								>
									<img
										src={item.medias[0]}
										alt={item.title}
										class="h-full w-full object-cover"
										loading="lazy"
									/>
								</button>
								{#if item.medias.length > 1}
									<span
										class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-[6px] bg-ink/80 px-1.5 py-0.5 text-[11px] font-medium text-white"
										><Image size={12} /> {item.medias.length}</span
									>
								{/if}
							{:else}
								<div class="grid h-full place-items-center text-[12.5px] text-muted">
									Tanpa foto
								</div>
							{/if}
						</div>
						<div class="flex flex-1 flex-col p-4">
							<div class="flex items-center gap-2">
								{#if avatar}
									<img
										src={avatar}
										alt=""
										class="h-6 w-6 rounded-full border border-line object-cover"
										loading="lazy"
									/>
								{:else}
									<span
										class="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white"
										>{(item.user_full_name || item.user_name || 'S')
											.slice(0, 1)
											.toUpperCase()}</span
									>
								{/if}
								<div class="min-w-0 flex-1 text-[11.5px]">
									<span class="block truncate font-medium text-ink"
										>{item.user_full_name || item.user_name}</span
									>
									<span class="text-muted">{formatTanggal(item.created_at)}</span>
								</div>
							</div>
							<h2 class="mt-2.5 line-clamp-2 text-[14px] font-semibold text-ink">{item.title}</h2>
							<p class="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-5 text-ink-2">
								{item.description}
							</p>
							<div class="mt-3 flex items-center justify-between border-t border-line-2 pt-3">
								<span class="num text-[11px] text-muted"
									>{item.geometry.coordinates[1].toFixed(4)}, {item.geometry.coordinates[0].toFixed(
										4
									)}</span
								>
								<button type="button" class="btn btn-sm gap-1.5" onclick={() => bukaDiPeta(item)}
									><MapPinned size={13} /> Lihat di peta</button
								>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="prose-tw masuk mt-6 max-w-3xl space-y-8" style="--i: 3">
			<section>
				<h2 class="text-xl font-semibold tracking-tight text-ink">Tujuan</h2>
				<p class="mt-2">
					Melengkapi data mission MAPID (Menu Go, Struk Go) dengan observasi lapangan di kawasan
					stasiun terpilih: memverifikasi keberadaan dan jenis lapak, memotret kondisi trotoar, dan
					mencatat jam ramai sebagai bahan validasi skor friksi dan tipologi.
				</p>
			</section>
			<section>
				<h2 class="text-xl font-semibold tracking-tight text-ink">Empat kategori pengamatan</h2>
				<table class="mt-3 w-full text-left text-[14px]">
					<thead class="text-[12.5px] text-muted"
						><tr
							><th class="py-1.5 pr-3 font-medium">Kategori</th><th class="py-1.5 pr-3 font-medium"
								>Kuota per kawasan</th
							><th class="py-1.5 font-medium">Yang didokumentasikan</th></tr
						></thead
					>
					<tbody class="divide-y divide-line-2">
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Ekonomi informal dan keramaian</td><td
								class="num py-2 pr-3">5 titik</td
							><td class="py-2"
								>Gerobak, warung tenda, kaki lima; jumlah pembeli; pola menetap atau berkeliling</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Friksi jalur pejalan kaki</td><td
								class="num py-2 pr-3">3 titik</td
							><td class="py-2"
								>Trotoar tertutup lapak atau parkir, penyempitan jalur, jalur pemandu terputus</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Akses dan konektivitas</td><td
								class="num py-2 pr-3">3 titik</td
							><td class="py-2">Penyeberangan, ramp, titik perpindahan moda, pangkalan ojek</td></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Pengalaman pengguna</td><td
								class="num py-2 pr-3">2 titik</td
							><td class="py-2"
								>Kepadatan jam sibuk, antrean, kondisi halte, papan informasi, penerangan</td
							></tr
						>
					</tbody>
				</table>
			</section>
			<section>
				<h2 class="text-xl font-semibold tracking-tight text-ink">Ketentuan</h2>
				<ul class="mt-2 space-y-2">
					<li>Koordinat dikunci tepat di lokasi objek; aplikasi pemalsu lokasi dilarang.</li>
					<li>
						Foto diambil langsung di lokasi saat pengamatan. Foto lama, foto internet, dan gambar
						buatan AI tidak dipakai.
					</li>
					<li>
						Wajah dan pelat nomor tidak dijadikan objek utama dan diburamkan pada tahap pengolahan.
					</li>
					<li>Satu objek dicatat satu kali; pendataan ulang hanya bila kondisinya berubah.</li>
					<li>
						Seluruh titik diambil dari akun terdaftar dan diperiksa ulang tim sebelum dipakai
						analisis.
					</li>
				</ul>
			</section>
			<section>
				<h2 class="text-xl font-semibold tracking-tight text-ink">Cakupan</h2>
				<p class="mt-2">
					Delapan kawasan: Lebak Bulus, Fatmawati, Blok M, Senayan, Bendungan Hilir, Dukuh Atas dan
					Sudirman, Bundaran HI, serta Tanah Abang, dengan radius pengamatan 400 sampai 800 meter
					dari tiap simpul. Hasil survey masuk lewat pipeline yang sama tanpa perubahan kode.
				</p>
			</section>
		</div>
	{/if}
</div>

{#if lightboxItem}
	{@const medias = lightboxItem.medias || []}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
		role="dialog"
		aria-modal="true"
		aria-label={`Foto ${lightboxItem.title}`}
		transition:pudar
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={tutupLightbox}
			aria-label="Tutup"
		></button>
		<div
			class="panel-float relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden"
			transition:masukDialog
		>
			<div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
				<div class="min-w-0">
					<h3 class="truncate text-[14px] font-semibold text-ink">{lightboxItem.title}</h3>
					<p class="text-[12px] text-muted">
						{lightboxItem.user_full_name || lightboxItem.user_name}, {formatTanggal(
							lightboxItem.created_at
						)}
					</p>
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-sm h-8 w-8 px-0"
					onclick={tutupLightbox}
					aria-label="Tutup"><X size={16} /></button
				>
			</div>
			<div class="relative flex items-center justify-center bg-ink p-2">
				{#if medias.length > 0}
					<img
						src={medias[lightboxFotoIdx]}
						alt={lightboxItem.title}
						class="max-h-[60vh] w-auto max-w-full rounded-[6px] object-contain"
					/>
				{/if}
				{#if medias.length > 1}
					<button
						type="button"
						class="absolute left-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink hover:bg-white"
						onclick={() => navigasiLightbox(-1)}
						aria-label="Foto sebelumnya"><ChevronLeft size={18} /></button
					>
					<button
						type="button"
						class="absolute right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink hover:bg-white"
						onclick={() => navigasiLightbox(1)}
						aria-label="Foto berikutnya"><ChevronRight size={18} /></button
					>
					<span class="num absolute bottom-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px]"
						>{lightboxFotoIdx + 1} / {medias.length}</span
					>
				{/if}
			</div>
			<div class="border-t border-line p-4">
				<p class="text-[13.5px] leading-6 text-ink-2">{lightboxItem.description}</p>
				<div class="mt-3 flex items-center justify-between border-t border-line-2 pt-3">
					<span class="num text-[11.5px] text-muted"
						>{lightboxItem.geometry.coordinates[1].toFixed(5)}, {lightboxItem.geometry.coordinates[0].toFixed(
							5
						)}</span
					>
					<button
						type="button"
						class="btn btn-primary btn-sm gap-1.5"
						onclick={() => {
							if (lightboxItem) bukaDiPeta(lightboxItem);
						}}><MapPinned size={13} /> Buka lokasi di peta</button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
