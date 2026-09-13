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
	<p class="text-sm text-muted">Belum ada transaksi tercatat.</p>
{:else}
	<div class="flex items-center gap-5">
		<div class="relative h-28 w-28 shrink-0">
			<svg
				viewBox="0 0 100 100"
				class="h-full w-full -rotate-90"
				role="img"
				aria-label="Diagram komposisi metode bayar"
			>
				<circle cx="50" cy="50" r={R} fill="none" stroke="#eceff3" stroke-width="12" />
				{#each segmen as s (s.label)}
					<circle
						cx="50"
						cy="50"
						r={R}
						fill="none"
						stroke={s.color}
						stroke-width="12"
						stroke-dasharray={`${Math.max(0, s.bagian * KELILING - 1.5)} ${KELILING}`}
						stroke-dashoffset={-s.mulai * KELILING}
						class="donut-seg"
					>
						<title>{s.label}: {s.value}</title>
					</circle>
				{/each}
			</svg>
			{#if tengah}
				<div class="absolute inset-0 grid place-items-center">
					<span class="num text-center text-[13px] leading-tight">{tengah}</span>
				</div>
			{/if}
		</div>
		<ul class="min-w-0 flex-1 space-y-1.5">
			{#each segmen as s (s.label)}
				<li class="flex items-center gap-2 text-[12.5px] text-ink-2">
					<span
						class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
						style:background-color={s.color}
					></span>
					<span class="min-w-0 flex-1 truncate">{s.label}</span>
					<span class="num">{Math.round(s.bagian * 100)}%</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.donut-seg {
		animation: donut-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes donut-in {
		from {
			stroke-dasharray: 0 999;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.donut-seg {
			animation: none;
		}
	}
</style>
