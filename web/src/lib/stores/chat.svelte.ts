/** Store chat AI (runes): riwayat pesan, status streaming, sesi Turnstile. */

import type { ChatMessage } from '$lib/ai/chatClient';

function buatSessionId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return '00000000-0000-4000-8000-000000000000';
}

class ChatStore {
	sessionId = buatSessionId();
	messages = $state<ChatMessage[]>([]);
	/** Jawaban assistant yang sedang mengalir (belum final). */
	streamingText = $state<string | null>(null);
	sedangMengirim = $state(false);
	error = $state<string | null>(null);
	/** Token widget Turnstile untuk pesan pertama sesi. */
	turnstileToken = $state<string | null>(null);
	/** True setelah satu pesan sukses (token tidak dibutuhkan lagi). */
	sesiTerverifikasi = $state(false);

	tambahUser(content: string) {
		this.messages = [...this.messages, { role: 'user', content }];
	}

	selesaikanStreaming() {
		if (this.streamingText !== null && this.streamingText.length > 0) {
			this.messages = [...this.messages, { role: 'assistant', content: this.streamingText }];
		}
		this.streamingText = null;
		this.sedangMengirim = false;
	}

	reset() {
		this.messages = [];
		this.streamingText = null;
		this.sedangMengirim = false;
		this.error = null;
	}
}

export const chatStore = new ChatStore();
