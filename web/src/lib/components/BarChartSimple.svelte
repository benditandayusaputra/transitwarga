<script lang="ts">
	import AngkaNaik from './AngkaNaik.svelte';

	export interface BarItem {
		label: string;
		value: number;
		color: string;
	}

	let {
		items,
		formatValue = (v: number) => String(Math.round(v))
	}: {
		items: BarItem[];
		formatValue?: (v: number) => string;
	} = $props();

	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

{#if items.length === 0}
	<p class="text-sm text-muted">Belum ada data untuk kawasan ini.</p>
{:else}
	<ul class="space-y-2" role="img" aria-label="Diagram batang">
		{#each items as item, i (item.label)}
			<li class="text-[12.5px] text-ink-2">
				<div class="flex justify-between gap-2">
					<span>{item.label}</span>
					<span class="num"><AngkaNaik nilai={item.value} format={formatValue} /></span>
				</div>
				<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-line-2">
					<div
						class="bar-tumbuh h-2 rounded-full"
						style:width={`${(item.value / max) * 100}%`}
						style:background-color={item.color}
						style:animation-delay={`${i * 50}ms`}
					></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
