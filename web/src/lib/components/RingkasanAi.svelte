<script lang="ts">
	import { fetchSummary, SummaryError, type SummaryData } from '$lib/ai/summaryClient';
	import { mapStore } from '$lib/stores/map.svelte';
	import { formatPersen, formatRupiah } from '$lib/utils/format';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let summary = $state<SummaryData | null>(null);
	let summaryError = $state<string | null>(null);
	let memuat = $state(false);
	let tersalin = $state(false);

	// Klik kawasan -> ambil ringkasan AI (ter-cache di KV + CDN).
	$effect(() => {
		const id = mapStore.kawasanAktif;
		summary = null;
		summaryError = null;
		tersalin = false;
		if (!id) return;
		memuat = true;
		fetchSummary(id)
			.then((s) => {
				if (mapStore.kawasanAktif === id) summary = s;
			})
			.catch((e: unknown) => {
				summaryError =
					e instanceof SummaryError ? e.message : 'Ringkasan AI tidak dapat dimuat saat ini.';
			})
			.finally(() => (memuat = false));
	});

	async function salin() {
		if (!summary) return;
		try {
			await navigator.clipboard.writeText(summary.narasi);
			tersalin = true;
			setTimeout(() => (tersalin = false), 1800);
		} catch {
			tersalin = false;
		}
	}
</script>

<section
	class="mt-4 rounded-[8px] border border-line bg-paper p-3.5"
	data-testid="ai-panel"
	aria-busy={memuat}
>
	<div class="flex items-center justify-between gap-2">
		<h3 class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
			<Sparkles size={14} class="text-accent" /> Ringkasan AI
		</h3>
		{#if summary}
			<button
				type="button"
				class="btn btn-ghost btn-sm -mr-1.5 h-7 gap-1 px-2 text-[12px]"
				onclick={salin}
				aria-live="polite"
			>
				{#if tersalin}<Check size={13} /> Tersalin{:else}<Copy size={13} /> Salin{/if}
			</button>
		{/if}
	</div>

	{#if memuat}
		<div class="mt-2.5 space-y-2" data-testid="ai-summary-loading" aria-live="polite">
			<div class="shimmer h-3 w-full"></div>
			<div class="shimmer h-3 w-11/12"></div>
			<div class="shimmer h-3 w-4/6"></div>
			<p class="flex items-center gap-1.5 pt-1 text-[12px] text-muted">
				<span class="titik-berpikir inline-flex gap-0.5"
					><span></span><span></span><span></span></span
				>
				Menyusun narasi dari data kawasan
			</p>
		</div>
	{:else if summary}
		<!-- Narasi AI selalu teks murni, tanpa {@html} (aturan keamanan). -->
		<p class="mt-2 text-[13.5px] leading-6 text-ink" data-testid="ai-summary">{summary.narasi}</p>
		<dl class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
			<div>
				<dt class="inline">Usaha</dt>
				<dd class="num inline">{summary.indikator.n_usaha}</dd>
			</div>
			<div>
				<dt class="inline">Median</dt>
				<dd class="num inline">{formatRupiah(summary.indikator.harga_median)}</dd>
			</div>
			<div>
				<dt class="inline">Digital</dt>
				<dd class="num inline">{formatPersen(summary.indikator.pct_digital)}</dd>
			</div>
		</dl>
	{:else if summaryError}
		<p class="mt-2 text-[12.5px] text-signal" data-testid="ai-summary-error">{summaryError}</p>
	{/if}

	<button
		type="button"
		class="btn btn-sm mt-3 w-full gap-1.5"
		onclick={() => (mapStore.asistenTerbuka = true)}
		data-testid="buka-asisten-dari-panel"
	>
		<MessageSquareText size={14} /> Tanya asisten tentang kawasan ini
	</button>
</section>
