<script lang="ts">
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { streamChat } from '$lib/ai/chatClient';
	import { loadAgregat } from '$lib/data/agregat';
	import { handleAksiPeta } from '$lib/map/actions';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { mapStore } from '$lib/stores/map.svelte';
	import { masukSheet } from '$lib/utils/motion';
	import type { AgregatKawasan } from '$lib/types';
	import TurnstileWidget from './TurnstileWidget.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Send from '@lucide/svelte/icons/send';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';

	let input = $state('');
	let knownIds = new Set<string>();
	let daftarKawasan = $state<AgregatKawasan[]>([]);
	let daftarEl = $state<HTMLElement | null>(null);

	$effect(() => {
		loadAgregat()
			.then((a) => {
				daftarKawasan = a.kawasan;
				knownIds = new Set(a.kawasan.map((k) => k.kawasan_id));
			})
			.catch(() => (knownIds = new Set()));
	});

	const terbuka = $derived(
		mapStore.asistenTerbuka ?? (browser && window.matchMedia('(min-width: 768px)').matches)
	);

	const kawasanAktif = $derived(
		daftarKawasan.find((k) => k.kawasan_id === mapStore.kawasanAktif) ?? null
	);

	const butuhTurnstile = $derived(
		Boolean(env.PUBLIC_TURNSTILE_SITE_KEY) &&
			!chatStore.sesiTerverifikasi &&
			!chatStore.turnstileToken
	);

	const contoh = [
		'Kawasan mana yang lapaknya paling menutup trotoar?',
		'Di mana pedagang banyak tetapi pembayaran masih tunai?',
		'Bandingkan Blok M dengan Senayan'
	];

	// Gulir ke pesan terbaru saat ada perubahan.
	$effect(() => {
		void chatStore.messages.length;
		void chatStore.streamingText;
		if (daftarEl) daftarEl.scrollTop = daftarEl.scrollHeight;
	});

	async function kirimTeks(teks: string) {
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
				onMapAction: (aksi) => handleAksiPeta(aksi, knownIds),
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

	function kirim(e: SubmitEvent) {
		e.preventDefault();
		void kirimTeks(input.trim());
	}
</script>

{#if terbuka}
	<section
		class="panel-float fixed inset-x-0 bottom-14 z-40 flex max-h-[66dvh] flex-col rounded-b-none md:absolute md:inset-x-auto md:right-3 md:bottom-8 md:z-30 md:h-[460px] md:max-h-[calc(100%-4rem)] md:w-[380px] md:rounded-[var(--radius-panel)]"
		transition:masukSheet
		aria-label="Asisten kebijakan"
		data-testid="asisten-dock"
	>
		<header class="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
			<span class="grid h-7 w-7 place-items-center rounded-[6px] bg-accent-soft text-accent-2">
				<Sparkles size={15} />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="text-[13.5px] font-semibold text-ink">Asisten kebijakan</h2>
				<p class="truncate text-[11.5px] text-muted">
					{#if kawasanAktif}Konteks: {kawasanAktif.nama}{:else}Menjawab hanya dari data hasil
						analisis{/if}
				</p>
			</div>
			<button
				type="button"
				class="btn btn-ghost btn-sm h-8 w-8 px-0"
				aria-label="Tutup asisten"
				onclick={() => (mapStore.asistenTerbuka = false)}
				data-testid="asisten-toggle"
			>
				<X size={16} />
			</button>
		</header>

		<ul
			class="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3"
			data-testid="chat-messages"
			bind:this={daftarEl}
		>
			{#if chatStore.messages.length === 0 && chatStore.streamingText === null}
				<li class="text-[13px] leading-6 text-ink-2">
					Tanyakan dengan bahasa sehari-hari. Bila jawaban menyebut kawasan, peta ikut menyorot dan
					memperbesarnya.
				</li>
				<li class="flex flex-wrap gap-1.5 pt-1">
					{#each contoh as c (c)}
						<button
							type="button"
							class="chip h-auto py-1.5 text-left whitespace-normal"
							onclick={() => void kirimTeks(c)}
						>
							{c}
						</button>
					{/each}
				</li>
			{/if}
			{#each chatStore.messages as pesan, i (i)}
				<li
					class={pesan.role === 'user'
						? 'ml-8 rounded-[10px] rounded-br-[3px] bg-ink px-3 py-2 text-[13px] leading-6 text-white'
						: 'mr-8 rounded-[10px] rounded-bl-[3px] border border-line bg-paper px-3 py-2 text-[13px] leading-6 text-ink'}
					data-role={pesan.role}
				>
					{pesan.content}
				</li>
			{/each}
			{#if chatStore.streamingText !== null}
				{#if chatStore.streamingText === ''}
					<li
						class="mr-8 flex w-fit items-center gap-2 rounded-[10px] rounded-bl-[3px] border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-2"
						data-role="assistant"
						data-testid="chat-berpikir"
						aria-label="Asisten sedang menganalisis"
					>
						<span class="titik-berpikir inline-flex gap-1"
							><span></span><span></span><span></span></span
						>
						Menganalisis data
					</li>
				{:else}
					<li
						class="mr-8 rounded-[10px] rounded-bl-[3px] border border-line bg-paper px-3 py-2 text-[13px] leading-6 text-ink"
						data-role="assistant"
						data-testid="chat-streaming"
					>
						{chatStore.streamingText}<span
							class="ml-0.5 inline-block h-3.5 w-[3px] animate-pulse rounded-full bg-ink align-middle"
						></span>
					</li>
				{/if}
			{/if}
		</ul>

		<div class="border-t border-line px-3.5 py-2.5">
			{#if chatStore.error}
				<p class="mb-2 text-[12.5px] text-signal" data-testid="chat-error">{chatStore.error}</p>
			{/if}
			{#if mapStore.compareTarget}
				<a
					class="mb-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent"
					href={`/analisis?a=${encodeURIComponent(mapStore.compareTarget[0])}&b=${encodeURIComponent(mapStore.compareTarget[1])}`}
					data-testid="link-compare"
				>
					Buka perbandingan lengkap di halaman Analisis <ArrowRight size={13} />
				</a>
			{/if}
			{#if butuhTurnstile}
				<TurnstileWidget onToken={(t) => (chatStore.turnstileToken = t)} />
				<p class="mb-2 text-[12px] text-muted">
					Selesaikan verifikasi di atas untuk mulai bertanya.
				</p>
			{/if}
			<form class="flex gap-2" onsubmit={kirim}>
				<label class="sr-only" for="chat-input">Pertanyaan untuk asisten kebijakan</label>
				<input
					id="chat-input"
					class="input"
					placeholder="Tulis pertanyaan"
					maxlength="500"
					autocomplete="off"
					bind:value={input}
					data-testid="chat-input"
				/>
				<button
					type="submit"
					class="btn btn-primary h-9 w-9 shrink-0 px-0"
					disabled={chatStore.sedangMengirim || butuhTurnstile}
					aria-label="Kirim pertanyaan"
					data-testid="chat-kirim"
				>
					<Send size={15} />
				</button>
			</form>
		</div>
	</section>
{:else}
	<button
		type="button"
		class="btn btn-primary absolute right-3 bottom-8 z-30 hidden h-10 gap-2 px-4 shadow-[var(--shadow-float)] md:inline-flex"
		onclick={() => (mapStore.asistenTerbuka = true)}
		data-testid="asisten-toggle"
	>
		<Sparkles size={15} /> Tanya asisten
	</button>
{/if}
