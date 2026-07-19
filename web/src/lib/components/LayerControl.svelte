<script lang="ts">
	import { daftarBasemap, type BasemapPilihan } from '$lib/map/initMap';
	import { LAYER_GROUPS, LAYER_GROUP_LABELS, type LayerGroup } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	const groups = Object.keys(LAYER_GROUPS) as LayerGroup[];
	const GROUP_ICONS: Record<LayerGroup, IconName> = {
		kawasan_buffer: 'layer',
		usaha: 'pin',
		transit: 'transit'
	};

	const basemaps = daftarBasemap();
	const BASEMAP_META: Record<BasemapPilihan, { label: string; icon: IconName }> = {
		jalan: { label: 'Jalan', icon: 'jalan' },
		satelit: { label: 'Satelit', icon: 'satelit' },
		mapid: { label: 'MAPID', icon: 'layer' }
	};
</script>

<div class="space-y-3">
	<fieldset>
		<legend class="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
			Layer data
		</legend>
		<ul class="space-y-1">
			{#each groups as group (group)}
				<li>
					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
					>
						<input
							type="checkbox"
							class="accent-primary-700"
							checked={mapStore.layerVisibility[group]}
							onchange={() => mapStore.toggleLayer(group)}
							data-testid={`layer-toggle-${group}`}
						/>
						<span class="text-slate-400"><Icon name={GROUP_ICONS[group]} size={15} /></span>
						{LAYER_GROUP_LABELS[group]}
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>

	<fieldset>
		<legend class="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
			Basemap
		</legend>
		<div class="grid grid-cols-2 gap-1.5" role="group" aria-label="Pilih basemap">
			{#each basemaps as b (b)}
				<button
					type="button"
					class={mapStore.basemap === b
						? 'flex items-center justify-center gap-1.5 rounded-lg bg-primary-700 px-2 py-1.5 text-xs font-semibold text-white'
						: 'flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-primary-600 hover:text-primary-700'}
					aria-pressed={mapStore.basemap === b}
					onclick={() => (mapStore.basemap = b)}
					data-testid={`basemap-${b}`}
				>
					<Icon name={BASEMAP_META[b].icon} size={14} />
					{BASEMAP_META[b].label}
				</button>
			{/each}
		</div>
	</fieldset>
</div>
