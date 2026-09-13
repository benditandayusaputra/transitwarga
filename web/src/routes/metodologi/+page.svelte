<script lang="ts">
	import { apiBase } from '$lib/ai/api';
	import { onMount } from 'svelte';

	interface HealthInfo {
		data_version: string;
		llm: { provider: string; model: string };
	}

	let health = $state<HealthInfo | null>(null);
	let memuatHealth = $state(true);
	onMount(async () => {
		try {
			const res = await fetch(`${apiBase()}/api/health`);
			if (res.ok) health = (await res.json()) as HealthInfo;
		} catch {
			health = null;
		} finally {
			memuatHealth = false;
		}
	});

	const bagian = [
		{ id: 'sumber-data', label: 'Sumber data' },
		{ id: 'pipeline', label: 'Pengolahan data' },
		{ id: 'metode', label: 'Skor dan tipologi' },
		{ id: 'ai', label: 'Penggunaan AI' },
		{ id: 'batasan', label: 'Batasan' }
	];
	const PROVIDER: Record<string, string> = {
		google: 'Google Gemini',
		anthropic: 'Anthropic Claude',
		openai: 'OpenAI',
		mock: 'Mode uji tanpa model'
	};
</script>

<svelte:head>
	<title>Metodologi</title>
	<meta
		name="description"
		content="Sumber data, tahap pengolahan, metode skor dan tipologi, batasan, serta penjelasan penggunaan AI di TransitWarga."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
	<header class="masuk max-w-3xl" style="--i: 0">
		<h1 class="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Metodologi</h1>
		<p class="mt-2 text-[15px] leading-7 text-ink-2">
			Setiap angka di situs ini bisa ditelusuri: dari sumber data, tahap pengolahan, rumus skor,
			sampai model AI yang sedang dipakai.
		</p>
	</header>

	<div class="mt-8 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
		<nav
			class="masuk hidden self-start lg:sticky lg:top-20 lg:block"
			style="--i: 1"
			aria-label="Isi halaman"
		>
			<ol class="space-y-1">
				{#each bagian as b (b.id)}
					<li>
						<a
							href={`#${b.id}`}
							class="block rounded-[6px] px-2 py-1.5 text-[13px] text-ink-2 hover:bg-line-2 hover:text-ink"
							>{b.label}</a
						>
					</li>
				{/each}
			</ol>
			<div
				class="mt-6 rounded-[8px] border border-line bg-surface p-3.5"
				data-testid="model-aktif"
				aria-busy={memuatHealth}
			>
				<p class="label">Model AI aktif</p>
				{#if memuatHealth}
					<div class="shimmer mt-2 h-4 w-3/4"></div>
					<div class="shimmer mt-1.5 h-3 w-1/2"></div>
				{:else if health}
					<p class="mt-1 text-[13.5px] font-semibold text-ink">
						{PROVIDER[health.llm.provider] ?? health.llm.provider}
					</p>
					<p class="text-[12.5px] text-ink-2">{health.llm.model}</p>
					<p class="mt-1.5 text-[11.5px] text-muted">Versi data {health.data_version}</p>
				{:else}
					<p class="mt-1 text-[12.5px] text-ink-2">API sedang tidak terjangkau.</p>
				{/if}
			</div>
		</nav>

		<div class="prose-tw max-w-3xl space-y-10">
			<section
				id="sumber-data"
				class="masuk scroll-mt-20"
				style="--i: 2"
				aria-labelledby="h-sumber"
			>
				<h2 id="h-sumber" class="text-xl font-semibold tracking-tight text-ink">Sumber data</h2>
				<table class="mt-3 w-full text-left text-[14px]">
					<thead class="text-[12.5px] text-muted"
						><tr
							><th class="py-1.5 pr-3 font-medium">Dataset</th><th class="py-1.5 font-medium"
								>Fungsi</th
							></tr
						></thead
					>
					<tbody class="divide-y divide-line-2">
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Menu Go</td><td class="py-2 text-ink-2"
								>Profil usaha kuliner informal: jenis tempat, menu, harga per porsi, keramaian,
								mobilitas, foto. Dasar skor kepadatan dan keramaian.</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Struk Go</td><td class="py-2 text-ink-2"
								>Transaksi riil per merchant dengan metode pembayaran. Dasar skor inklusi digital.</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Community Maps</td><td
								class="py-2 text-ink-2"
								>Observasi lapangan tim Devunder: narasi dan foto kondisi trotoar, lapak, akses.</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Properti Go</td><td
								class="py-2 text-ink-2"
								>Ketersediaan ruko dan kios, penunjang rekomendasi relokasi.</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Stasiun dan halte</td><td
								class="py-2 text-ink-2"
								>Titik MRT koridor Lebak Bulus sampai Bundaran HI dan halte TransJakarta terpilih.</td
							></tr
						>
						<tr
							><td class="py-2 pr-3 font-medium text-ink">Basemap</td><td class="py-2 text-ink-2"
								>MAPID MAPS lewat MapLibre GL. Data mentah mission tidak dipublikasikan; situs hanya
								melayani hasil olahan.</td
							></tr
						>
					</tbody>
				</table>
			</section>

			<section id="pipeline" class="masuk scroll-mt-20" style="--i: 3" aria-labelledby="h-pipeline">
				<h2 id="h-pipeline" class="text-xl font-semibold tracking-tight text-ink">
					Pengolahan data
				</h2>
				<p class="mt-2">
					Seluruh analisis dikerjakan oleh pipeline Python yang dapat diulang dengan satu perintah,
					lalu dipanggang menjadi artefak statis dengan penanda versi data.
				</p>
				<ol class="mt-3 space-y-2">
					<li>
						<strong>Pembersihan.</strong> Standardisasi kolom, konversi koordinat teks, penyeragaman tanggal
						dan jam, normalisasi kategori, pembuangan duplikat dan koordinat di luar wilayah studi.
					</li>
					<li>
						<strong>Klasifikasi foto.</strong> Model vision memberi jenis lapak, indikasi okupansi trotoar
						(0 sampai 2), dan skor kondisi (1 sampai 5) beserta tingkat keyakinan. Keyakinan di bawah
						0,6 masuk daftar tinjauan manual.
					</li>
					<li>
						<strong>Analisis spasial.</strong> Buffer 400 dan 800 meter per stasiun (EPSG:32748), spatial
						join seluruh titik, perhitungan skor, penentuan tipologi.
					</li>
					<li>
						<strong>Ekspor.</strong> PMTiles untuk layer peta, GeoParquet untuk analitik di browser, dan
						ringkasan agregat sebagai bahan AI.
					</li>
				</ol>
			</section>

			<section id="metode" class="masuk scroll-mt-20" style="--i: 4" aria-labelledby="h-metode">
				<h2 id="h-metode" class="text-xl font-semibold tracking-tight text-ink">
					Skor dan tipologi
				</h2>
				<dl class="mt-3 grid gap-3 sm:grid-cols-2">
					<div class="card p-3.5">
						<dt class="font-semibold text-ink">Kepadatan usaha</dt>
						<dd class="mt-1 text-[13.5px] leading-6">
							Jumlah usaha dalam 400 m, dinormalisasi min-max 0 sampai 100 antar kawasan.
						</dd>
					</div>
					<div class="card p-3.5">
						<dt class="font-semibold text-ink">Keramaian</dt>
						<dd class="mt-1 text-[13.5px] leading-6">
							Rata-rata tingkat keramaian pengamatan: sepi 0, sedang 50, ramai 100.
						</dd>
					</div>
					<div class="card p-3.5">
						<dt class="font-semibold text-ink">Inklusi digital</dt>
						<dd class="mt-1 text-[13.5px] leading-6">
							Persentase transaksi non-tunai (QRIS, debit, kredit, e-wallet).
						</dd>
					</div>
					<div class="card p-3.5">
						<dt class="font-semibold text-ink">Friksi trotoar</dt>
						<dd class="mt-1 text-[13.5px] leading-6">
							Campuran okupansi trotoar hasil klasifikasi foto dan kepadatan (50:50).
						</dd>
					</div>
				</dl>
				<p class="mt-4">
					<strong>Tipologi</strong> ditentukan aturan dengan ambang eksplisit: kepadatan di bawah 25 berarti
					sepi; 60 ke atas dengan friksi 60 ke atas berarti padat dan friksi; 60 ke atas dengan digital
					di bawah 40 berarti prioritas digitalisasi; 60 ke atas lainnya berarti kuliner matang; sisanya
					potensi. Ambang mudah dikalibrasi saat data survey penuh masuk.
				</p>
			</section>

			<section id="ai" class="masuk scroll-mt-20" style="--i: 5" aria-labelledby="h-ai">
				<h2 id="h-ai" class="text-xl font-semibold tracking-tight text-ink">Penggunaan AI</h2>
				<dl class="mt-3 space-y-3">
					<div>
						<dt class="font-semibold text-ink">Masukan</dt>
						<dd>
							Ringkasan dan chat hanya menerima ringkasan statistik per kawasan, angka yang juga
							Anda lihat di layar, bukan data mentah. Klasifikasi foto menerima foto lapak yang
							wajah dan pelat nomornya sudah diburamkan.
						</dd>
					</div>
					<div>
						<dt class="font-semibold text-ink">Proses</dt>
						<dd>
							Model diminta menjawab dalam skema JSON ketat. Pertanyaan pengguna diperlakukan
							sebagai data, bukan instruksi. Klasifikasi foto berjalan saat pengolahan, bukan saat
							situs dipakai.
						</dd>
					</div>
					<div>
						<dt class="font-semibold text-ink">Keluaran</dt>
						<dd>
							Narasi teks murni dan, bila relevan, aksi peta dari daftar tetap: <code
								>highlight_kawasan</code
							>, <code>zoom_to</code>, <code>set_filter</code>, <code>compare</code>.
						</dd>
					</div>
					<div>
						<dt class="font-semibold text-ink">Validasi</dt>
						<dd>
							Semua keluaran divalidasi skema di server; aksi dengan target di luar daftar kawasan
							dibuang. Narasi tidak pernah dirender sebagai HTML. Penyedia model dapat diganti lewat
							konfigurasi tanpa perubahan kode.
						</dd>
					</div>
				</dl>
			</section>

			<section id="batasan" class="masuk scroll-mt-20" style="--i: 6" aria-labelledby="h-batasan">
				<h2 id="h-batasan" class="text-xl font-semibold tracking-tight text-ink">Batasan</h2>
				<ul class="mt-3 space-y-2">
					<li>
						Sampel data tahap awal masih kecil dan tidak merata antar kawasan; skor dinormalisasi
						antar kawasan sehingga peka terhadap penambahan data.
					</li>
					<li>
						Selama pengembangan, data sintetis dipakai sebagai pengganti sampel mission; seluruh
						angka diperbarui otomatis saat data survey resmi masuk ke pipeline.
					</li>
					<li>
						Koordinat pencatatan lapangan punya galat GPS 10 sampai 20 meter, memadai untuk buffer
						400 dan 800 meter, tidak untuk analisis persil.
					</li>
					<li>
						Klasifikasi foto bersifat estimasi; nilai berkeyakinan rendah ditinjau manual sebelum
						dipakai menghitung skor friksi.
					</li>
				</ul>
			</section>
		</div>
	</div>
</div>
