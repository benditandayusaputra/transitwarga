<script lang="ts">
	import { TIPOLOGI_COLORS } from '$lib/map/layers';
	import type { Tipologi } from '$lib/types';
	import AngkaNaik from './AngkaNaik.svelte';

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

<ol class="space-y-0.5" aria-label="Peringkat kawasan berdasarkan skor">
	{#each terurut as baris, i (baris.id)}
		<li>
			<button
				type="button"
				class={`w-full rounded-[6px] px-2 py-1.5 text-left transition-colors ${
					baris.id === aktifId ? 'bg-accent-soft' : 'hover:bg-line-2'
				}`}
				onclick={() => onPilih?.(baris.id)}
				aria-current={baris.id === aktifId ? 'true' : undefined}
			>
				<div class="flex items-baseline justify-between gap-2 text-[12.5px]">
					<span
						class={`min-w-0 truncate ${baris.id === aktifId ? 'font-semibold text-accent-2' : 'text-ink-2'}`}
					>
						<span class="num mr-1.5 inline-block w-4 text-right text-muted">{i + 1}</span
						>{baris.nama}
					</span>
					<span class="num"><AngkaNaik nilai={baris.nilai} /></span>
				</div>
				<div class="mt-1 ml-[22px] h-1.5 overflow-hidden rounded-full bg-line-2">
					<div
						class="bar-tumbuh h-full rounded-full"
						style:width={`${(baris.nilai / maks) * 100}%`}
						style:background-color={TIPOLOGI_COLORS[baris.tipologi] ?? '#94a3b8'}
						style:animation-delay={`${i * 45}ms`}
					></div>
				</div>
			</button>
		</li>
	{/each}
</ol>
