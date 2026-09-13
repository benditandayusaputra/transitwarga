<script lang="ts">
	import { filterUsaha } from '$lib/db/queries';
	import { JENIS_LABELS, MODA_LABELS, USAHA_MINZOOM } from '$lib/map/layers';
	import { filters } from '$lib/stores/filters.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import type { JenisTempat, Keramaian, Moda } from '$lib/types';
	import FilterX from '@lucide/svelte/icons/filter-x';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	const jenisList = Object.keys(JENIS_LABELS) as JenisTempat[];
	const keramaianList: { id: Keramaian; label: string }[] = [
		{ id: 'sepi', label: 'Sepi' },
		{ id: 'sedang', label: 'Sedang' },
		{ id: 'ramai', label: 'Ramai' }
	];
	const modaList: Moda[] = ['mrt', 'tj'];

	const surveyTopikList = [
		{ id: 'pkl', label: 'PKL dan kuliner' },
		{ id: 'trotoar', label: 'Trotoar dan akses' },
		{ id: 'parkir', label: 'Parkir dan ojek' },
		{ id: 'qris', label: 'QRIS dan digital' },
		{ id: 'transit', label: 'Stasiun dan halte' }
	];

	let hargaMin = $state('');
	let hargaMax = $state('');
	let menerapkanHarga = $state(false);
	let filterHargaGagal = $state(false);

	async function terapkanFilterHarga() {
		const min = hargaMin === '' ? undefined : Number(hargaMin);
		const max = hargaMax === '' ? undefined : Number(hargaMax);
		if (min === undefined && max === undefined) {
			filters.idWhitelist = null;
			return;
		}
		menerapkanHarga = true;
		filterHargaGagal = false;
		try {
			filters.idWhitelist = await filterUsaha({ hargaMin: min, hargaMax: max });
		} catch {
			filterHargaGagal = true;
			filters.idWhitelist = null;
		} finally {
			menerapkanHarga = false;
		}
	}

	function resetSemua() {
		hargaMin = '';
		hargaMax = '';
		filterHargaGagal = false;
		filters.reset();
	}
</script>

<div class="space-y-4" data-testid="filter-bar">
	<fieldset>
		<legend class="label mb-1.5">Jenis tempat</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each jenisList as j (j)}
				<button
					type="button"
					class="chip"
					aria-pressed={filters.jenisTempat.includes(j)}
					onclick={() => filters.toggle('jenisTempat', j)}
					data-testid={`filter-jenis-${j}`}
				>
					{JENIS_LABELS[j]}
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="label mb-1.5">Keramaian saat dicatat</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each keramaianList as k (k.id)}
				<button
					type="button"
					class="chip"
					aria-pressed={filters.keramaian.includes(k.id)}
					onclick={() => filters.toggle('keramaian', k.id)}
					data-testid={`filter-keramaian-${k.id}`}
				>
					{k.label}
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="label mb-1.5">Moda transit</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each modaList as m (m)}
				<button
					type="button"
					class="chip"
					aria-pressed={filters.moda.includes(m)}
					onclick={() => filters.toggle('moda', m)}
					data-testid={`filter-moda-${m}`}
				>
					{MODA_LABELS[m]}
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="label mb-1.5">Topik observasi lapangan</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each surveyTopikList as t (t.id)}
				<button
					type="button"
					class="chip"
					aria-pressed={filters.surveyTopik.includes(t.id)}
					onclick={() => filters.toggle('surveyTopik', t.id)}
					data-testid={`filter-topik-${t.id}`}
				>
					{t.label}
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="label mb-1.5">Harga per porsi (rupiah)</legend>
		<div class="flex items-center gap-1.5">
			<input
				type="number"
				class="input h-8 w-0 min-w-0 flex-1 px-2 text-[13px]"
				placeholder="Minimum"
				min="0"
				step="1000"
				bind:value={hargaMin}
				aria-label="Harga minimum"
				data-testid="filter-harga-min"
			/>
			<span class="text-[12px] text-muted">sampai</span>
			<input
				type="number"
				class="input h-8 w-0 min-w-0 flex-1 px-2 text-[13px]"
				placeholder="Maksimum"
				min="0"
				step="1000"
				bind:value={hargaMax}
				aria-label="Harga maksimum"
				data-testid="filter-harga-max"
			/>
			<button
				type="button"
				class="btn btn-primary btn-sm shrink-0"
				onclick={terapkanFilterHarga}
				disabled={menerapkanHarga}
				data-testid="filter-harga-terapkan"
			>
				{#if menerapkanHarga}<LoaderCircle size={14} class="animate-spin" />{:else}Terapkan{/if}
			</button>
		</div>
		{#if filterHargaGagal}
			<p class="mt-1.5 text-[12px] text-signal">Filter harga tidak tersedia di perangkat ini.</p>
		{/if}
	</fieldset>

	{#if filters.aktif}
		<button
			type="button"
			class="btn btn-sm w-full gap-1.5"
			onclick={resetSemua}
			data-testid="filter-reset"
		>
			<FilterX size={14} /> Hapus semua filter
		</button>
	{/if}
	{#if mapStore.viewport.zoom < USAHA_MINZOOM}
		<p
			class="rounded-[6px] bg-signal-soft px-2.5 py-2 text-[12px] text-ink"
			data-testid="hint-zoom"
		>
			Titik usaha tampil mulai zoom {USAHA_MINZOOM}. Perbesar peta untuk melihat efek filter.
		</p>
	{/if}
</div>
