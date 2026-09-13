<script lang="ts">
	import { detailUsaha, type DetailUsaha } from '$lib/db/queries';
	import { JENIS_LABELS } from '$lib/map/layers';
	import { formatRupiah } from '$lib/utils/format';
	import type { UsahaRow } from '$lib/types';

	let { usaha }: { usaha: UsahaRow } = $props();

	// Popup dua tahap (blueprint 7.3): tahap 1 instan dari atribut tile,
	// tahap 2 detail (menu, foto, dst.) dilengkapi DuckDB berdasarkan id.
	let detail = $state<DetailUsaha | null>(null);
	let detailGagal = $state(false);
	let memuatDetail = $state(true);
	let fotoGagal = $state(false);

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

<div class="relative z-10 min-w-48 p-1 text-black" data-testid="usaha-popup">
	<h3 class="text-sm font-black text-black">{usaha.nama}</h3>
	<dl class="mt-1 space-y-0.5 text-xs text-black font-extrabold">
		<div class="flex justify-between gap-4">
			<dt class="font-bold text-black/80">Jenis</dt>
			<dd class="font-black text-black">
				{JENIS_LABELS[usaha.jenis_tempat] ?? usaha.jenis_tempat}
			</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="font-bold text-black/80">Harga rata</dt>
			<dd class="font-black text-black">{formatRupiah(usaha.harga_rata)}</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="font-bold text-black/80">Keramaian</dt>
			<dd class="font-black text-black capitalize">{usaha.keramaian}</dd>
		</div>
	</dl>

	{#if memuatDetail}
		<p class="mt-2 text-xs font-bold text-black/70 italic" data-testid="popup-detail-placeholder">
			Memuat detail…
		</p>
	{:else if detail}
		<dl class="mt-2 space-y-0.5 border-t border-white/50 pt-2 text-xs text-black font-extrabold">
			{#if detail.menu_andalan}
				<div class="flex justify-between gap-4">
					<dt class="font-bold text-black/80">Menu andalan</dt>
					<dd class="font-black text-black">{detail.menu_andalan}</dd>
				</div>
			{/if}
			{#if detail.mobilitas}
				<div class="flex justify-between gap-4">
					<dt class="font-bold text-black/80">Mobilitas</dt>
					<dd class="font-black text-black capitalize">{detail.mobilitas}</dd>
				</div>
			{/if}
			{#if detail.jarak_stasiun_m !== null}
				<div class="flex justify-between gap-4">
					<dt class="font-bold text-black/80">Jarak stasiun</dt>
					<dd class="font-black text-black">{detail.jarak_stasiun_m} m</dd>
				</div>
			{/if}
			{#if detail.waktu_catat}
				<div class="flex justify-between gap-4">
					<dt class="font-bold text-black/80">Dicatat</dt>
					<dd class="font-black text-black">{detail.waktu_catat}</dd>
				</div>
			{/if}
		</dl>
		{#if detail.foto_url && !fotoGagal}
			<!-- foto tampil langsung; klik utk buka ukuran penuh di tab baru -->
			<a
				href={detail.foto_url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`Buka foto ${usaha.nama} ukuran penuh`}
			>
				<img
					src={detail.foto_url}
					alt={`Foto ${usaha.nama}`}
					class="mt-2 h-28 w-full rounded-xl border border-white/60 object-cover shadow-sm"
					loading="lazy"
					onerror={() => (fotoGagal = true)}
					data-testid="foto-usaha"
				/>
			</a>
		{:else if detail.foto_url && fotoGagal}
			<p class="mt-2 text-xs font-bold text-black/70 italic">Foto tidak dapat dimuat.</p>
		{/if}
	{:else if detailGagal}
		<p class="mt-2 text-xs font-bold text-black/70 italic" data-testid="popup-detail-placeholder">
			Detail lengkap tidak tersedia.
		</p>
	{/if}
</div>
