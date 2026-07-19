<svelte:head>
	<title>TransitWarga — Ekonomi Informal di Ekosistem Transit Jakarta</title>
	<meta
		name="description"
		content="WebGIS yang memetakan PKL, gerobak, dan warung tenda di sekitar stasiun MRT dan halte TransJakarta, lalu menghubungkannya dengan pengalaman first/last mile penumpang."
	/>
</svelte:head>

<section class="bg-linear-to-b from-primary-50 to-white">
	<div class="mx-auto max-w-6xl px-4 py-16 md:py-24">
		<p class="text-sm font-semibold tracking-wide text-primary-700 uppercase">
			MAPID WebGIS Competition 2026 · Maps That Think!
		</p>
		<h1 class="mt-3 max-w-3xl text-4xl font-bold text-slate-900 md:text-5xl">
			Warung kecil menghidupkan stasiun. Data membantu menatanya.
		</h1>
		<p class="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
			TransitWarga memetakan ekonomi informal - kaki lima, gerobak, warung tenda - di sekitar
			stasiun MRT dan halte TransJakarta, lalu menghubungkannya dengan pengalaman
			<em>first/last mile</em> penumpang. Hasilnya: tipologi kawasan dan rekomendasi kebijakan yang bisa
			langsung ditindaklanjuti.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<a
				href="/peta"
				class="rounded-lg bg-primary-700 px-6 py-3 font-semibold text-white hover:bg-primary-800"
				data-testid="cta-peta"
			>
				Jelajahi Peta
			</a>
			<a
				href="/analisis"
				class="rounded-lg border border-primary-700 px-6 py-3 font-semibold text-primary-700 hover:bg-primary-50"
			>
				Lihat Analisis
			</a>
		</div>
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
