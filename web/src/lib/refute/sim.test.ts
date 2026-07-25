import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { simulate } from './sim.svelte.ts';

const OUT =
	'/private/tmp/claude-501/-Users-pro-bendi-Kuliah-Lomba-MAPID-WebGIS-application/69b82388-5131-4208-80ce-3d81f1130f5b/scratchpad/sim-result.json';

describe('AngkaNaik effect restart claim', () => {
	it('compares as-written vs untracked behavior', () => {
		const asWritten = simulate(false);
		const untracked = simulate(true);
		writeFileSync(OUT, JSON.stringify({ asWritten, untracked }, null, 2));
		expect(asWritten.target).toBe(1000);
	});
});
