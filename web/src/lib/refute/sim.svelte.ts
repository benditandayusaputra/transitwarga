/**
 * Repro faithful to AngkaNaik.svelte's $effect (Svelte version as installed).
 * Simulates rAF frames manually; counts effect (re)runs and tracks progression.
 */
import { flushSync, untrack } from 'svelte';

interface Frame {
	id: number;
	cb: (t: number) => void;
}

export interface SimResult {
	effectRuns: number;
	valueAt650: number;
	framesToDisplayTarget: number; // first frame where Math.round(tampil) === target
	framesToStop: number; // frame after which no rAF remains queued
	target: number;
}

export function simulate(useUntrack: boolean, totalFrames = 1200): SimResult {
	let queue: Frame[] = [];
	let nextId = 1;
	let now = 0;
	const raf = (cb: (t: number) => void): number => {
		const id = nextId++;
		queue.push({ id, cb });
		return id;
	};
	const caf = (id: number): void => {
		queue = queue.filter((f) => f.id !== id);
	};

	let effectRuns = 0;
	let tampil = $state(0);
	const nilai = 1000;

	const stop = $effect.root(() => {
		$effect(() => {
			effectRuns++;
			const target = nilai;
			const durasi = 650;
			const awal = useUntrack ? untrack(() => tampil) : tampil;
			const mulai = now;
			let r = 0;
			const langkah = (t: number): void => {
				const p = Math.min(1, (t - mulai) / durasi);
				const eased = 1 - Math.pow(1 - p, 3);
				tampil = awal + (target - awal) * eased;
				if (p < 1) r = raf(langkah);
			};
			r = raf(langkah);
			return () => caf(r);
		});
	});
	flushSync();

	let valueAt650 = -1;
	let framesToDisplayTarget = -1;
	let framesToStop = -1;

	for (let frame = 1; frame <= totalFrames; frame++) {
		now = frame * (1000 / 60);
		const current = queue;
		queue = [];
		for (const f of current) f.cb(now);
		flushSync(); // microtask flush: effect re-runs (cleanup + body) before next frame
		if (valueAt650 === -1 && now >= 650) valueAt650 = tampil;
		if (framesToDisplayTarget === -1 && Math.round(tampil) === nilai) {
			framesToDisplayTarget = frame;
		}
		if (queue.length === 0) {
			framesToStop = frame;
			break;
		}
	}

	stop();
	return { effectRuns, valueAt650, framesToDisplayTarget, framesToStop, target: nilai };
}
