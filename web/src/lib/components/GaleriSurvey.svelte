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
			.catch(() => (dimuat = true));
	});
</script>

{#if items.length > 0}
	<section class="mt-8" aria-labelledby="galeri">
		<h2 id="galeri" class="text-xl font-semibold text-ink">Galeri tempat usaha</h2>
		<p class="mt-1 text-sm text-muted">Foto tempat usaha dari data yang sedang dimuat.</p>
		<ul
			class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
			data-testid="galeri-survey"
		>
			{#each items as item (item.foto_url)}
				<li class="card overflow-hidden">
					<img
						src={item.foto_url}
						alt={`Foto ${item.nama}`}
						class="h-28 w-full object-cover sm:h-32"
						loading="lazy"
					/>
					<div class="px-2.5 py-2">
						<p class="truncate text-[12.5px] font-medium text-ink">{item.nama}</p>
						<p class="text-[11.5px] text-muted">
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
			<div class="shimmer h-40"></div>
		{/each}
	</div>
{/if}
