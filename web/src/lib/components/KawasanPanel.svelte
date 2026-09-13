<script lang="ts">
	import { findKawasan, loadAgregat } from '$lib/data/agregat';
	import { MODA_LABELS, TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import { mapStore } from '$lib/stores/map.svelte';
	import { formatPersen, formatRupiah } from '$lib/utils/format';
	import { masukDialog, masukSheet, pudar } from '$lib/utils/motion';
	import type { AgregatPayload } from '$lib/types';
	import AngkaNaik from './AngkaNaik.svelte';
	import DataTable from './DataTable.svelte';
	import RingkasanAi from './RingkasanAi.svelte';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import Minimize2 from '@lucide/svelte/icons/minimize-2';
	import X from '@lucide/svelte/icons/x';
	import Banknote from '@lucide/svelte/icons/banknote';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import Store from '@lucide/svelte/icons/store';

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

	let dialogEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (mapStore.detailPenuh && dialogEl) dialogEl.focus();
	});
</script>

{#snippet judulKawasan()}
	{#if stats}
		<div class="min-w-0">
			<p class="text-[12px] font-medium text-muted">{MODA_LABELS[stats.moda] ?? stats.moda}</p>
			<h2 class="truncate text-[18px] font-semibold tracking-tight text-ink">{stats.nama}</h2>
			<span
				class="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium text-white"
				style:background-color={TIPOLOGI_COLORS[stats.tipologi]}
			>
				{TIPOLOGI_LABELS[stats.tipologi]}
			</span>
		</div>
	{/if}
{/snippet}

{#snippet konten(lebar: boolean)}
	{#if stats}
		<dl class={`mt-4 grid gap-2 ${lebar ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
			<div class="rounded-[8px] border border-line px-3 py-2.5">
				<dt class="label flex items-center gap-1"><Store size={12} /> Usaha dalam 400 m</dt>
				<dd class="num text-lg"><AngkaNaik nilai={stats.n_usaha_400} /></dd>
			</div>
			<div class="rounded-[8px] border border-line px-3 py-2.5">
				<dt class="label flex items-center gap-1"><Store size={12} /> Usaha dalam 800 m</dt>
				<dd class="num text-lg"><AngkaNaik nilai={stats.n_usaha_800} /></dd>
			</div>
			<div class="rounded-[8px] border border-line px-3 py-2.5">
				<dt class="label flex items-center gap-1"><Banknote size={12} /> Harga median</dt>
				<dd class="num text-lg"><AngkaNaik nilai={stats.harga_median} format={formatRupiah} /></dd>
			</div>
			<div class="rounded-[8px] border border-line px-3 py-2.5">
				<dt class="label flex items-center gap-1"><QrCode size={12} /> Transaksi digital</dt>
				<dd class="num text-lg"><AngkaNaik nilai={stats.pct_digital} format={formatPersen} /></dd>
			</div>
		</dl>

		<ul
			class={`mt-4 gap-x-6 gap-y-2.5 ${lebar ? 'grid sm:grid-cols-2' : 'space-y-2.5'}`}
			aria-label="Empat skor pembentuk tipologi"
		>
			{#each skorList as skor, i (skor.label)}
				<li class="text-[12.5px]">
					<div class="flex justify-between">
						<span class="text-ink-2">{skor.label}</span>
						<span class="num"><AngkaNaik nilai={skor.nilai} /></span>
					</div>
					<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line-2">
						<div
							class="bar-tumbuh h-full rounded-full bg-ink"
							style:width={`${Math.min(100, Math.max(0, skor.nilai))}%`}
							style:animation-delay={`${i * 60}ms`}
						></div>
					</div>
				</li>
			{/each}
		</ul>

		<RingkasanAi />

		<h3 class="mt-4 mb-2 text-[13px] font-semibold text-ink">
			Usaha pada kawasan <span class="num text-muted">({mapStore.usahaTerpilih.length})</span>
		</h3>
		<DataTable rows={mapStore.usahaTerpilih} maksTinggi={lebar ? 'max-h-80' : 'max-h-56'} />
	{/if}
{/snippet}

{#if stats && mapStore.detailPenuh}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
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
			class="panel-float flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden max-sm:rounded-b-none sm:max-h-[88dvh]"
			transition:masukDialog
			role="dialog"
			aria-modal="true"
			aria-label={`Detail kawasan ${stats.nama}`}
			tabindex="-1"
			data-testid="kawasan-dialog"
		>
			<header class="flex items-start justify-between gap-2 border-b border-line p-4 sm:p-5">
				{@render judulKawasan()}
				<div class="flex gap-1">
					<button
						type="button"
						class="btn btn-ghost btn-sm h-8 w-8 px-0"
						aria-label="Perkecil ke panel samping"
						onclick={() => (mapStore.detailPenuh = false)}
						data-testid="kawasan-perkecil"
					>
						<Minimize2 size={15} />
					</button>
					<button
						type="button"
						class="btn btn-ghost btn-sm h-8 w-8 px-0"
						aria-label="Tutup detail kawasan"
						onclick={() => mapStore.pilihKawasan(null)}
					>
						<X size={16} />
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
		class="panel-float fixed inset-x-0 bottom-0 z-30 max-h-[62dvh] overflow-y-auto rounded-b-none p-4 md:absolute md:inset-x-auto md:top-3 md:right-3 md:bottom-auto md:w-[384px] md:max-h-[calc(100%-1.5rem)] md:rounded-[var(--radius-panel)]"
		transition:masukSheet
		data-testid="kawasan-panel"
		aria-label={`Ringkasan kawasan ${stats.nama}`}
	>
		<div class="flex items-start justify-between gap-2">
			{@render judulKawasan()}
			<div class="flex shrink-0 gap-1">
				<button
					type="button"
					class="btn btn-ghost btn-sm h-8 w-8 px-0"
					aria-label="Perbesar jadi dialog penuh"
					onclick={() => (mapStore.detailPenuh = true)}
					data-testid="kawasan-perbesar"
				>
					<Maximize2 size={15} />
				</button>
				<button
					type="button"
					class="btn btn-ghost btn-sm h-8 w-8 px-0"
					aria-label="Tutup panel kawasan"
					data-testid="kawasan-panel-close"
					onclick={() => mapStore.pilihKawasan(null)}
				>
					<X size={16} />
				</button>
			</div>
		</div>
		{@render konten(false)}
	</aside>
{/if}
