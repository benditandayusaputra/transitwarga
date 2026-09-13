<script lang="ts">
	import { MODA_COLORS, MODA_LABELS, TIPOLOGI_COLORS, TIPOLOGI_LABELS } from '$lib/map/layers';
	import type { Moda, Tipologi } from '$lib/types';

	const tipologiList = Object.keys(TIPOLOGI_COLORS) as Tipologi[];
	const modaList: Moda[] = ['mrt', 'tj'];
</script>

<div
	class="space-y-3"
	data-testid="legend"
	role="img"
	aria-label="Legenda tipologi kawasan dan moda transit"
>
	<div>
		<h3 class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">
			Tipologi kawasan
		</h3>
		<ul class="space-y-1">
			{#each tipologiList as t (t)}
				<li
					class="flex items-center gap-2.5 rounded-xl px-2 py-1 text-xs font-extrabold text-black"
				>
					<span
						class="inline-block h-3.5 w-3.5 shrink-0 rounded shadow-sm"
						style:background-color={TIPOLOGI_COLORS[t]}
					></span>
					{TIPOLOGI_LABELS[t]}
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h3 class="mb-1.5 text-[11px] font-black tracking-wide text-black uppercase">Moda transit</h3>
		<ul class="space-y-1">
			{#each modaList as m (m)}
				<li
					class="flex items-center gap-2.5 rounded-xl px-2 py-1 text-xs font-extrabold text-black"
				>
					<span
						class="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm"
						style:background-color={MODA_COLORS[m]}
					></span>
					{MODA_LABELS[m]}
				</li>
			{/each}
		</ul>
	</div>
</div>
