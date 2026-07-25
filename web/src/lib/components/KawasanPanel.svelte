<script lang="ts">
	import { findKawasan, loadAgregat } from '$lib/data/agregat';
	import { MODA_LABELS, TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import { formatPersen, formatRupiah, formatSkor } from '$lib/utils/format';
	import { masukDialog, masukSheet, pudar } from '$lib/utils/motion';
	import type { AgregatPayload } from '$lib/types';
	import AiPanel from './AiPanel.svelte';
	import DataTable from './DataTable.svelte';
	import Icon from './Icon.svelte';

	let agregat = $state<AgregatPayload | null>(null);

	$effect(() => {
		loadAgregat()
			.then((a) => (agregat = a))
			.catch(() => (agregat = null));
	});

	const stats = $derived(
		agregat && mapStore.kawasanAktif ? findKawasan(agregat, mapStore.kawasanAktif) : undefined
	);

	const skorList = $derived(
		stats
			? [
					{ label: 'Kepadatan usaha', nilai: stats.skor_kepadatan },
					{ label: 'Keramaian', nilai: stats.skor_keramaian },
					{ label: 'Inklusi digital', nilai: stats.skor_digital },
					{ label: 'Friksi trotoar', nilai: stats.skor_friksi }
				]
			: []
	);

	// Fokus ke dialog saat dibuka (aksesibilitas keyboard/screen reader)
	let dialogEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (mapStore.detailPenuh && dialogEl) dialogEl.focus();
	});
</script>

{#snippet judulKawasan()}
	{#if stats}
		<div>
			<p class="text-xs font-semibold text-slate-400 uppercase">
				{MODA_LABELS[stats.moda] ?? stats.moda}
			</p>
			<h2 class="text-lg font-bold text-slate-900">{stats.nama}</h2>
			<span
				class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
				style:background-color={TIPOLOGI_COLORS[stats.tipologi]}
			>
				{TIPOLOGI_LABELS[stats.tipologi]}
			</span>
		</div>
	{/if}
{/snippet}

{#snippet konten(lebar: boolean)}
	{#if stats}
		<dl class={`mt-3 grid gap-2 text-sm ${lebar ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
			<div class="rounded-lg bg-slate-50 p-2.5">
				<dt class="text-xs text-slate-500">Usaha ≤400 m</dt>
				<dd class="text-lg font-bold text-slate-900">{stats.n_usaha_400}</dd>
			</div>
			<div class="rounded-lg bg-slate-50 p-2.5">
				<dt class="text-xs text-slate-500">Usaha ≤800 m</dt>
				<dd class="text-lg font-bold text-slate-900">{stats.n_usaha_800}</dd>
			</div>
			<div class="rounded-lg bg-slate-50 p-2.5">
				<dt class="text-xs text-slate-500">Harga median</dt>
				<dd class="text-lg font-bold text-slate-900">{formatRupiah(stats.harga_median)}</dd>
			</div>
			<div class="rounded-lg bg-slate-50 p-2.5">
				<dt class="text-xs text-slate-500">Transaksi digital</dt>
				<dd class="text-lg font-bold text-slate-900">{formatPersen(stats.pct_digital)}</dd>
			</div>
		</dl>

		<ul class={`mt-3 gap-x-6 gap-y-1.5 ${lebar ? 'grid sm:grid-cols-2' : 'space-y-1.5'}`}>
			{#each skorList as skor (skor.label)}
				<li class="text-xs text-slate-600">
					<div class="flex justify-between">
						<span>{skor.label}</span>
						<span class="font-semibold">{formatSkor(skor.nilai)}</span>
					</div>
					<div class="mt-0.5 h-1.5 w-full rounded-full bg-slate-100">
						<div
							class="bg-primary-600 h-1.5 rounded-full"
							style:width={`${Math.min(100, Math.max(0, skor.nilai))}%`}
						></div>
					</div>
				</li>
			{/each}
		</ul>

		<AiPanel />

		<h3 class="mt-4 mb-1.5 text-xs font-semibold text-slate-500 uppercase">
			Usaha pada kawasan ({mapStore.usahaTerpilih.length})
		</h3>
		<DataTable rows={mapStore.usahaTerpilih} maksTinggi={lebar ? 'max-h-80' : 'max-h-56'} />
	{/if}
{/snippet}

{#if stats && mapStore.detailPenuh}
	<!-- Mode dialog penuh: nyaman dibaca; klik backdrop / Escape memperkecil -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 backdrop-blur-sm sm:items-center sm:p-6"
		transition:pudar
		data-testid="kawasan-dialog-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) mapStore.detailPenuh = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				mapStore.detailPenuh = false;
			}
		}}
		role="presentation"
	>
		<div
			bind:this={dialogEl}
			class="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl max-sm:rounded-t-2xl sm:max-h-[88dvh] sm:rounded-2xl"
			transition:masukDialog
			role="dialog"
			aria-modal="true"
			aria-label={`Detail kawasan ${stats.nama}`}
			tabindex="-1"
			data-testid="kawasan-dialog"
		>
			<header class="flex items-start justify-between gap-2 border-b border-slate-100 p-4 sm:p-5">
				{@render judulKawasan()}
				<div class="flex gap-1">
					<button
						type="button"
						class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
						aria-label="Perkecil ke panel samping"
						onclick={() => (mapStore.detailPenuh = false)}
						data-testid="kawasan-perkecil"
					>
						<Icon name="perkecil" size={17} />
					</button>
					<button
						type="button"
						class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
						aria-label="Tutup detail kawasan"
						onclick={() => mapStore.pilihKawasan(null)}
					>
						<Icon name="tutup" size={17} />
					</button>
				</div>
			</header>
			<div class="overflow-y-auto p-4 sm:p-5">
				{@render konten(true)}
			</div>
		</div>
	</div>
{:else if stats}
	<aside
		class="fixed inset-x-0 bottom-0 z-30 max-h-[60dvh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl md:absolute md:top-4 md:right-4 md:bottom-auto md:inset-x-auto md:w-96 md:max-h-[calc(100%-2rem)] md:rounded-xl"
		transition:masukSheet
		data-testid="kawasan-panel"
		aria-label={`Ringkasan kawasan ${stats.nama}`}
	>
		<div class="flex items-start justify-between gap-2">
			{@render judulKawasan()}
			<div class="flex gap-1">
				<button
					type="button"
					class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
					aria-label="Perbesar jadi dialog penuh"
					onclick={() => (mapStore.detailPenuh = true)}
					data-testid="kawasan-perbesar"
				>
					<Icon name="perbesar" size={16} />
				</button>
				<button
					type="button"
					class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
					aria-label="Tutup panel kawasan"
					data-testid="kawasan-panel-close"
					onclick={() => mapStore.pilihKawasan(null)}
				>
					<Icon name="tutup" size={16} />
				</button>
			</div>
		</div>
		{@render konten(false)}
	</aside>
{/if}
