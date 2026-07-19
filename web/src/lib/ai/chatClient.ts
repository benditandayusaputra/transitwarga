/** Klien POST /api/chat: fetch + parse SSE, dorong delta ke handler (blueprint 6.3). */

import { apiBase } from './api';
import { parseSseBuffer, type SseEvent } from './sse';

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatRequestBody {
	session_id: string;
	turnstile_token?: string;
	messages: ChatMessage[];
	map_context: { kawasan_aktif: string | null };
}

export interface ChatStreamHandlers {
	onDelta: (text: string) => void;
	onMapAction: (aksi: unknown) => void;
	onDone: () => void;
	onError: (err: { code: string; message: string }) => void;
}

function dispatch(ev: SseEvent, handlers: ChatStreamHandlers): void {
	switch (ev.event) {
		case 'delta': {
			const parsed = JSON.parse(ev.data) as { text?: string };
			if (typeof parsed.text === 'string') handlers.onDelta(parsed.text);
			break;
		}
		case 'map_action':
			handlers.onMapAction(JSON.parse(ev.data));
			break;
		case 'done':
			handlers.onDone();
			break;
		case 'error': {
			const parsed = JSON.parse(ev.data) as { code?: string; message?: string };
			handlers.onError({
				code: parsed.code ?? 'UPSTREAM_ERROR',
				message: parsed.message ?? 'Streaming terputus'
			});
			break;
		}
	}
}

export async function streamChat(
	body: ChatRequestBody,
	handlers: ChatStreamHandlers
): Promise<void> {
	let res: Response;
	try {
		res = await fetch(`${apiBase()}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	} catch {
		handlers.onError({ code: 'NETWORK', message: 'API tidak dapat dihubungi' });
		return;
	}
	if (!res.ok || !res.body) {
		const err = (await res.json().catch(() => null)) as {
			error?: { code?: string; message?: string };
		} | null;
		handlers.onError({
			code: err?.error?.code ?? `HTTP_${res.status}`,
			message: err?.error?.message ?? 'Permintaan chat gagal'
		});
		return;
	}
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const { events, rest } = parseSseBuffer(buffer);
		buffer = rest;
		for (const ev of events) dispatch(ev, handlers);
	}
	const { events } = parseSseBuffer(buffer + '\n\n');
	for (const ev of events) dispatch(ev, handlers);
}
