/** Transisi Svelte terpusat — halus, singkat, dan hormat pada reduced motion. */

import { cubicOut } from 'svelte/easing';
import { fade, fly, scale, type TransitionConfig } from 'svelte/transition';

function kurangiGerak(): boolean {
	return (
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Kartu panel kontrol: geser-turun kecil + fade. */
export function masukPanel(node: Element): TransitionConfig {
	if (kurangiGerak()) return { duration: 0 };
	return fly(node, { y: -6, duration: 180, easing: cubicOut });
}

/** Dialog: skala halus dari 96%. */
export function masukDialog(node: Element): TransitionConfig {
	if (kurangiGerak()) return { duration: 0 };
	return scale(node, { start: 0.96, duration: 190, easing: cubicOut });
}

/** Bottom-sheet / navigasi bawah: naik dari bawah. */
export function masukSheet(node: Element): TransitionConfig {
	if (kurangiGerak()) return { duration: 0 };
	return fly(node, { y: 22, duration: 220, easing: cubicOut });
}

export function pudar(node: Element): TransitionConfig {
	if (kurangiGerak()) return { duration: 0 };
	return fade(node, { duration: 140 });
}
