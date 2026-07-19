<script lang="ts">
	import { browser } from '$app/environment';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
	import KawasanPanel from '$lib/components/KawasanPanel.svelte';
	import LayerControl from '$lib/components/LayerControl.svelte';
	import PanelCard from '$lib/components/PanelCard.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import TypologyLegend from '$lib/components/TypologyLegend.svelte';

	type Panel = 'filter' | 'layer' | 'legenda';

	const TOMBOL: { id: Panel; label: string; icon: IconName }[] = [
		{ id: 'filter', label: 'Filter data', icon: 'filter' },
		{ id: 'layer', label: 'Layer & basemap', icon: 'layer' },
		{ id: 'legenda', label: 'Legenda', icon: 'legenda' }
	];

	/**
	 * 'auto' = belum disentuh: default via CSS (desktop membuka Filter, layar
	 * sempit semua tertutup) supaya tanpa layout shift pasca-hidrasi.
	 * null = semua panel ditutup (peta bersih).
	 */
	let panelAktif = $state<Panel | 'auto' | null>('auto');
	const efektifPanel = $derived(
		panelAktif === 'auto'
			? browser && window.matchMedia('(min-width: 768px)').matches
				? 'filter'
				: null
			: panelAktif
	);

	function togglePanel(p: Panel) {
		panelAktif = efektifPanel === p ? null : p;
	}

	function tombolClass(p: Panel): string {
		const dasar =
			'flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none';
		if (panelAktif === 'auto' && p === 'filter') {
			// SSR/pra-hidrasi: aktif hanya di desktop (selaras panel auto via CSS)
			return `${dasar} text-slate-600 hover:bg-slate-100 md:bg-primary-700 md:text-white md:hover:bg-primary-800`;
		}
		return efektifPanel === p
			? `${dasar} bg-primary-700 text-white hover:bg-primary-800`
			: `${dasar} text-slate-600 hover:bg-slate-100`;
	}
</script>

<svelte:head>
	<title>Peta — TransitWarga</title>
	<meta
		name="description"
		content="Peta interaktif ekonomi informal di sekitar stasiun MRT dan halte TransJakarta"
	/>
	<!-- Percepat request tile basemap pertama (LCP) -->
	<link rel="preconnect" href="https://tile.openstreetmap.org" />
	<link rel="preconnect" href="https://tile.openstreetmap.org" crossorigin="" />
	<link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && efektifPanel) panelAktif = null;
	}}
/>

<div class="relative h-[calc(100dvh-3.25rem)] overflow-hidden">
	<!-- MapLibre hanya dimuat di browser; halaman tetap prerender (SEO + first load). -->
	{#if browser}
		{#await import('$lib/components/MapView.svelte') then MapViewModule}
			<MapViewModule.default />
		{/await}
	{/if}

	<!-- Kolom kontrol kiri-atas: pencarian, toolbar ikon, satu panel aktif -->
	<div class="absolute top-3 left-3 z-10 flex max-w-[calc(100%-4.5rem)] flex-col gap-2">
		<SearchBox />
		<div class="flex items-start gap-2">
			<nav
				class="flex shrink-0 flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm"
				aria-label="Kontrol peta"
			>
				{#each TOMBOL as t (t.id)}
					<button
						type="button"
						class={tombolClass(t.id)}
						aria-label={t.label}
						aria-expanded={efektifPanel === t.id}
						title={t.label}
						onclick={() => togglePanel(t.id)}
						data-testid={`btn-panel-${t.id}`}
					>
						<Icon name={t.icon} size={19} />
					</button>
				{/each}
			</nav>

			{#if panelAktif === 'auto'}
				<div class="hidden md:block">
					<PanelCard judul="Filter data" icon="filter" onTutup={() => (panelAktif = null)}>
						<FilterBar />
					</PanelCard>
				</div>
			{:else if efektifPanel === 'filter'}
				<PanelCard judul="Filter data" icon="filter" onTutup={() => (panelAktif = null)}>
					<FilterBar />
				</PanelCard>
			{:else if efektifPanel === 'layer'}
				<PanelCard
					judul="Layer & basemap"
					icon="layer"
					testid="panel-layer"
					onTutup={() => (panelAktif = null)}
				>
					<LayerControl />
				</PanelCard>
			{:else if efektifPanel === 'legenda'}
				<PanelCard
					judul="Legenda"
					icon="legenda"
					testid="panel-legenda"
					onTutup={() => (panelAktif = null)}
				>
					<TypologyLegend />
				</PanelCard>
			{/if}
		</div>
	</div>

	<KawasanPanel />
</div>
