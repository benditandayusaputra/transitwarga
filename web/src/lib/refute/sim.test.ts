import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { simulate } from './sim.svelte';

const OUT = join(tmpdir(), 'sim-result.json');

describe('AngkaNaik effect restart claim', () => {
	it('compares as-written vs untracked behavior', () => {
		const asWritten = simulate(false);
		const untracked = simulate(true);
		writeFileSync(OUT, JSON.stringify({ asWritten, untracked }, null, 2));
		expect(asWritten.target).toBe(1000);
	});
});
