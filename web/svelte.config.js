import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// CSP ketat utk script dipasang per-halaman (meta + hash) karena SvelteKit
		// butuh satu inline script bootstrap; header CSP (security-headers.js)
		// menjadi lapisan kedua utk resource lain.
		csp: {
			mode: 'hash',
			directives: {
				'script-src': ['self', 'wasm-unsafe-eval', 'https://challenges.cloudflare.com'],
				// tanpa ini worker-src jatuh ke script-src dan memblokir worker
				// blob: milik MapLibre
				'worker-src': ['self', 'blob:']
			}
		}
	}
};

export default config;
