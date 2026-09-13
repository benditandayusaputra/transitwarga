<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		keterangan,
		memuat = false,
		children
	}: { title: string; keterangan?: string; memuat?: boolean; children: Snippet } = $props();
</script>

<section class="card p-4 sm:p-5" aria-busy={memuat}>
	<h3 class="text-[14px] font-semibold text-ink">{title}</h3>
	{#if keterangan}
		<p class="mt-0.5 text-[12.5px] text-muted">{keterangan}</p>
	{/if}
	<div class="mt-4">
		{#if memuat}
			<div class="space-y-2.5" aria-label="Memuat grafik">
				<div class="shimmer h-3 w-full"></div>
				<div class="shimmer h-3 w-5/6"></div>
				<div class="shimmer h-3 w-2/3"></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>
</section>
