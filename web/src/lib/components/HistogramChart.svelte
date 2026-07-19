<script lang="ts">
	export interface HistogramBin {
		label: string;
		n: number;
	}

	let { bins }: { bins: HistogramBin[] } = $props();

	const max = $derived(Math.max(1, ...bins.map((b) => b.n)));
</script>

{#if bins.length === 0}
	<p class="text-xs text-slate-400">Tidak ada data.</p>
{:else}
	<div
		class="flex h-32 items-end gap-1"
		role="img"
		aria-label="Histogram distribusi harga per porsi"
	>
		{#each bins as bin (bin.label)}
			<div class="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${bin.label}: ${bin.n}`}>
				<span class="text-[10px] font-semibold text-slate-500">{bin.n}</span>
				<div
					class="w-full rounded-t bg-primary-600"
					style:height={`${(bin.n / max) * 88}%`}
					style:min-height="2px"
				></div>
				<span class="w-full truncate text-center text-[9px] text-slate-400">{bin.label}</span>
			</div>
		{/each}
	</div>
{/if}
