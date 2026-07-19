<script lang="ts">
	import { apiBase } from '$lib/ai/api';
	import { onMount } from 'svelte';

	interface HealthInfo {
		data_version: string;
		llm: { provider: string; model: string };
	}

	// Transparansi model aktif (blueprint 6.4): fetch ringan ke /api/health.
	let health = $state<HealthInfo | null>(null);
	onMount(async () => {
		try {
			const res = await fetch(`${apiBase()}/api/health`);
			if (res.ok) health = (await res.json()) as HealthInfo;
		} catch {
			health = null;
		}
	});
</script>

<svelte:head>
	<title>Metodologi — TransitWarga</title>
	<meta
		name="description"
		content="Sumber data, pipeline, metode analisis spasial, batasan, dan penjelasan penggunaan AI di TransitWarga"
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10">
	<h1 class="text-3xl font-bold text-slate-900">Metodologi</h1>

	<section class="mt-8" aria-labelledby="sumber-data">
		<h2 id="sumber-data" class="text-xl font-bold text-slate-900">Sumber data</h2>
		<ul class="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
			<li>
				<strong>Data mission MAPID</strong> (inti): Menu Go (titik usaha makanan informal + atribut +
				foto) dan Struk Go (transaksi riil + metode pembayaran). Pendukung: Community Maps activities
				dan Properti Go (konteks relokasi).
			</li>
			<li>
				<strong>Referensi stasiun/halte</strong>: titik stasiun MRT koridor Lebak Bulus–Bundaran HI
				dan halte TransJakarta terpilih, dari sumber publik resmi operator.
			</li>
			<li>
				<strong>Basemap</strong>: MAPID MAPS (MapLibre GL). Data mentah mission tidak dipublikasikan
				— situs ini hanya melayani hasil olahan (tiles &amp; parquet agregat).
			</li>
		</ul>
	</section>

	<section class="mt-8" aria-labelledby="pipeline">
		<h2 id="pipeline" class="text-xl font-bold text-slate-900">Pipeline data</h2>
		<p class="mt-2 text-sm leading-relaxed text-slate-600">
			Seluruh analisis dikerjakan offline oleh pipeline Python yang reproducible (satu perintah
			<code class="rounded bg-slate-100 px-1">make build-data</code>), lalu dipanggang menjadi
			artefak statis ber-<code class="rounded bg-slate-100 px-1">data_version</code>:
		</p>
		<ol class="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
			<li>
				<strong>Pembersihan</strong> — standardisasi kolom, cast koordinat teks, parse tanggal/jam multi-format,
				normalisasi enum, dedup, buang koordinat invalid.
			</li>
			<li>
				<strong>AI vision (batch)</strong> — klasifikasi foto lapak: jenis, okupansi trotoar (0–2), kondisi
				(1–5), beserta confidence.
			</li>
			<li>
				<strong>Analisis spasial</strong> — buffer 400/800 m per stasiun (proyeksi EPSG:32748), spatial
				join semua titik, perhitungan skor, dan penentuan tipologi.
			</li>
			<li>
				<strong>Export</strong> — PMTiles (tippecanoe) untuk layer peta, GeoParquet untuk analitik DuckDB-WASM
				di browser, dan agregat.json sebagai digest AI.
			</li>
		</ol>
	</section>

	<section class="mt-8" aria-labelledby="metode">
		<h2 id="metode" class="text-xl font-bold text-slate-900">Metode skor &amp; tipologi</h2>
		<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
			<li>
				<strong>Skor kepadatan</strong>: jumlah usaha dalam 400 m, dinormalisasi min-max 0–100 antar
				kawasan.
			</li>
			<li>
				<strong>Skor keramaian</strong>: rata-rata tingkat keramaian pengamatan (sepi=0, sedang=50,
				ramai=100).
			</li>
			<li>
				<strong>Skor digital</strong>: persentase transaksi non-tunai (QRIS/debit/kredit/e-wallet).
			</li>
			<li>
				<strong>Skor friksi</strong>: campuran okupansi trotoar hasil AI vision dan kepadatan
				(50:50); sebelum data vision tersedia, memakai kepadatan.
			</li>
			<li>
				<strong>Tipologi rule-based</strong> dengan ambang eksplisit (kepadatan &lt; 25 → sepi; ≥ 60 dan
				friksi ≥ 60 → padat &amp; friksi; ≥ 60 dan digital &lt; 40 → prioritas digitalisasi; ≥ 60 lainnya
				→ kuliner matang; sisanya → potensi). Ambang adalah konstanta yang mudah dikalibrasi saat data
				survey penuh masuk; clustering statistik menyusul bila sampel mencukupi.
			</li>
		</ul>
	</section>

	<section class="mt-8" aria-labelledby="ai">
		<h2 id="ai" class="text-xl font-bold text-slate-900">Penggunaan AI</h2>
		<dl class="mt-2 space-y-3 text-sm leading-relaxed text-slate-600">
			<div>
				<dt class="font-semibold text-slate-800">Input</dt>
				<dd>
					Chat &amp; ringkasan: hanya digest statistik agregat per kawasan (angka yang juga Anda
					lihat di layar) — bukan data mentah. Vision: foto lapak hasil mission (wajah/pelat di-blur
					lebih dulu).
				</dd>
			</div>
			<div>
				<dt class="font-semibold text-slate-800">Proses</dt>
				<dd>
					Model diminta menjawab dalam skema JSON ketat. Pertanyaan pengguna diperlakukan sebagai
					data (bukan instruksi sistem). Vision berjalan batch saat build, bukan saat Anda memakai
					situs.
				</dd>
			</div>
			<div>
				<dt class="font-semibold text-slate-800">Output</dt>
				<dd>
					Narasi teks murni + (opsional) aksi peta dari whitelist:
					<code class="rounded bg-slate-100 px-1">highlight_kawasan</code>,
					<code class="rounded bg-slate-100 px-1">zoom_to</code>,
					<code class="rounded bg-slate-100 px-1">set_filter</code>,
					<code class="rounded bg-slate-100 px-1">compare</code>.
				</dd>
			</div>
			<div>
				<dt class="font-semibold text-slate-800">Validasi</dt>
				<dd>
					Semua output AI divalidasi skema (Zod) di server; aksi dengan target di luar daftar
					kawasan dibuang. Hasil vision ber-confidence &lt; 0,6 masuk daftar review manual. Narasi
					tidak pernah dirender sebagai HTML.
				</dd>
			</div>
		</dl>
		<p
			class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
			data-testid="model-aktif"
		>
			{#if health}
				Model aktif saat ini: <strong>{health.llm.provider}</strong> / {health.llm.model} · versi data
				{health.data_version}. Provider dapat diganti lewat konfigurasi tanpa perubahan kode.
			{:else}
				Info model aktif tidak dapat dimuat (API sedang tidak terjangkau).
			{/if}
		</p>
	</section>

	<section class="mt-8" aria-labelledby="batasan">
		<h2 id="batasan" class="text-xl font-bold text-slate-900">Batasan</h2>
		<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
			<li>
				Sampel data tahap awal masih kecil dan tidak merata antar kawasan; skor dinormalisasi antar
				kawasan sehingga peka terhadap penambahan data.
			</li>
			<li>
				Selama pengembangan, data sintetis dipakai sebagai pengganti sample mission; seluruh angka
				akan diperbarui otomatis saat data survey resmi masuk ke pipeline.
			</li>
			<li>
				Koordinat pencatatan lapangan memiliki galat GPS ±10–20 m — memadai untuk buffer 400/800 m,
				tidak untuk analisis persil.
			</li>
			<li>
				Klasifikasi AI vision bersifat estimasi; nilai ber-confidence rendah ditinjau manual sebelum
				dipakai menghitung skor friksi.
			</li>
		</ul>
	</section>
</div>
