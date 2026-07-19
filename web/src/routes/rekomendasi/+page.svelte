<script lang="ts">
	import { TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import type { Tipologi } from '$lib/types';

	interface Rekomendasi {
		tipologi: Tipologi;
		ringkas: string;
		aksi: { stakeholder: string; langkah: string[] }[];
	}

	// Kerangka rekomendasi per tipologi (blueprint bag. 1): penataan/relokasi,
	// formalisasi zona kuliner transit, prioritas digitalisasi QRIS.
	const daftar: Rekomendasi[] = [
		{
			tipologi: 'kuliner_matang',
			ringkas:
				'Kawasan dengan ekosistem kuliner yang sudah hidup, keramaian tinggi, dan friksi terkendali. Fokus: pengakuan dan peningkatan kualitas, bukan penggusuran.',
			aksi: [
				{
					stakeholder: 'Pemerintah kota',
					langkah: [
						'Formalisasi menjadi zona kuliner transit resmi dengan jam operasional dan standar kebersihan.',
						'Sediakan fasilitas dasar: air bersih, listrik terukur, dan pengelolaan sampah.'
					]
				},
				{
					stakeholder: 'Operator transit (MRT/TransJakarta)',
					langkah: [
						'Integrasikan zona kuliner ke wayfinding stasiun (papan penunjuk, peta stasiun).',
						'Jajaki kemitraan promosi "kuliner stasiun" untuk menaikkan trafik non-sibuk.'
					]
				},
				{
					stakeholder: 'Pedagang & komunitas',
					langkah: [
						'Bentuk paguyuban per kawasan sebagai mitra dialog resmi.',
						'Ikuti sertifikasi higiene pangan yang difasilitasi pemerintah kota.'
					]
				}
			]
		},
		{
			tipologi: 'padat_friksi',
			ringkas:
				'Kepadatan usaha tinggi dan okupansi trotoar dominan — akses pejalan kaki ke stasiun terganggu. Fokus: penataan ulang ruang, bukan sekadar razia.',
			aksi: [
				{
					stakeholder: 'Pemerintah kota',
					langkah: [
						'Tata ulang titik lapak menjauhi jalur pejalan kaki utama; gunakan peta friksi TransitWarga sebagai dasar penentuan titik.',
						'Siapkan kantong relokasi dalam radius 400 m (lihat layer properti sewa) supaya pedagang tidak kehilangan pasar.'
					]
				},
				{
					stakeholder: 'Operator transit',
					langkah: [
						'Prioritaskan pelebaran/pembersihan koridor pejalan kaki pada jam sibuk.',
						'Sediakan area tunggu ojek daring terpisah agar tidak menumpuk dengan lapak.'
					]
				},
				{
					stakeholder: 'Pedagang & komunitas',
					langkah: [
						'Sepakati batas lapak dan jam gelar-bongkar lewat paguyuban.',
						'Manfaatkan skema relokasi berimbang: tempat baru + kepastian izin.'
					]
				}
			]
		},
		{
			tipologi: 'potensi',
			ringkas:
				'Aktivitas usaha cukup namun belum padat; ruang masih lega. Fokus: menumbuhkan dengan tertib sejak awal — lebih murah daripada menata belakangan.',
			aksi: [
				{
					stakeholder: 'Pemerintah kota',
					langkah: [
						'Tetapkan zona tumbuh dengan slot lapak resmi sebelum kepadatan terjadi.',
						'Pantau tren kepadatan per kuartal dari data TransitWarga.'
					]
				},
				{
					stakeholder: 'Operator transit',
					langkah: ['Uji coba bazar/kuliner tematik akhir pekan untuk mengaktivasi kawasan.']
				},
				{
					stakeholder: 'Penyedia pembayaran digital',
					langkah: ['Masuk lebih awal: onboarding QRIS gratis bagi pedagang baru di zona tumbuh.']
				}
			]
		},
		{
			tipologi: 'prioritas_digital',
			ringkas:
				'Kawasan ramai tetapi transaksi non-tunai masih rendah. Fokus: percepatan inklusi digital yang tepat sasaran.',
			aksi: [
				{
					stakeholder: 'Penyedia pembayaran digital & perbankan',
					langkah: [
						'Kampanye onboarding QRIS terarah ke kawasan ini (bukan sebar rata se-kota).',
						'Sediakan pendampingan literasi digital, bukan hanya stiker QRIS.'
					]
				},
				{
					stakeholder: 'Pemerintah kota',
					langkah: [
						'Insentif retribusi bagi pedagang yang aktif menerima pembayaran digital.',
						'Pantau pergeseran pct_digital kawasan sebagai indikator keberhasilan program.'
					]
				},
				{
					stakeholder: 'Pedagang & komunitas',
					langkah: ['Manfaatkan riwayat transaksi digital untuk akses kredit mikro formal.']
				}
			]
		},
		{
			tipologi: 'sepi',
			ringkas:
				'Aktivitas usaha minim. Fokus: pahami penyebabnya (demand rendah? akses buruk?) sebelum intervensi.',
			aksi: [
				{
					stakeholder: 'Pemerintah kota',
					langkah: [
						'Audit akses pejalan kaki dan penerangan; kawasan sepi sering bermula dari akses yang buruk.',
						'Jangan jadikan target relokasi tanpa perbaikan akses — pedagang akan kembali ke tempat ramai.'
					]
				},
				{
					stakeholder: 'Operator transit',
					langkah: ['Evaluasi integrasi antarmoda (jarak halte pengumpan, penyeberangan).']
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Rekomendasi — TransitWarga</title>
	<meta
		name="description"
		content="Rekomendasi kebijakan per tipologi kawasan untuk pemerintah kota, operator transit, pedagang, dan penyedia pembayaran digital"
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10">
	<h1 class="text-3xl font-bold text-slate-900">Rekomendasi Kebijakan</h1>
	<p class="mt-3 leading-relaxed text-slate-600">
		Setiap kawasan stasiun diklasifikasikan ke satu dari lima tipologi berdasarkan skor kepadatan,
		keramaian, inklusi digital, dan friksi trotoar (lihat <a
			class="text-primary-700 underline underline-offset-2"
			href="/metodologi">metodologi</a
		>). Rekomendasi di bawah disusun per tipologi untuk tiap pemangku kepentingan — buka
		<a class="text-primary-700 underline underline-offset-2" href="/peta">peta</a> untuk melihat kawasan
		mana masuk tipologi apa.
	</p>

	{#each daftar as item (item.tipologi)}
		<section class="mt-10" aria-labelledby={`tip-${item.tipologi}`}>
			<h2 id={`tip-${item.tipologi}`} class="flex items-center gap-2.5 text-xl font-bold">
				<span
					class="inline-block h-4 w-4 rounded-sm"
					style:background-color={TIPOLOGI_COLORS[item.tipologi]}
					aria-hidden="true"
				></span>
				<span class="text-slate-900">{TIPOLOGI_LABELS[item.tipologi]}</span>
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">{item.ringkas}</p>
			<div class="mt-4 space-y-4">
				{#each item.aksi as blok (blok.stakeholder)}
					<div class="rounded-xl border border-slate-200 p-4">
						<h3 class="text-sm font-semibold text-slate-800">{blok.stakeholder}</h3>
						<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
							{#each blok.langkah as langkah, i (i)}
								<li>{langkah}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
