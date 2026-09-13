<script lang="ts">
	/** Ikon SVG inline (stroke currentColor) — tanpa CDN/webfont, aman CSP. */

	export type IconName =
		| 'cari'
		| 'filter'
		| 'layer'
		| 'legenda'
		| 'tutup'
		| 'jalan'
		| 'satelit'
		| 'pin'
		| 'transit'
		| 'beranda'
		| 'peta'
		| 'analisis'
		| 'rekomendasi'
		| 'survey'
		| 'metodologi'
		| 'chevron-bawah'
		| 'chevron-atas'
		| 'perbesar'
		| 'perkecil'
		| 'terang'
		| 'gelap';

	let { name, size = 18 }: { name: IconName; size?: number } = $props();

	const PATHS: Record<IconName, string> = {
		gelap: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
		cari: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M20.5 20.5 16 16',
		filter: 'M4 5h16 M7 12h10 M10 19h4',
		layer: 'M12 3.5 21 8l-9 4.5L3 8l9-4.5z M4.5 12.5 12 16l7.5-3.5 M4.5 16.5 12 20l7.5-3.5',
		legenda: 'M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01 M8.5 6.5H20 M8.5 12H20 M8.5 17.5H20',
		tutup: 'M6 6l12 12 M18 6 6 18',
		jalan: 'M5.5 21 9 3 M18.5 21 15 3 M12 5.5v2.5 M12 11.5V14 M12 18v2.5',
		satelit:
			'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M3.5 12h17 M12 3c2.6 2.6 3.9 5.7 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.7-3.9-9S9.4 5.6 12 3z',
		pin: 'M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.5 12 21 12 21z M12 8.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
		transit:
			'M6.5 4h11a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M4.5 11h15 M8.5 20l1.5-3.5 M15.5 20 14 16.5 M8.5 14h.01 M15.5 14h.01',
		beranda: 'M4 11.5 12 4l8 7.5 M6.5 10v9.5h4V15h3v4.5h4V10',
		peta: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z M9 4v14 M15 6v14',
		analisis: 'M4 20h16 M7 20v-6 M12 20V9 M17 20V4',
		rekomendasi:
			'M9.5 17.5h5 M10 20.5h4 M12 3a6 6 0 0 1 3.5 10.9c-.6.5-1 1.2-1 2v.6h-5v-.6c0-.8-.4-1.5-1-2A6 6 0 0 1 12 3z',
		survey:
			'M9.5 4h5v3h-5V4z M9.5 5.5H7.5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-2 M9 13.5l2 2 4-4.5',
		metodologi:
			'M12 6.5C10 4.8 7.3 4.5 4 4.5v13c3.3 0 6 .3 8 2 2-1.7 4.7-2 8-2v-13c-3.3 0-6 .3-8 2z M12 6.5v13',
		'chevron-bawah': 'M6 9.5l6 6 6-6',
		'chevron-atas': 'M6 14.5l6-6 6 6',
		perbesar: 'M9 4H4v5 M15 4h5v5 M9 20H4v-5 M15 20h5v-5',
		perkecil: 'M4 9h5V4 M20 9h-5V4 M4 15h5v5 M20 15h-5v5',
		terang:
			'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z M12 2.5v2.2 M12 19.3v2.2 M2.5 12h2.2 M19.3 12h2.2 M5.3 5.3l1.5 1.5 M17.2 17.2l1.5 1.5 M18.7 5.3l-1.5 1.5 M6.8 17.2l-1.5 1.5'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.9"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={PATHS[name]} />
</svg>
