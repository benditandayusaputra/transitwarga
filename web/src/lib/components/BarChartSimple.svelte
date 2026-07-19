<script lang="ts">
	export interface BarItem {
		label: string;
		value: number;
		color: string;
	}

	let {
		items,
		formatValue = (v: number) => String(v)
	}: {
		items: BarItem[];
		formatValue?: (v: number) => string;
	} = $props();

	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

{#if items.length === 0}
	<p class="text-xs text-slate-400">Tidak ada data.</p>
{:else}
	<ul class="space-y-1.5" role="img" aria-label="Diagram batang">
		{#each items as item (item.label)}
			<li class="text-xs text-slate-600">
				<div class="flex justify-between gap-2">
					<span>{item.label}</span>
					<span class="font-semibold">{formatValue(item.value)}</span>
				</div>
				<div class="mt-0.5 h-2 w-full rounded-full bg-slate-100">
					<div
						class="h-2 rounded-full"
						style:width={`${(item.value / max) * 100}%`}
						style:background-color={item.color}
					></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
