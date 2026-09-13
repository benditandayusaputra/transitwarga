<script lang="ts">
	import { BASEMAP_LABELS, daftarBasemap, type BasemapPilihan } from '$lib/map/initMap';
	import { LAYER_GROUPS, LAYER_GROUP_LABELS, type LayerGroup } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import type { Component } from 'svelte';
	import Building2 from '@lucide/svelte/icons/building-2';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Layers from '@lucide/svelte/icons/layers';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Moon from '@lucide/svelte/icons/moon';
	import Route from '@lucide/svelte/icons/route';
	import Satellite from '@lucide/svelte/icons/satellite';
	import Store from '@lucide/svelte/icons/store';
	import Sun from '@lucide/svelte/icons/sun';
	import TrainFront from '@lucide/svelte/icons/train-front';

	type Ikon = Component<{ size?: number }>;
	const groups = Object.keys(LAYER_GROUPS) as LayerGroup[];
	const GROUP_ICONS: Record<LayerGroup, Ikon> = {
		kawasan_buffer: Layers,
		usaha: Store,
		transit: TrainFront,
		survey: ClipboardCheck
	};
	const basemaps = daftarBasemap();
	const BASEMAP_ICONS: Record<BasemapPilihan, Ikon> = {
		basic: Route,
		'street-2d-building': Building2,
		satellite: Satellite,
		dark: Moon,
		light: Sun
	};
	const KETERANGAN: Record<LayerGroup, string> = {
		kawasan_buffer: 'Diwarnai menurut tipologi',
		usaha: 'Menu Go dan hasil survey',
		transit: 'MRT dan TransJakarta',
		survey: 'Observasi tim, foto dan narasi'
	};
	void MapPin;
</script>

<div class="space-y-5">
	<fieldset>
		<legend class="label mb-1.5">Layer data</legend>
		<ul class="divide-y divide-line-2 rounded-[8px] border border-line">
			{#each groups as group (group)}
				{@const Ikon = GROUP_ICONS[group]}
				<li>
					<label class="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-line-2">
						<input
							type="checkbox"
							class="h-4 w-4 accent-[var(--color-accent)]"
							checked={mapStore.layerVisibility[group]}
							onchange={() => mapStore.toggleLayer(group)}
							data-testid={`layer-toggle-${group}`}
						/>
						<span class="text-ink-2"><Ikon size={15} /></span>
						<span class="min-w-0 flex-1">
							<span class="block text-[13px] font-medium text-ink">{LAYER_GROUP_LABELS[group]}</span
							>
							<span class="block text-[11.5px] text-muted">{KETERANGAN[group]}</span>
						</span>
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>

	<fieldset>
		<legend class="label mb-1.5">Basemap MAPID</legend>
		<div class="grid grid-cols-2 gap-1.5" role="group" aria-label="Pilih basemap">
			{#each basemaps as b (b)}
				{@const Ikon = BASEMAP_ICONS[b]}
				<button
					type="button"
					class={`btn btn-sm justify-start gap-2 ${mapStore.basemap === b ? 'border-ink bg-ink text-white hover:bg-ink' : ''}`}
					aria-pressed={mapStore.basemap === b}
					onclick={() => (mapStore.basemap = b)}
					data-testid={`basemap-${b}`}
				>
					<Ikon size={14} />
					{BASEMAP_LABELS[b]}
				</button>
			{/each}
		</div>
	</fieldset>
</div>
