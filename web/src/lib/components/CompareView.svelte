<script lang="ts">
	import { compareKawasan, type CompareRow } from '$lib/db/queries';
	import { TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import { formatRupiah, formatSkor } from '$lib/utils/format';
	import type { AgregatPayload, Tipologi } from '$lib/types';

	let { agregat, dbGagal }: { agregat: AgregatPayload | null; dbGagal: boolean } = $props();

	let idA = $state('');
	let idB = $state('');
	let hasil = $state<CompareRow[]>([]);
	let memuat = $state(false);

	// Aksi AI "compare" mengarahkan ke /analisis?a=..&b=.. — prefill dari URL.
	$effect(() => {
		if (typeof location === 'undefined') return;
		const params = new URLSearchParams(location.search);
		const a = params.get('a');
		const b = params.get('b');
		if (a && !idA) idA = a;
		if (b && !idB) idB = b;
	});

	/** Fallback: susun CompareRow dari agregat.json bila DuckDB tidak tersedia. */
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

	const metrik: { label: string; ambil: (r: CompareRow) => string }[] = [
		{ label: 'Jumlah usaha (≤800 m)', ambil: (r) => String(r.n_usaha_800) },
		{ label: 'Harga median', ambil: (r) => formatRupiah(r.harga_median) },
		{ label: 'Skor kepadatan', ambil: (r) => formatSkor(r.skor_kepadatan) },
		{ label: 'Skor keramaian', ambil: (r) => formatSkor(r.skor_keramaian) },
		{ label: 'Skor digital', ambil: (r) => formatSkor(r.skor_digital) },
		{ label: 'Skor friksi', ambil: (r) => formatSkor(r.skor_friksi) }
	];
</script>

<section
	class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
	data-testid="compare-view"
>
	<h2 class="text-sm font-semibold text-slate-700">Bandingkan dua kawasan</h2>
	<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="text-xs text-slate-500">
			Kawasan A
			<select
				class="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800"
				bind:value={idA}
				data-testid="compare-select-a"
			>
				<option value="">— pilih kawasan —</option>
				{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
					<option value={k.kawasan_id}>{k.nama}</option>
				{/each}
			</select>
		</label>
		<label class="text-xs text-slate-500">
			Kawasan B
			<select
				class="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800"
				bind:value={idB}
				data-testid="compare-select-b"
			>
				<option value="">— pilih kawasan —</option>
				{#each agregat?.kawasan ?? [] as k (k.kawasan_id)}
					<option value={k.kawasan_id}>{k.nama}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if idA && idB && idA === idB}
		<p class="mt-3 text-xs text-amber-600">Pilih dua kawasan yang berbeda.</p>
	{:else if memuat}
		<p class="mt-3 text-xs text-slate-400">Memuat perbandingan…</p>
	{:else if hasil.length === 2}
		<div class="mt-4 overflow-x-auto">
			<table class="w-full min-w-96 text-left text-sm" data-testid="compare-table">
				<thead>
					<tr class="text-xs text-slate-500">
						<th scope="col" class="py-1.5 pr-2 font-medium">Indikator</th>
						{#each hasil as r (r.kawasan_id)}
							<th scope="col" class="px-2 py-1.5">
								<span class="font-bold text-slate-800">{r.nama}</span>
								<span
									class="ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
									style:background-color={TIPOLOGI_COLORS[r.tipologi as Tipologi] ?? '#94a3b8'}
								>
									{TIPOLOGI_LABELS[r.tipologi as Tipologi] ?? r.tipologi}
								</span>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each metrik as m (m.label)}
						<tr class="border-t border-slate-100">
							<th scope="row" class="py-1.5 pr-2 text-xs font-medium text-slate-500">{m.label}</th>
							{#each hasil as r (r.kawasan_id)}
								<td class="px-2 py-1.5 font-semibold text-slate-800">{m.ambil(r)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
