<script lang="ts">
	import { JENIS_LABELS } from '$lib/map/layers';
	import { formatRupiah } from '$lib/utils/format';
	import type { UsahaRow } from '$lib/types';

	let { rows, maksTinggi = 'max-h-56' }: { rows: UsahaRow[]; maksTinggi?: string } = $props();
	const KERAMAIAN: Record<string, string> = { sepi: 'Sepi', sedang: 'Sedang', ramai: 'Ramai' };
</script>

<div
	class={`${maksTinggi} overflow-auto rounded-[8px] border border-line`}
	data-testid="data-table"
>
	<table class="w-full text-left text-[12.5px]">
		<caption class="sr-only">Tabel atribut usaha pada kawasan terpilih</caption>
		<thead class="sticky top-0 bg-paper text-[11.5px] text-muted">
			<tr>
				<th scope="col" class="px-2.5 py-2 font-medium">Nama</th>
				<th scope="col" class="px-2.5 py-2 font-medium">Jenis</th>
				<th scope="col" class="px-2.5 py-2 text-right font-medium">Harga</th>
				<th scope="col" class="px-2.5 py-2 font-medium">Keramaian</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr class="border-t border-line-2 text-ink hover:bg-line-2">
					<td class="px-2.5 py-2 font-medium">{row.nama}</td>
					<td class="px-2.5 py-2 text-ink-2"
						>{JENIS_LABELS[row.jenis_tempat] ?? row.jenis_tempat}</td
					>
					<td class="num px-2.5 py-2 text-right">{formatRupiah(row.harga_rata)}</td>
					<td class="px-2.5 py-2 text-ink-2">{KERAMAIAN[row.keramaian] ?? row.keramaian}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4" class="px-2.5 py-4 text-center text-[12.5px] text-muted">
						Perbesar peta ke kawasan ini agar daftar usahanya termuat.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
