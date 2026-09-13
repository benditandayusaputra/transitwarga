<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import House from '@lucide/svelte/icons/house';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import BookOpen from '@lucide/svelte/icons/book-open';

	const MENU: { href: string; label: string; ikon: Component<{ size?: number }> }[] = [
		{ href: '/', label: 'Beranda', ikon: House },
		{ href: '/peta', label: 'Peta', ikon: MapPinned },
		{ href: '/analisis', label: 'Analisis', ikon: ChartColumn },
		{ href: '/rekomendasi', label: 'Saran', ikon: Lightbulb },
		{ href: '/survey', label: 'Survey', ikon: ClipboardCheck },
		{ href: '/metodologi', label: 'Metode', ikon: BookOpen }
	];
</script>

{#if page.url.pathname !== '/peta'}
	<nav
		class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
		aria-label="Navigasi bawah"
		data-testid="bottom-nav"
	>
		<ul class="grid grid-cols-6">
			{#each MENU as item (item.href)}
				{@const aktif = page.url.pathname === item.href}
				<li>
					<a
						href={item.href}
						class={`flex flex-col items-center gap-1 py-2.5 text-[10.5px] ${aktif ? 'font-semibold text-accent-2' : 'font-medium text-ink-2'}`}
						aria-current={aktif ? 'page' : undefined}
					>
						<item.ikon size={18} />
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
