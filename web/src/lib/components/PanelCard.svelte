<script lang="ts">
	import type { Snippet } from 'svelte';
	import { masukPanel } from '$lib/utils/motion';
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
	class="liquid-glass w-72 max-w-[calc(100vw-5.5rem)] overflow-hidden rounded-2xl border border-white/70 shadow-2xl"
	aria-label={judul}
	data-testid={testid}
	transition:masukPanel
>
	<header class="flex items-center gap-2 border-b border-white/40 px-3.5 py-2.5">
		<span class="text-slate-950"><Icon name={icon} size={16} /></span>
		<h2 class="flex-1 text-xs font-extrabold tracking-wide text-black uppercase">{judul}</h2>
		<button
			type="button"
			class="rounded-md p-1 text-black font-bold hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
			aria-label={`Tutup panel ${judul}`}
			onclick={onTutup}
		>
			<Icon name="tutup" size={14} />
		</button>
	</header>
	<div class="liquid-glass-scroll max-h-[55dvh] overflow-y-auto p-3.5">
		{@render children()}
	</div>
</section>
