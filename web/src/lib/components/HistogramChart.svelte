<script lang="ts">
	export interface HistogramBin {
		label: string;
		n: number;
	}

	let { bins }: { bins: HistogramBin[] } = $props();

	const max = $derived(Math.max(1, ...bins.map((b) => b.n)));
</script>

{#if bins.length === 0}
	<p class="text-sm text-muted">Belum ada data untuk kawasan ini.</p>
{:else}
	<div
		class="flex h-36 items-end gap-1.5"
		role="img"
		aria-label="Histogram distribusi harga per porsi"
	>
		{#each bins as bin, i (bin.label)}
			<div
				class="flex h-full min-w-0 flex-1 flex-col items-center gap-1"
				title={`${bin.label}: ${bin.n}`}
			>
				<span class="num text-[11px]">{bin.n}</span>
				<div class="flex w-full flex-1 items-end">
					<div
						class="bar-tumbuh-y w-full rounded-t-[3px] bg-accent"
						style:height={`${(bin.n / max) * 100}%`}
						style:min-height="3px"
						style:animation-delay={`${i * 40}ms`}
					></div>
				</div>
				<span class="w-full truncate text-center text-[10.5px] text-muted">{bin.label}</span>
			</div>
		{/each}
	</div>
{/if}
