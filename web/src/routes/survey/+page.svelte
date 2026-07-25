<script lang="ts">
	import GaleriSurvey from '$lib/components/GaleriSurvey.svelte';
</script>

<svelte:head>
	<title>Survey — TransitWarga</title>
	<meta
		name="description"
		content="Dokumentasi rencana dan protokol survey lapangan TransitWarga (mission MAPID: Menu Go, Struk Go, Community Maps)"
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10">
	<h1 class="anim-masuk text-3xl font-bold tracking-tight text-slate-900">
		Dokumentasi Survey Lapangan
	</h1>
	<!-- <p
		class="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800"
		data-testid="survey-status"
	>
		Status: struktur dokumentasi — akan diisi hasil survey activities setelah tahap kurasi 50 tim.
		Saat ini aplikasi berjalan di atas data sample &amp; fixtures pengembangan.
	</p> -->

	<section class="mt-8">
		<h2 class="text-xl font-bold text-slate-900">Tujuan</h2>
		<p class="mt-2 text-sm leading-relaxed text-slate-600">
			Melengkapi data mission MAPID (Menu Go, Struk Go) dengan observasi lapangan di kawasan stasiun
			terpilih: memverifikasi keberadaan dan jenis lapak, memotret kondisi trotoar, dan mencatat jam
			ramai — bahan validasi untuk skor friksi dan tipologi.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="text-xl font-bold text-slate-900">Protokol pencatatan</h2>
		<ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
			<li>
				<strong>Menu Go</strong> — satu entri per tempat makan informal: nama, jenis tempat (dropdown),
				menu andalan, harga rata-rata per porsi, tingkat keramaian, mobilitas, dan foto.
			</li>
			<li>
				<strong>Struk Go</strong> — foto struk belanja di sekitar stasiun sebagai sampel transaksi riil:
				merchant, kategori, tanggal-jam, metode pembayaran.
			</li>
			<li>
				<strong>Community Maps / Activities</strong> — aktivitas penataan, festival, atau kejadian relevan
				di kawasan (judul, deskripsi, koordinat).
			</li>
			<li>
				Setiap titik dicatat dari lokasi sebenarnya (GPS aktif), pada rentang jam sibuk pagi
				(06.30–09.00) dan sore (16.30–19.30) untuk menangkap keramaian puncak.
			</li>
		</ol>
	</section>

	<section class="mt-8">
		<h2 class="text-xl font-bold text-slate-900">Etika &amp; privasi</h2>
		<ul class="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
			<li>Meminta izin pedagang sebelum memotret lapak dari dekat.</li>
			<li>
				Wajah dan pelat nomor di-blur pada tahap pembersihan data sebelum foto dipakai pipeline —
				tidak ada data pribadi sensitif yang dipublikasikan.
			</li>
			<li>Data mentah mission tidak pernah dipublikasikan; hanya hasil olahan agregat.</li>
		</ul>
	</section>

	<section class="mt-8">
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

	<GaleriSurvey />
</div>
