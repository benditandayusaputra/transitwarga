import { describe, expect, it } from 'vitest';
import { parseSseBuffer } from './sse';

describe('parseSseBuffer', () => {
	it('memisahkan event lengkap dan menyisakan buffer parsial', () => {
		const buffer =
			'event: delta\ndata: {"text":"Halo"}\n\nevent: delta\ndata: {"text":" dunia"}\n\nevent: do';
		const { events, rest } = parseSseBuffer(buffer);
		expect(events).toEqual([
			{ event: 'delta', data: '{"text":"Halo"}' },
			{ event: 'delta', data: '{"text":" dunia"}' }
		]);
		expect(rest).toBe('event: do');
	});

	it('event tanpa nama menjadi message', () => {
		const { events } = parseSseBuffer('data: x\n\n');
		expect(events).toEqual([{ event: 'message', data: 'x' }]);
	});

	it('buffer kosong -> tanpa event', () => {
		const { events, rest } = parseSseBuffer('');
		expect(events).toEqual([]);
		expect(rest).toBe('');
	});

	it('urutan lengkap delta -> map_action -> done terparse utuh', () => {
		const buffer =
			'event: delta\ndata: {"text":"a"}\n\n' +
			'event: map_action\ndata: {"type":"highlight_kawasan","target":["mrt-blok-m"]}\n\n' +
			'event: done\ndata: {"usage":{}}\n\n';
		const { events, rest } = parseSseBuffer(buffer);
		expect(events.map((e) => e.event)).toEqual(['delta', 'map_action', 'done']);
		expect(rest).toBe('');
	});
});
