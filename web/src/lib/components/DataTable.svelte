<script lang="ts">
	import { JENIS_LABELS } from '$lib/map/layers';
	import { formatRupiah } from '$lib/utils/format';
	import type { UsahaRow } from '$lib/types';

	let { rows, maksTinggi = 'max-h-56' }: { rows: UsahaRow[]; maksTinggi?: string } = $props();
</script>

<div
	class={`${maksTinggi} liquid-glass-scroll overflow-auto rounded-xl border border-white/60 p-0.5 shadow-sm`}
	data-testid="data-table"
>
	<table class="w-full text-left text-xs">
		<caption class="sr-only">Tabel atribut usaha pada kawasan terpilih</caption>
		<thead class="liquid-glass-inner sticky top-0 text-black">
			<tr>
				<th scope="col" class="px-2.5 py-2 font-black text-black">Nama</th>
				<th scope="col" class="px-2.5 py-2 font-black text-black">Jenis</th>
				<th scope="col" class="px-2.5 py-2 text-right font-black text-black">Harga</th>
				<th scope="col" class="px-2.5 py-2 font-black text-black">Keramaian</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr class="border-t border-white/40 text-black font-extrabold hover:bg-white/40">
					<td class="px-2.5 py-2">{row.nama}</td>
					<td class="px-2.5 py-2">{JENIS_LABELS[row.jenis_tempat] ?? row.jenis_tempat}</td>
					<td class="px-2.5 py-2 text-right">{formatRupiah(row.harga_rata)}</td>
					<td class="px-2.5 py-2 capitalize">{row.keramaian}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4" class="px-2.5 py-3 text-center font-bold text-black/70">
						Belum ada usaha termuat pada kawasan ini.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
