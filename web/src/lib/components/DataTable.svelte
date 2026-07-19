<script lang="ts">
	import { JENIS_LABELS } from '$lib/map/layers';
	import { formatRupiah } from '$lib/utils/format';
	import type { UsahaRow } from '$lib/types';

	let { rows, maksTinggi = 'max-h-56' }: { rows: UsahaRow[]; maksTinggi?: string } = $props();
</script>

<div
	class={`${maksTinggi} overflow-auto rounded-md border border-slate-200`}
	data-testid="data-table"
>
	<table class="w-full text-left text-xs">
		<caption class="sr-only">Tabel atribut usaha pada kawasan terpilih</caption>
		<thead class="sticky top-0 bg-slate-50 text-slate-500">
			<tr>
				<th scope="col" class="px-2 py-1.5 font-semibold">Nama</th>
				<th scope="col" class="px-2 py-1.5 font-semibold">Jenis</th>
				<th scope="col" class="px-2 py-1.5 text-right font-semibold">Harga</th>
				<th scope="col" class="px-2 py-1.5 font-semibold">Keramaian</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr class="border-t border-slate-100 text-slate-700">
					<td class="px-2 py-1.5">{row.nama}</td>
					<td class="px-2 py-1.5">{JENIS_LABELS[row.jenis_tempat] ?? row.jenis_tempat}</td>
					<td class="px-2 py-1.5 text-right">{formatRupiah(row.harga_rata)}</td>
					<td class="px-2 py-1.5 capitalize">{row.keramaian}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4" class="px-2 py-3 text-center text-slate-400">
						Belum ada usaha termuat pada kawasan ini.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
