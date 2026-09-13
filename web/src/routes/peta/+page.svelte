<script lang="ts">
	import { browser } from '$app/environment';
	import AsistenDock from '$lib/components/AsistenDock.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import KawasanPanel from '$lib/components/KawasanPanel.svelte';
	import LayerControl from '$lib/components/LayerControl.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import TypologyLegend from '$lib/components/TypologyLegend.svelte';
	import { filters } from '$lib/stores/filters.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import { masukSheet } from '$lib/utils/motion';
	import type { Component } from 'svelte';
	import Layers from '@lucide/svelte/icons/layers';
	import List from '@lucide/svelte/icons/list';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';

	type Panel = 'filter' | 'layer' | 'legenda';

	const TAB: { id: Panel; label: string; ikon: Component<{ size?: number }> }[] = [
		{ id: 'filter', label: 'Filter', ikon: SlidersHorizontal },
		{ id: 'layer', label: 'Layer', ikon: Layers },
		{ id: 'legenda', label: 'Legenda', ikon: List }
	];

	/**
	 * 'auto' = belum disentuh: desktop membuka Filter, layar sempit semua tertutup,
	 * tanpa layout shift pasca-hidrasi. null = sidebar dilipat / sheet ditutup.
	 */
	let panelAktif = $state<Panel | 'auto' | null>('auto');
	const desktop = $derived(browser && window.matchMedia('(min-width: 768px)').matches);
	const efektifPanel = $derived(panelAktif === 'auto' ? (desktop ? 'filter' : null) : panelAktif);
	/**
	 * Sidebar dirender saat prerender (HTML desktop siap tanpa layout shift) dan
	 * setelah hidrasi hanya di desktop, supaya testid tidak ganda dengan versi ponsel.
	 */
	const tampilAside = $derived(!browser || desktop);

	function togglePanel(p: Panel) {
		panelAktif = efektifPanel === p ? null : p;
	}

	const judulPanel: Record<Panel, string> = {
		filter: 'Filter data',
		layer: 'Layer dan basemap',
		legenda: 'Legenda'
	};
</script>

<svelte:head>
	<title>Peta kawasan</title>
	<meta
		name="description"
		content="Peta interaktif ekonomi informal di sekitar stasiun MRT dan halte TransJakarta dengan tipologi kawasan, filter, dan asisten AI."
	/>
	<link rel="preconnect" href="https://basemap.mapid.io" crossorigin="" />
	<link rel="dns-prefetch" href="https://maputnik.github.io" />
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && efektifPanel && !desktop) panelAktif = null;
	}}
/>

{#snippet isiPanel(p: Panel)}
	{#if p === 'filter'}
		<FilterBar />
	{:else if p === 'layer'}
		<LayerControl />
	{:else}
		<TypologyLegend />
	{/if}
{/snippet}

<div class="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
	<!-- Sidebar desktop: docked, bisa dilipat jadi rail -->
	<aside
		class={`hidden shrink-0 flex-col border-r border-line bg-surface md:flex ${efektifPanel ? 'w-[320px]' : 'w-14'}`}
		aria-label="Panel kontrol peta"
	>
		<nav
			class={`flex ${efektifPanel ? 'items-center gap-1 border-b border-line px-2 py-2' : 'flex-col items-center gap-1 py-2'}`}
			aria-label="Kontrol peta"
		>
			{#each TAB as t (t.id)}
				<button
					type="button"
					class={`btn btn-sm gap-1.5 ${efektifPanel ? 'flex-1' : 'h-9 w-9 px-0'} ${efektifPanel === t.id ? 'border-ink bg-ink text-white hover:bg-ink' : 'btn-ghost'}`}
					aria-label={t.label}
					aria-expanded={efektifPanel === t.id}
					title={t.label}
					onclick={() => togglePanel(t.id)}
					data-testid={tampilAside ? `btn-panel-${t.id}` : undefined}
				>
					<t.ikon size={15} />
					{#if efektifPanel}{t.label}{/if}
					{#if t.id === 'filter' && filters.aktif}
						<span class="ml-0.5 h-1.5 w-1.5 rounded-full bg-signal" aria-label="Filter aktif"
						></span>
					{/if}
				</button>
			{/each}
			{#if efektifPanel}
				<button
					type="button"
					class="btn btn-ghost btn-sm h-8 w-8 px-0"
					aria-label="Lipat panel"
					onclick={() => (panelAktif = null)}
				>
					<PanelLeftClose size={15} />
				</button>
			{/if}
		</nav>
		{#if efektifPanel && tampilAside}
			<div class="border-b border-line px-3 py-2.5">
				<SearchBox testid={tampilAside ? 'search' : undefined} />
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto px-3 py-3" data-testid={`panel-${efektifPanel}`}>
				<h2 class="mb-3 text-[13px] font-semibold text-ink">{judulPanel[efektifPanel]}</h2>
				{@render isiPanel(efektifPanel)}
			</div>
		{/if}
	</aside>

	<div class="relative min-w-0 flex-1">
		{#if browser}
			{#await import('$lib/components/MapView.svelte') then MapViewModule}
				<MapViewModule.default />
			{/await}
		{/if}

		{#if !mapStore.mapSiap}
			<div
				class="absolute inset-0 z-20 grid place-items-center bg-paper"
				aria-live="polite"
				data-testid="map-loading"
			>
				<div class="flex flex-col items-center gap-3 text-ink-2">
					<LoaderCircle size={22} class="animate-spin text-accent" />
					<p class="text-sm font-medium">Memuat peta dan layer kawasan</p>
				</div>
			</div>
		{/if}

		<!-- Ponsel: pencarian mengambang di atas peta -->
		<div class="absolute top-3 right-3 left-3 z-10 md:hidden">
			<SearchBox testid={tampilAside ? undefined : 'search'} />
		</div>

		<KawasanPanel />
		<AsistenDock />

		<!-- Ponsel: toolbar bawah -->
		<nav
			class="absolute inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
			aria-label="Kontrol peta ponsel"
		>
			{#each TAB as t (t.id)}
				<button
					type="button"
					class={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${efektifPanel === t.id ? 'text-accent-2' : 'text-ink-2'}`}
					aria-expanded={efektifPanel === t.id}
					onclick={() => togglePanel(t.id)}
					data-testid={tampilAside ? undefined : `btn-panel-${t.id}`}
				>
					<t.ikon size={18} />
					{t.label}
				</button>
			{/each}
			<button
				type="button"
				class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-2"
				onclick={() => (mapStore.asistenTerbuka = true)}
				data-testid="btn-panel-asisten"
			>
				<Sparkles size={18} />
				Asisten
			</button>
		</nav>

		{#if efektifPanel && !desktop}
			<section
				class="panel-float fixed inset-x-0 bottom-14 z-40 flex max-h-[62dvh] flex-col rounded-b-none md:hidden"
				transition:masukSheet
				aria-label={judulPanel[efektifPanel]}
				data-testid={`panel-${efektifPanel}`}
			>
				<header class="flex items-center justify-between border-b border-line px-3.5 py-2.5">
					<h2 class="text-[13.5px] font-semibold text-ink">{judulPanel[efektifPanel]}</h2>
					<button
						type="button"
						class="btn btn-ghost btn-sm h-8 w-8 px-0"
						aria-label="Tutup panel"
						onclick={() => (panelAktif = null)}
					>
						<X size={16} />
					</button>
				</header>
				<div class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
					{@render isiPanel(efektifPanel)}
				</div>
			</section>
		{/if}
	</div>
</div>
