<script lang="ts">
	import { sortMediasPhotosFirst, isMapMediaUrl } from '$lib/data/mapidActivities';

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
		try {
			const d = new Date(createdAt);
			if (isNaN(d.getTime())) return createdAt;
			return d.toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return createdAt;
		}
	});

	const mediaUrl = $derived(daftarMedias[fotoAktifIndex] ?? '');
	const adalahPeta = $derived(isMapMediaUrl(mediaUrl));
</script>

<div class="relative z-10 min-w-64 max-w-80 p-1 text-slate-950" data-testid="survey-popup">
	<div class="flex items-center gap-1.5 mb-1.5">
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-400"
		>
			📍 Observasi #Devunder
		</span>
	</div>

	<h3 class="text-sm font-black leading-snug text-slate-950">{title}</h3>

	<div class="mt-2 flex items-center gap-2 border-y border-slate-200 py-1.5">
		{#if avatar}
			<img
				src={avatar}
				alt={userFullName || userName}
				class="h-6 w-6 rounded-full object-cover border border-slate-300"
				loading="lazy"
			/>
		{:else}
			<div
				class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white"
			>
				{(userFullName || userName || 'S').slice(0, 1).toUpperCase()}
			</div>
		{/if}
		<div class="min-w-0 flex-1 text-[11px]">
			<p class="truncate font-black text-slate-950">{userFullName || userName}</p>
			<p class="text-[10px] font-bold text-slate-600">{tanggalFormatted}</p>
		</div>
	</div>

	<p class="mt-2 text-xs leading-relaxed text-slate-800 line-clamp-4 font-semibold">
		{description}
	</p>

	{#if daftarMedias.length > 0 && !fotoGagal}
		<div class="mt-2.5">
			<div class="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
				<a
					href={mediaUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Buka foto observasi ukuran penuh"
				>
					<img
						src={mediaUrl}
						alt={title}
						class="h-36 w-full object-cover transition-transform hover:scale-105 duration-200"
						loading="lazy"
						onerror={() => (fotoGagal = true)}
					/>
				</a>

				{#if daftarMedias.length > 1}
					<div
						class="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
					>
						{#if adalahPeta}
							<span class="mr-0.5 text-[9px] font-bold text-amber-300">🗺️ Peta</span>
						{:else}
							<span class="mr-0.5 text-[9px] font-bold text-emerald-300">📷 Foto</span>
						{/if}
						<span>{fotoAktifIndex + 1}/{daftarMedias.length}</span>
						<button
							type="button"
							class="hover:text-amber-300 ml-1 px-0.5 font-bold"
							onclick={(e) => {
								e.stopPropagation();
								fotoAktifIndex = (fotoAktifIndex - 1 + daftarMedias.length) % daftarMedias.length;
							}}
							aria-label="Foto sebelumnya"
						>
							‹
						</button>
						<button
							type="button"
							class="hover:text-amber-300 px-0.5 font-bold"
							onclick={(e) => {
								e.stopPropagation();
								fotoAktifIndex = (fotoAktifIndex + 1) % daftarMedias.length;
							}}
							aria-label="Foto berikutnya"
						>
							›
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div
		class="mt-2.5 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[11px]"
	>
		<a
			href="/survey"
			class="font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2"
		>
			Lihat di Daftar Survey →
		</a>
	</div>
</div>
