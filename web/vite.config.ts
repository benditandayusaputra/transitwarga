import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import { securityHeaders } from './security-headers.js';

/** Suntik header keamanan di dev & preview (produksi memakai vercel.json). */
function securityHeadersPlugin(): Plugin {
	const inject = (dev: boolean) => {
		const headers = securityHeaders({ dev });
		return (server: {
			middlewares: {
				use: (
					fn: (req: unknown, res: import('http').ServerResponse, next: () => void) => void
				) => void;
			};
		}) => {
			server.middlewares.use((_req, res, next) => {
				for (const [key, value] of Object.entries(headers)) {
					res.setHeader(key, value);
				}
				next();
			});
		};
	};
	return {
		name: 'transitwarga-security-headers',
		configureServer: inject(true),
		configurePreviewServer: inject(false)
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), securityHeadersPlugin()],
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'node'
	}
});
