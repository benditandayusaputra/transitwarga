<script lang="ts">
	import { galeriUsaha, type ItemGaleri } from '$lib/db/queries';
	import { JENIS_LABELS } from '$lib/map/layers';

	let items = $state<ItemGaleri[]>([]);
	let dimuat = $state(false);

	$effect(() => {
		galeriUsaha(12)
			.then((rows) => {
				items = rows;
				dimuat = true;
			})
			.catch(() => (dimuat = true)); // gagal (perangkat lemah) -> galeri disembunyikan
	});
</script>

{#if items.length > 0}
	<section class="anim-masuk mt-8" aria-labelledby="galeri">
		<h2 id="galeri" class="text-xl font-bold text-slate-900">Galeri temuan</h2>
		<p class="mt-1 text-sm text-slate-500">
			Pratinjau dokumentasi tempat usaha dari data saat ini; akan berganti dengan foto lapangan
			survey activities pasca-kurasi.
		</p>
		<ul
			class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
			data-testid="galeri-survey"
		>
			{#each items as item (item.foto_url)}
				<li
					class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
				>
					<div class="overflow-hidden">
						<img
							src={item.foto_url}
							alt={`Foto ${item.nama}`}
							class="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] sm:h-32"
							loading="lazy"
						/>
					</div>
					<div class="px-2.5 py-2">
						<p class="truncate text-xs font-semibold text-slate-800">{item.nama}</p>
						<p class="text-[11px] text-slate-500">
							{JENIS_LABELS[item.jenis_tempat] ?? item.jenis_tempat}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{:else if !dimuat}
	<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
		{#each [0, 1, 2, 3] as i (i)}
			<div class="shimmer h-40 rounded-xl"></div>
		{/each}
	</div>
{/if}
