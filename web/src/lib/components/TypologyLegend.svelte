<script lang="ts">
	import { MODA_COLORS, MODA_LABELS, TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import type { Moda, Tipologi } from '$lib/types';

	const tipologiList = Object.keys(TIPOLOGI_COLORS) as Tipologi[];
	const modaList: Moda[] = ['mrt', 'tj'];
	const ARTI: Record<Tipologi, string> = {
		kuliner_matang: 'Ramai, padat, friksi terkendali',
		padat_friksi: 'Padat dan lapak menutup trotoar',
		potensi: 'Aktivitas cukup, ruang masih lega',
		prioritas_digital: 'Ramai tetapi pembayaran tunai',
		sepi: 'Aktivitas usaha minim'
	};
</script>

<div class="space-y-5" data-testid="legend" aria-label="Legenda tipologi kawasan dan moda transit">
	<div>
		<h3 class="label mb-1.5">Tipologi kawasan</h3>
		<ul class="space-y-1">
			{#each tipologiList as t (t)}
				<li class="flex items-start gap-2.5 py-1">
					<span
						class="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
						style:background-color={TIPOLOGI_COLORS[t]}
					></span>
					<span>
						<span class="block text-[13px] font-medium text-ink">{TIPOLOGI_LABELS[t]}</span>
						<span class="block text-[11.5px] text-muted">{ARTI[t]}</span>
					</span>
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h3 class="label mb-1.5">Simbol lain</h3>
		<ul class="space-y-1">
			{#each modaList as m (m)}
				<li class="flex items-center gap-2.5 py-1 text-[13px] text-ink">
					<span
						class="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-sm"
						style:background-color={MODA_COLORS[m]}
					></span>
					Stasiun {MODA_LABELS[m]}
				</li>
			{/each}
			<li class="flex items-center gap-2.5 py-1 text-[13px] text-ink">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white bg-[#e69f00] shadow-sm"
				></span>
				Titik usaha (warna per jenis tempat)
			</li>
			<li class="flex items-center gap-2.5 py-1 text-[13px] text-ink">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white bg-[#f59e0b] shadow-sm"
				></span>
				Observasi lapangan tim Devunder
			</li>
		</ul>
		<p class="mt-2 text-[11.5px] text-muted">
			Lingkaran besar: buffer jalan kaki 400 m (pekat) dan 800 m (samar) dari stasiun.
		</p>
	</div>
</div>
