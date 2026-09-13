<script lang="ts">
	import { detailUsaha, type DetailUsaha } from '$lib/db/queries';
	import { JENIS_LABELS } from '$lib/map/layers';
	import { formatRupiah } from '$lib/utils/format';
	import type { UsahaRow } from '$lib/types';

	let { usaha }: { usaha: UsahaRow } = $props();

	// Popup dua tahap: tahap 1 instan dari atribut tile, tahap 2 detail via DuckDB.
	let detail = $state<DetailUsaha | null>(null);
	let detailGagal = $state(false);
	let memuatDetail = $state(true);
	let fotoGagal = $state(false);
	const KERAMAIAN: Record<string, string> = { sepi: 'Sepi', sedang: 'Sedang', ramai: 'Ramai' };

	$effect(() => {
		const id = usaha.id;
		memuatDetail = true;
		fotoGagal = false;
		detailUsaha(id)
			.then((d) => {
				if (id !== usaha.id) return;
				detail = d;
				detailGagal = d === null;
			})
			.catch(() => (detailGagal = true))
			.finally(() => (memuatDetail = false));
	});
</script>

<div class="min-w-52 pr-4" data-testid="usaha-popup">
	<p class="text-[11.5px] text-muted">{JENIS_LABELS[usaha.jenis_tempat] ?? usaha.jenis_tempat}</p>
	<h3 class="text-[14px] font-semibold text-ink">{usaha.nama}</h3>
	<dl class="mt-2 space-y-1 text-[12.5px]">
		<div class="flex justify-between gap-4">
			<dt class="text-ink-2">Harga rata-rata</dt>
			<dd class="num">{formatRupiah(usaha.harga_rata)}</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="text-ink-2">Keramaian</dt>
			<dd class="font-medium">{KERAMAIAN[usaha.keramaian] ?? usaha.keramaian}</dd>
		</div>
		{#if detail?.menu_andalan}
			<div class="flex justify-between gap-4">
				<dt class="text-ink-2">Menu andalan</dt>
				<dd class="font-medium">{detail.menu_andalan}</dd>
			</div>
		{/if}
		{#if detail?.mobilitas}
			<div class="flex justify-between gap-4">
				<dt class="text-ink-2">Mobilitas</dt>
				<dd class="font-medium capitalize">{detail.mobilitas}</dd>
			</div>
		{/if}
		{#if detail && detail.jarak_stasiun_m !== null}
			<div class="flex justify-between gap-4">
				<dt class="text-ink-2">Jarak ke stasiun</dt>
				<dd class="num">{detail.jarak_stasiun_m} m</dd>
			</div>
		{/if}
		{#if detail?.waktu_catat}
			<div class="flex justify-between gap-4">
				<dt class="text-ink-2">Dicatat</dt>
				<dd class="font-medium">{detail.waktu_catat}</dd>
			</div>
		{/if}
	</dl>

	{#if memuatDetail}
		<div
			class="mt-2.5 space-y-1.5"
			data-testid="popup-detail-placeholder"
			aria-label="Memuat detail"
		>
			<div class="shimmer h-3 w-3/4"></div>
			<div class="shimmer h-24 w-full"></div>
		</div>
	{:else if detail?.foto_url && !fotoGagal}
		<a
			href={detail.foto_url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`Buka foto ${usaha.nama} ukuran penuh`}
		>
			<img
				src={detail.foto_url}
				alt={`Foto ${usaha.nama}`}
				class="mt-2.5 h-28 w-full rounded-[6px] border border-line object-cover"
				loading="lazy"
				onerror={() => (fotoGagal = true)}
				data-testid="foto-usaha"
			/>
		</a>
	{:else if detailGagal}
		<p class="mt-2 text-[12px] text-muted" data-testid="popup-detail-placeholder">
			Detail lengkap tidak tersedia.
		</p>
	{/if}
</div>
