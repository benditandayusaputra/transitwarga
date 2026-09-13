<script lang="ts">
	import { sortMediasPhotosFirst, isMapMediaUrl } from '$lib/data/mapidActivities';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		title: string;
		description: string;
		userName: string;
		userFullName: string;
		avatar?: string;
		createdAt: string;
		medias?: string[];
	}

	let {
		title,
		description,
		userName,
		userFullName,
		avatar = '',
		createdAt,
		medias = []
	}: Props = $props();

	const daftarMedias = $derived(sortMediasPhotosFirst(medias));
	let fotoAktifIndex = $state(0);
	let fotoGagal = $state(false);

	const tanggalFormatted = $derived.by(() => {
		const d = new Date(createdAt);
		if (isNaN(d.getTime())) return createdAt;
		return d.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	const mediaUrl = $derived(daftarMedias[fotoAktifIndex] ?? '');
	const adalahPeta = $derived(isMapMediaUrl(mediaUrl));
</script>

<div class="min-w-64 max-w-80 pr-3" data-testid="survey-popup">
	<p class="text-[11.5px] font-medium text-[#b45309]">Observasi lapangan Devunder</p>
	<h3 class="mt-0.5 text-[14px] leading-snug font-semibold text-ink">{title}</h3>

	<div class="mt-2 flex items-center gap-2 border-y border-line-2 py-1.5">
		{#if avatar}
			<img
				src={avatar}
				alt={userFullName || userName}
				class="h-6 w-6 rounded-full border border-line object-cover"
				loading="lazy"
			/>
		{:else}
			<span
				class="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white"
			>
				{(userFullName || userName || 'S').slice(0, 1).toUpperCase()}
			</span>
		{/if}
		<div class="min-w-0 flex-1 text-[11.5px]">
			<p class="truncate font-medium text-ink">{userFullName || userName}</p>
			<p class="text-muted">{tanggalFormatted}</p>
		</div>
	</div>

	<p class="mt-2 line-clamp-4 text-[12.5px] leading-5 text-ink-2">{description}</p>

	{#if daftarMedias.length > 0 && !fotoGagal}
		<div class="relative mt-2.5 overflow-hidden rounded-[6px] border border-line bg-line-2">
			<a
				href={mediaUrl}
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Buka foto observasi ukuran penuh"
			>
				<img
					src={mediaUrl}
					alt={title}
					class="h-36 w-full object-cover"
					loading="lazy"
					onerror={() => (fotoGagal = true)}
				/>
			</a>
			{#if daftarMedias.length > 1}
				<div
					class="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-[6px] bg-ink/80 px-1 py-0.5 text-[11px] font-medium text-white"
				>
					<button
						type="button"
						class="rounded px-1 hover:bg-white/20"
						onclick={(e) => {
							e.stopPropagation();
							fotoAktifIndex = (fotoAktifIndex - 1 + daftarMedias.length) % daftarMedias.length;
						}}
						aria-label="Foto sebelumnya"
					>
						<ChevronLeft size={13} />
					</button>
					<span class="px-0.5"
						>{adalahPeta ? 'Peta' : 'Foto'} {fotoAktifIndex + 1}/{daftarMedias.length}</span
					>
					<button
						type="button"
						class="rounded px-1 hover:bg-white/20"
						onclick={(e) => {
							e.stopPropagation();
							fotoAktifIndex = (fotoAktifIndex + 1) % daftarMedias.length;
						}}
						aria-label="Foto berikutnya"
					>
						<ChevronRight size={13} />
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<a
		href="/survey"
		class="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent"
	>
		Lihat semua observasi <ArrowRight size={12} />
	</a>
</div>
