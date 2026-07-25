<script lang="ts">
	export interface Irisan {
		label: string;
		value: number;
		color: string;
	}

	let { irisan, tengah = '' }: { irisan: Irisan[]; tengah?: string } = $props();

	const total = $derived(irisan.reduce((a, s) => a + s.value, 0));
	const R = 40;
	const KELILING = 2 * Math.PI * R;

	const segmen = $derived.by(() => {
		let akum = 0;
		return irisan
			.filter((s) => s.value > 0)
			.map((s) => {
				const bagian = s.value / total;
				const hasil = { ...s, bagian, mulai: akum };
				akum += bagian;
				return hasil;
			});
	});
</script>

{#if total === 0}
	<p class="text-xs text-slate-400">Tidak ada data.</p>
{:else}
	<div class="anim-masuk flex items-center gap-4">
		<div class="relative h-28 w-28 shrink-0">
			<svg
				viewBox="0 0 100 100"
				class="h-full w-full -rotate-90"
				role="img"
				aria-label="Diagram donat komposisi"
			>
				<circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" stroke-width="13" />
				{#each segmen as s (s.label)}
					<circle
						cx="50"
						cy="50"
						r={R}
						fill="none"
						stroke={s.color}
						stroke-width="13"
						stroke-linecap="butt"
						stroke-dasharray={`${Math.max(0, s.bagian * KELILING - 1.5)} ${KELILING}`}
						stroke-dashoffset={-s.mulai * KELILING}
					>
						<title>{s.label}: {s.value}</title>
					</circle>
				{/each}
			</svg>
			{#if tengah}
				<div class="absolute inset-0 grid place-items-center">
					<span class="text-center text-[13px] leading-tight font-bold text-slate-800"
						>{tengah}</span
					>
				</div>
			{/if}
		</div>
		<ul class="min-w-0 flex-1 space-y-1">
			{#each segmen as s (s.label)}
				<li class="flex items-center gap-2 text-xs text-slate-600">
					<span
						class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
						style:background-color={s.color}
					></span>
					<span class="min-w-0 flex-1 truncate">{s.label}</span>
					<span class="font-semibold text-slate-800">{Math.round(s.bagian * 100)}%</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
