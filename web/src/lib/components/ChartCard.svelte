<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
	{@render children()}
</section>
