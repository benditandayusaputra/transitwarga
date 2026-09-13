<script lang="ts">
	import { compareKawasan, type CompareRow } from '$lib/db/queries';
	import { TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import { formatRupiah, formatSkor } from '$lib/utils/format';
	import type { AgregatPayload, Tipologi } from '$lib/types';
	import AngkaNaik from './AngkaNaik.svelte';

	let { agregat, dbGagal }: { agregat: AgregatPayload | null; dbGagal: boolean } = $props();

	let idA = $state('');
	let idB = $state('');
	let hasil = $state<CompareRow[]>([]);
	let memuat = $state(false);

	// Aksi AI "compare" mengarahkan ke /analisis?a=..&b=.. : prefill dari URL.
	$effect(() => {
		if (typeof location === 'undefined') return;
		const params = new URLSearchParams(location.search);
		const a = params.get('a');
		const b = params.get('b');
		if (a && !idA) idA = a;
		if (b && !idB) idB = b;
	});

	function dariAgregat(id: string): CompareRow | null {
		const k = agregat?.kawasan.find((x) => x.kawasan_id === id);
		if (!k) return null;
		return {
			kawasan_id: k.kawasan_id,
			nama: k.nama,
			tipologi: k.tipologi,
			n_usaha_800: k.n_usaha_800,
			harga_median: k.harga_median,
			skor_kepadatan: k.skor_kepadatan,
			skor_keramaian: k.skor_keramaian,
			skor_digital: k.skor_digital,
			skor_friksi: k.skor_friksi
		};
	}

	$effect(() => {
		if (!idA || !idB || idA === idB) {
			hasil = [];
			return;
		}
		if (dbGagal) {
			hasil = [dariAgregat(idA), dariAgregat(idB)].filter((r): r is CompareRow => r !== null);
			return;
		}
		memuat = true;
		const a = idA;
		const b = idB;
		compareKawasan(a, b)
			.then((rows) => {
				if (a === idA && b === idB) hasil = rows;
			})
			.catch(() => {
				hasil = [dariAgregat(a), dariAgregat(b)].filter((r): r is CompareRow => r !== null);
			})
			.finally(() => (memuat = false));
	});

	const metrik: {
		label: string;
		nilai: (r: CompareRow) => number;
		format: (n: number) => string;
	}[] = [
		{
			label: 'Jumlah usaha dalam 800 m',
			nilai: (r) => r.n_usaha_800,
			format: (n) => String(Math.round(n))
		},
		{ label: 'Harga median per porsi', nilai: (r) => r.harga_median, format: formatRupiah },
		{ label: 'Skor kepadatan', nilai: (r) => r.skor_kepadatan, format: formatSkor },
		{ label: 'Skor keramaian', nilai: (r) => r.skor_keramaian, format: formatSkor },
		{ label: 'Skor inklusi digital', nilai: (r) => r.skor_digital, format: formatSkor },
		{ label: 'Skor friksi trotoar', nilai: (r) => r.skor_friksi, format: formatSkor }
	];

	function tukar() {
		const t = idA;
		idA = idB;
		idB = t;
	}
</script>

<section class="card p-4 sm:p-5" data-testid="compare-view" aria-busy={memuat}>
	<div class="flex items-baseline justify-between gap-3">
		<h2 class="text-[14px] font-semibold text-ink">Bandingkan dua kawasan</h2>
		{#if idA && idB}
			<button type="button" class="text-[12.5px] font-medium text-accent" onclick={tukar}
				>Tukar posisi</button
			>
		{/if}
	</div>
	<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="label">
			Kawasan A
			<select class="input mt-1" bind:value={idA} data-testid="compare-select-a">
				<option value="">Pilih kawasan</option>
				{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
					<option value={k.kawasan_id}>{k.nama}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			Kawasan B
			<select class="input mt-1" bind:value={idB} data-testid="compare-select-b">
				<option value="">Pilih kawasan</option>
				{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
					<option value={k.kawasan_id}>{k.nama}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if idA && idB && idA === idB}
		<p class="mt-3 text-[12.5px] text-signal">Pilih dua kawasan yang berbeda.</p>
	{:else if memuat}
		<div class="mt-4 space-y-2" aria-label="Memuat perbandingan">
			{#each [0, 1, 2, 3, 4, 5] as i (i)}
				<div class="shimmer h-6 w-full"></div>
			{/each}
		</div>
	{:else if hasil.length === 2}
		<div class="mt-4 overflow-x-auto">
			<table class="w-full min-w-[26rem] text-left text-sm" data-testid="compare-table">
				<thead>
					<tr class="text-[12.5px] text-muted">
						<th scope="col" class="py-2 pr-2 font-medium">Indikator</th>
						{#each hasil as r (r.kawasan_id)}
							<th scope="col" class="px-2 py-2">
								<span class="block font-semibold text-ink">{r.nama}</span>
								<span
									class="mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-2"
								>
									<span
										class="h-2 w-2 rounded-sm"
										style:background-color={TIPOLOGI_COLORS[r.tipologi as Tipologi] ?? '#94a3b8'}
									></span>
									{TIPOLOGI_LABELS[r.tipologi as Tipologi] ?? r.tipologi}
								</span>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each metrik as m (m.label)}
						{@const va = m.nilai(hasil[0])}
						{@const vb = m.nilai(hasil[1])}
						<tr class="border-t border-line-2">
							<th scope="row" class="py-2 pr-2 text-[12.5px] font-medium text-muted">{m.label}</th>
							<td class={`num px-2 py-2 ${va > vb ? 'text-accent-2' : ''}`}
								><AngkaNaik nilai={va} format={m.format} /></td
							>
							<td class={`num px-2 py-2 ${vb > va ? 'text-accent-2' : ''}`}
								><AngkaNaik nilai={vb} format={m.format} /></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-2 text-[11.5px] text-muted">Nilai lebih tinggi ditandai biru.</p>
		</div>
	{:else}
		<p class="mt-4 text-[12.5px] text-muted">
			Pilih dua kawasan untuk melihat enam indikator berdampingan.
		</p>
	{/if}
</section>
