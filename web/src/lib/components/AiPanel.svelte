<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { streamChat } from '$lib/ai/chatClient';
	import { fetchSummary, SummaryError, type SummaryData } from '$lib/ai/summaryClient';
	import { loadAgregat } from '$lib/data/agregat';
	import { handleAksiPeta } from '$lib/map/actions';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import { formatPersen, formatRupiah } from '$lib/utils/format';
	import TurnstileWidget from './TurnstileWidget.svelte';

	let summary = $state<SummaryData | null>(null);
	let summaryError = $state<string | null>(null);
	let memuatSummary = $state(false);
	let input = $state('');
	let knownIds = new Set<string>();

	$effect(() => {
		loadAgregat()
			.then((a) => (knownIds = new Set(a.kawasan.map((k) => k.kawasan_id))))
			.catch(() => (knownIds = new Set()));
	});

	// Klik kawasan -> ambil ringkasan AI (ter-cache di KV + CDN).
	$effect(() => {
		const id = mapStore.kawasanAktif;
		summary = null;
		summaryError = null;
		if (!id) return;
		memuatSummary = true;
		fetchSummary(id)
			.then((s) => {
				if (mapStore.kawasanAktif === id) summary = s;
			})
			.catch((e: unknown) => {
				summaryError =
					e instanceof SummaryError ? e.message : 'Ringkasan AI tidak dapat dimuat saat ini.';
			})
			.finally(() => (memuatSummary = false));
	});

	const butuhTurnstile = $derived(
		Boolean(env.PUBLIC_TURNSTILE_SITE_KEY) &&
			!chatStore.sesiTerverifikasi &&
			!chatStore.turnstileToken
	);

	async function kirim(e: SubmitEvent) {
		e.preventDefault();
		const teks = input.trim();
		if (!teks || chatStore.sedangMengirim || butuhTurnstile) return;
		input = '';
		chatStore.error = null;
		chatStore.tambahUser(teks);
		chatStore.sedangMengirim = true;
		chatStore.streamingText = '';
		await streamChat(
			{
				session_id: chatStore.sessionId,
				turnstile_token: chatStore.turnstileToken ?? undefined,
				messages: chatStore.messages.slice(-10),
				map_context: { kawasan_aktif: mapStore.kawasanAktif }
			},
			{
				onDelta: (t) => {
					chatStore.streamingText = (chatStore.streamingText ?? '') + t;
				},
				onMapAction: (aksi) => {
					handleAksiPeta(aksi, knownIds);
				},
				onDone: () => {
					chatStore.sesiTerverifikasi = true;
					chatStore.selesaikanStreaming();
				},
				onError: (err) => {
					chatStore.error = err.message;
					chatStore.selesaikanStreaming();
				}
			}
		);
		chatStore.sedangMengirim = false;
	}
</script>

