<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		judul,
		icon,
		onTutup,
		testid,
		children
	}: {
		judul: string;
		icon: IconName;
		onTutup: () => void;
		testid?: string;
		children: Snippet;
	} = $props();
</script>

<section
	class="w-72 max-w-[calc(100vw-5.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm"
	aria-label={judul}
	data-testid={testid}
>
	<header class="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
		<span class="text-primary-700"><Icon name={icon} size={16} /></span>
		<h2 class="flex-1 text-xs font-bold tracking-wide text-slate-700 uppercase">{judul}</h2>
		<button
			type="button"
			class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
			aria-label={`Tutup panel ${judul}`}
			onclick={onTutup}
		>
			<Icon name="tutup" size={14} />
		</button>
	</header>
	<div class="max-h-[55dvh] overflow-y-auto p-3.5">
		{@render children()}
	</div>
</section>
