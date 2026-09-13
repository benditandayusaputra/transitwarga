<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { navigating, page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	let { children }: { children: Snippet } = $props();

	const menu = [
		{ href: '/peta', label: 'Peta' },
		{ href: '/analisis', label: 'Analisis' },
		{ href: '/rekomendasi', label: 'Rekomendasi' },
		{ href: '/survey', label: 'Survey' },
		{ href: '/metodologi', label: 'Metodologi' }
	];

	const diPeta = $derived(page.url.pathname === '/peta');
	let menuTerbuka = $state(false);
	$effect(() => {
		void page.url.pathname;
		menuTerbuka = false;
	});
</script>

{#if navigating.to}
	<div class="progres-nav" role="progressbar" aria-label="Memuat halaman"></div>
{/if}

<div class="flex min-h-dvh flex-col">
	<a
		href="#konten-utama"
		class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-1.5 focus:text-white"
	>
		Lompat ke konten utama
	</a>

	<header class="sticky top-0 z-40 border-b border-line bg-surface">
		<nav
			class="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6"
			aria-label="Navigasi utama"
		>
			<a href="/" class="flex items-center gap-2.5" aria-label="TransitWarga, beranda">
				<span class="grid h-7 w-7 place-items-center rounded-[6px] bg-ink text-white">
					<MapPinned size={16} strokeWidth={2} />
				</span>
				<span class="text-[16px] font-semibold tracking-tight text-ink">TransitWarga</span>
			</a>

			<ul class="hidden flex-1 items-center gap-0.5 md:flex">
				{#each menu as item (item.href)}
					{@const aktif = page.url.pathname === item.href}
					<li>
						<a
							href={item.href}
							class={aktif
								? 'rounded-[6px] bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-2'
								: 'rounded-[6px] px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-line-2 hover:text-ink'}
							aria-current={aktif ? 'page' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>

			{#if !diPeta}
				<a href="/peta" class="btn btn-primary btn-sm ml-auto hidden md:inline-flex">Buka peta</a>
			{/if}

			<button
				type="button"
				class="btn btn-sm ml-auto md:hidden"
				aria-expanded={menuTerbuka}
				aria-controls="menu-mobile"
				onclick={() => (menuTerbuka = !menuTerbuka)}
			>
				{#if menuTerbuka}<X size={16} />{:else}<Menu size={16} />{/if}
				{menuTerbuka ? 'Tutup' : 'Menu'}
			</button>
		</nav>
		{#if menuTerbuka}
			<ul id="menu-mobile" class="border-t border-line bg-surface px-4 py-2 md:hidden">
				<li>
					<a href="/" class="block rounded-[6px] px-2 py-2 text-sm font-medium text-ink-2"
						>Beranda</a
					>
				</li>
				{#each menu as item (item.href)}
					<li>
						<a
							href={item.href}
							class="block rounded-[6px] px-2 py-2 text-sm font-medium text-ink-2"
							aria-current={page.url.pathname === item.href ? 'page' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</header>

	<main id="konten-utama" class={diPeta ? 'flex-1' : 'flex-1 pb-20 md:pb-0'}>
		{@render children()}
	</main>

	{#if !diPeta}
		<footer class="hidden border-t border-line bg-surface md:block">
			<div
				class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[12.5px] text-muted"
			>
				<span>TransitWarga. Peta ekonomi informal di ekosistem transportasi massal Jakarta.</span>
				<span>Tim Devunder, Universitas Bina Nusantara.</span>
			</div>
		</footer>
	{/if}

	<BottomNav />
</div>
