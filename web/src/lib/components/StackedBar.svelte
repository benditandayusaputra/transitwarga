<script lang="ts">
	export interface Segment {
		label: string;
		value: number;
		color: string;
	}

	let { segments }: { segments: Segment[] } = $props();

	const total = $derived(segments.reduce((acc, s) => acc + s.value, 0));
</script>

{#if total === 0}
	<p class="text-xs text-slate-400">Tidak ada data.</p>
{:else}
	<div role="img" aria-label="Komposisi metode pembayaran">
		<div class="flex h-4 w-full overflow-hidden rounded-full">
			{#each segments as s (s.label)}
				{#if s.value > 0}
					<div
						style:width={`${(s.value / total) * 100}%`}
						style:background-color={s.color}
						title={`${s.label}: ${s.value}`}
					></div>
				{/if}
			{/each}
		</div>
		<ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
			{#each segments as s (s.label)}
				<li class="flex items-center gap-1.5 text-xs text-slate-600">
					<span class="inline-block h-2.5 w-2.5 rounded-sm" style:background-color={s.color}></span>
					{s.label}
					<span class="font-semibold">{s.value}</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
