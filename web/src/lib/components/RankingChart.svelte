<script lang="ts">
	import { TIPOLOGI_COLORS } from '$lib/map/layers';
	import type { Tipologi } from '$lib/types';

	export interface BarisRanking {
		id: string;
		nama: string;
		nilai: number;
		tipologi: Tipologi;
	}

	let {
		data,
		aktifId = null,
		onPilih
	}: {
		data: BarisRanking[];
		aktifId?: string | null;
		onPilih?: (id: string) => void;
	} = $props();

	const terurut = $derived([...data].sort((a, b) => b.nilai - a.nilai));
	const maks = $derived(Math.max(1, ...data.map((d) => d.nilai)));
</script>

<ol class="space-y-1" role="img" aria-label="Peringkat kawasan berdasarkan skor">
	{#each terurut as baris, i (baris.id)}
		<li>
			<button
				type="button"
				class={`w-full rounded-lg px-2 py-1 text-left transition-colors ${
					baris.id === aktifId ? 'bg-primary-50' : 'hover:bg-slate-50'
				}`}
				onclick={() => onPilih?.(baris.id)}
				aria-current={baris.id === aktifId ? 'true' : undefined}
			>
				<div class="flex items-baseline justify-between gap-2 text-xs">
					<span
						class={`min-w-0 truncate ${baris.id === aktifId ? 'text-primary-800 font-semibold' : 'text-slate-600'}`}
					>
						{i + 1}. {baris.nama}
					</span>
					<span class="font-bold text-slate-800 tabular-nums">{Math.round(baris.nilai)}</span>
				</div>
				<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
					<div
						class="bar-tumbuh h-2 rounded-full"
						style:width={`${(baris.nilai / maks) * 100}%`}
						style:background-color={TIPOLOGI_COLORS[baris.tipologi] ?? '#94a3b8'}
						style:animation-delay={`${i * 45}ms`}
					></div>
				</div>
			</button>
		</li>
	{/each}
</ol>
