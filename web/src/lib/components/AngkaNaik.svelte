<script lang="ts">
	/** Angka yang "naik" halus ke nilai target (count-up); hormati reduced motion. */

	let {
		nilai,
		format = (n: number) => String(Math.round(n))
	}: {
		nilai: number;
		format?: (n: number) => string;
	} = $props();

	let tampil = $state(0);

	$effect(() => {
		const target = nilai;
		if (
			typeof matchMedia !== 'undefined' &&
			matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			tampil = target;
			return;
		}
		const durasi = 650;
		const awal = tampil;
		const mulai = performance.now();
		let raf = 0;
		const langkah = (t: number) => {
			const p = Math.min(1, (t - mulai) / durasi);
			const eased = 1 - Math.pow(1 - p, 3);
			tampil = awal + (target - awal) * eased;
			if (p < 1) raf = requestAnimationFrame(langkah);
		};
		raf = requestAnimationFrame(langkah);
		return () => cancelAnimationFrame(raf);
	});
</script>

<span class="tabular-nums">{format(tampil)}</span>
