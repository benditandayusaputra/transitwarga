/** Parser event SSE (murni, teruji Vitest) untuk stream /api/chat. */

export interface SseEvent {
	event: string;
	data: string;
}

/**
 * Ambil event lengkap dari buffer (dipisah baris kosong); sisa buffer yang
 * belum lengkap dikembalikan untuk chunk berikutnya.
 */
export function parseSseBuffer(buffer: string): { events: SseEvent[]; rest: string } {
	const parts = buffer.split('\n\n');
	const rest = parts.pop() ?? '';
	const events: SseEvent[] = [];
	for (const blok of parts) {
		if (!blok.trim()) continue;
		let event = 'message';
		const dataLines: string[] = [];
		for (const line of blok.split('\n')) {
			if (line.startsWith('event:')) event = line.slice(6).trim();
			else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
		}
		events.push({ event, data: dataLines.join('\n') });
	}
	return { events, rest };
}
