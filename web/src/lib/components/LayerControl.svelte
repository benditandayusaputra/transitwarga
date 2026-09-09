<script lang="ts">
	import { daftarBasemap, type BasemapPilihan } from '$lib/map/initMap';
	import { LAYER_GROUPS, LAYER_GROUP_LABELS, type LayerGroup } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	const groups = Object.keys(LAYER_GROUPS) as LayerGroup[];
	const GROUP_ICONS: Record<LayerGroup, IconName> = {
		kawasan_buffer: 'layer',
		usaha: 'pin',
		transit: 'transit',
		survey: 'survey'
	};

	const basemaps = daftarBasemap();
	const BASEMAP_META: Record<BasemapPilihan, { label: string; icon: IconName }> = {
		terang: { label: 'Terang', icon: 'terang' },
		jalan: { label: 'Jalan', icon: 'jalan' },
		satelit: { label: 'Satelit', icon: 'satelit' },
		mapid: { label: 'MAPID', icon: 'layer' }
	};
</script>

<div class="space-y-3">
	<fieldset>
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Layer data
		</legend>
		<ul class="space-y-1">
			{#each groups as group (group)}
				<li>
					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs font-extrabold text-black hover:bg-white/40"
					>
						<input
							type="checkbox"
							class="accent-slate-950"
							checked={mapStore.layerVisibility[group]}
							onchange={() => mapStore.toggleLayer(group)}
							data-testid={`layer-toggle-${group}`}
						/>
						<span class="text-black"><Icon name={GROUP_ICONS[group]} size={15} /></span>
						{LAYER_GROUP_LABELS[group]}
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>

	<fieldset>
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Basemap
		</legend>
		<div class="grid grid-cols-2 gap-1.5" role="group" aria-label="Pilih basemap">
			{#each basemaps as b (b)}
				<button
					type="button"
					class={mapStore.basemap === b
						? 'flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-2 py-1.5 text-xs font-extrabold text-white shadow-md'
						: 'liquid-glass-pill flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-extrabold text-black'}
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
