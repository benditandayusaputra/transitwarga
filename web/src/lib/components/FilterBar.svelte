<script lang="ts">
	import { filterUsaha } from '$lib/db/queries';
	import { JENIS_LABELS, MODA_LABELS, USAHA_MINZOOM } from '$lib/map/layers';
	import { filters } from '$lib/stores/filters.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import type { JenisTempat, Keramaian, Moda } from '$lib/types';

	const jenisList = Object.keys(JENIS_LABELS) as JenisTempat[];
	const keramaianList: Keramaian[] = ['sepi', 'sedang', 'ramai'];
	const modaList: Moda[] = ['mrt', 'tj'];

	// Filter numerik (fase analitik): DuckDB menghasilkan daftar id -> filter expression.
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

	function chipClass(active: boolean): string {
		return active
			? 'rounded-full bg-slate-950 px-2.5 py-1 text-xs font-extrabold text-white shadow-md transition-all'
			: 'liquid-glass-pill px-2.5 py-1 text-xs font-extrabold text-black transition-all hover:text-black';
	}
</script>

<div class="space-y-3" data-testid="filter-bar">
	<fieldset>
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Jenis tempat
		</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each jenisList as j (j)}
				<button
					type="button"
					class={chipClass(filters.jenisTempat.includes(j))}
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
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Keramaian
		</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each keramaianList as k (k)}
				<button
					type="button"
					class={chipClass(filters.keramaian.includes(k))}
					aria-pressed={filters.keramaian.includes(k)}
					onclick={() => filters.toggle('keramaian', k)}
					data-testid={`filter-keramaian-${k}`}
				>
					<span class="capitalize">{k}</span>
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Moda transit
		</legend>
		<div class="flex flex-wrap gap-1.5">
			{#each modaList as m (m)}
				<button
					type="button"
					class={chipClass(filters.moda.includes(m))}
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
		<legend class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Harga per porsi (Rp)
		</legend>
		<div class="flex items-center gap-1.5">
			<input
				type="number"
				class="liquid-glass-inner w-0 min-w-0 flex-1 rounded-xl px-2 py-1.5 text-xs font-extrabold text-black placeholder:text-black/60 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
				placeholder="min"
				min="0"
				step="1000"
				bind:value={hargaMin}
				aria-label="Harga minimum"
				data-testid="filter-harga-min"
			/>
			<span class="text-xs font-black text-black">–</span>
			<input
				type="number"
				class="liquid-glass-inner w-0 min-w-0 flex-1 rounded-xl px-2 py-1.5 text-xs font-extrabold text-black placeholder:text-black/60 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
				placeholder="maks"
				min="0"
				step="1000"
				bind:value={hargaMax}
				aria-label="Harga maksimum"
				data-testid="filter-harga-max"
			/>
			<button
				type="button"
				class="rounded-xl bg-slate-950 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-md hover:bg-black disabled:opacity-50"
				onclick={terapkanFilterHarga}
				disabled={menerapkanHarga}
				data-testid="filter-harga-terapkan"
			>
				{menerapkanHarga ? '…' : 'Terapkan'}
			</button>
		</div>
		{#if filterHargaGagal}
			<p class="mt-1.5 text-xs font-bold text-amber-700">Filter harga tidak tersedia di perangkat ini.</p>
		{/if}
	</fieldset>

	{#if filters.aktif}
		<button
			type="button"
			class="text-xs font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700"
			onclick={resetSemua}
			data-testid="filter-reset"
		>
			Reset semua filter
		</button>
	{/if}
	{#if mapStore.viewport.zoom < USAHA_MINZOOM}
		<p class="rounded-lg bg-amber-50 p-2 text-xs text-amber-700" data-testid="hint-zoom">
			Titik usaha tampil mulai zoom {USAHA_MINZOOM} — perbesar peta untuk melihat efek filter.
		</p>
	{/if}
</div>
