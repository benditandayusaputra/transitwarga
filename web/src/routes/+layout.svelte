<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { children }: { children: Snippet } = $props();

	const menu = [
		{ href: '/peta', label: 'Peta' },
		{ href: '/analisis', label: 'Analisis' },
		{ href: '/rekomendasi', label: 'Rekomendasi' },
		{ href: '/survey', label: 'Survey' },
		{ href: '/metodologi', label: 'Metodologi' }
	];

	const diPeta = $derived(page.url.pathname === '/peta');
</script>

<div class="flex min-h-dvh flex-col">
	<a
		href="#konten-utama"
		class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-primary-700 focus:px-3 focus:py-1.5 focus:text-white"
	>
		Lompat ke konten utama
	</a>

	<header
		class="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
	>
		<nav class="mx-auto flex h-13 max-w-6xl items-center gap-6 px-4" aria-label="Navigasi utama">
			<a href="/" class="flex items-center gap-2.5" aria-label="TransitWarga — beranda">
				<span
					class="from-primary-600 to-primary-800 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm shadow-primary-600/30"
				>
					<Icon name="pin" size={17} />
				</span>
				<span class="text-[17px] font-bold tracking-tight text-slate-900">
					Transit<span class="text-primary-700">Warga</span>
				</span>
			</a>

			<ul class="hidden flex-1 items-center gap-1 md:flex">
				{#each menu as item (item.href)}
					{@const aktif = page.url.pathname === item.href}
					<li>
						<a
							href={item.href}
							class={aktif
								? 'bg-primary-50 text-primary-700 rounded-full px-3.5 py-1.5 text-sm font-semibold'
								: 'rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'}
							aria-current={aktif ? 'page' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>

			<a
				href="/peta"
				class={`from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 ml-auto hidden items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/30 transition-colors md:flex ${diPeta ? 'md:hidden' : ''}`}
			>
				<Icon name="peta" size={15} />
				Jelajahi Peta
			</a>
		</nav>
	</header>

	<main id="konten-utama" class={diPeta ? 'flex-1' : 'flex-1 pb-24 md:pb-0'}>
		{@render children()}
	</main>

	<BottomNav />
</div>