<section class="mt-4 border-t border-white/40 pt-3" data-testid="ai-panel">
	<h3 class="text-xs font-black text-black uppercase">Ringkasan AI</h3>

	{#if memuatSummary}
		<!-- Skeleton shimmer: AI sedang menyusun narasi dari data kawasan -->
		<div class="mt-2 space-y-1.5" data-testid="ai-summary-loading" aria-live="polite">
			<div class="shimmer h-3 w-full rounded-full"></div>
			<div class="shimmer h-3 w-11/12 rounded-full"></div>
			<div class="shimmer h-3 w-4/6 rounded-full"></div>
			<p class="text-black font-extrabold flex items-center gap-1.5 pt-0.5 text-xs">
				<span class="titik-berpikir inline-flex gap-0.5"
					><span></span><span></span><span></span></span
				>
				Menganalisis data kawasan…
			</p>
		</div>
	{:else if summary}
		<!-- Narasi AI selalu teks murni — tanpa {@html} (aturan keamanan). -->
		<p class="mt-1.5 text-sm font-extrabold leading-relaxed text-black" data-testid="ai-summary">
			{summary.narasi}
		</p>
		<dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-extrabold text-black">
			<div>
				<dt class="inline font-bold">Usaha:</dt>
				<dd class="inline font-black text-black">{summary.indikator.n_usaha}</dd>
			</div>
			<div>
				<dt class="inline font-bold">Median:</dt>
				<dd class="inline font-black text-black">{formatRupiah(summary.indikator.harga_median)}</dd>
			</div>
			<div>
				<dt class="inline font-bold">Digital:</dt>
				<dd class="inline font-black text-black">{formatPersen(summary.indikator.pct_digital)}</dd>
			</div>
		</dl>
	{:else if summaryError}
		<p class="mt-1.5 text-xs font-bold text-amber-700" data-testid="ai-summary-error">
			{summaryError}
		</p>
	{/if}

	<h3 class="mt-4 text-xs font-black text-black uppercase">Tanya kebijakan</h3>
	<ul
		class="liquid-glass-scroll mt-2 max-h-56 space-y-2 overflow-y-auto rounded-2xl p-1.5"
		data-testid="chat-messages"
	>
		{#each chatStore.messages as pesan, i (i)}
			<li
				class={pesan.role === 'user'
					? 'liquid-glass-inner ml-6 rounded-xl p-2.5 text-sm font-extrabold text-black shadow-sm'
					: 'liquid-glass mr-6 rounded-xl p-2.5 text-sm font-extrabold text-black shadow-sm'}
				data-role={pesan.role}
			>
				{pesan.content}
			</li>
		{/each}
		{#if chatStore.streamingText !== null}
			{#if chatStore.streamingText === ''}
				<!-- AI sedang berpikir: belum ada delta pertama -->
				<li
					class="liquid-glass mr-6 flex w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold text-black"
					data-role="assistant"
					data-testid="chat-berpikir"
					aria-label="Asisten sedang menganalisis"
				>
					<span class="titik-berpikir inline-flex gap-1"
						><span></span><span></span><span></span></span
					>
					<span class="text-xs font-bold text-black">menganalisis…</span>
				</li>
			{:else}
				<li
					class="liquid-glass mr-6 rounded-xl p-2.5 text-sm font-extrabold text-black"
					data-role="assistant"
					data-testid="chat-streaming"
				>
					{chatStore.streamingText}<span
						class="bg-slate-950 ml-0.5 inline-block h-3.5 w-0.75 animate-pulse rounded-full align-middle"
					></span>
				</li>
			{/if}
		{/if}
	</ul>
	{#if chatStore.error}
		<p class="mt-2 text-xs font-bold text-amber-700" data-testid="chat-error">{chatStore.error}</p>
	{/if}
	{#if mapStore.compareTarget}
		<a
			class="mt-2 inline-block text-xs font-extrabold text-black underline underline-offset-2 hover:text-slate-800"
			href={`/analisis?a=${encodeURIComponent(mapStore.compareTarget[0])}&b=${encodeURIComponent(mapStore.compareTarget[1])}`}
			data-testid="link-compare"
		>
			Lihat perbandingan lengkap di halaman Analisis →
		</a>
	{/if}

	{#if butuhTurnstile}
		<TurnstileWidget onToken={(t) => (chatStore.turnstileToken = t)} />
		<p class="text-xs font-bold text-black/70">
			Selesaikan verifikasi di atas untuk mulai bertanya.
		</p>
	{/if}

	<form class="mt-2 flex gap-2" onsubmit={kirim}>
		<label class="sr-only" for="chat-input">Pertanyaan untuk asisten kebijakan</label>
		<input
			id="chat-input"
			class="liquid-glass-inner min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-extrabold text-black placeholder:text-black/60 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
			placeholder="Mis. kawasan mana yang butuh penataan?"
			maxlength="500"
			bind:value={input}
			data-testid="chat-input"
		/>
		<button
			type="submit"
			class="rounded-xl bg-slate-950 px-3 py-2 text-sm font-extrabold text-white shadow-md hover:bg-black disabled:opacity-50"
			disabled={chatStore.sedangMengirim || butuhTurnstile}
			data-testid="chat-kirim"
		>
			{chatStore.sedangMengirim ? '…' : 'Kirim'}
		</button>
	</form>
</section>
