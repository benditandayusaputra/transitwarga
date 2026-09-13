/**
 * Header keamanan dokumen web (blueprint bag. 9) — satu sumber untuk
 * vite dev/preview (dipakai E2E) dan acuan nilai di web/vercel.json (produksi).
 *
 * CSP hanya mengizinkan origin sendiri + origin basemap + origin API +
 * Cloudflare Turnstile. Bila origin basemap berubah, ubah
 * BASEMAP_ORIGINS di sini dan salin hasilnya ke web/vercel.json.
 */

export const BASEMAP_ORIGINS = [
	// style, tiles, glyph MAPID MAPS
	'https://*.mapid.co.id',
	'https://*.mapid.io',
	'https://mapid.io',
	// aset yang dirujuk style MAPID: sprite, relief, citra satelit
	'https://maputnik.github.io',
	'https://klokantech.github.io',
	'https://api.maptiler.com',
	'https://api.mapbox.com'
];

const API_ORIGINS = ['http://localhost:8787', 'https://*.workers.dev'];

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

export function contentSecurityPolicy({ dev = false } = {}) {
	const basemap = BASEMAP_ORIGINS.join(' ');
	const api = API_ORIGINS.join(' ');
	// ws: hanya di dev (HMR vite). 'unsafe-inline' script di header diperlukan
	// utk satu inline script bootstrap SvelteKit; pembatasan script yang ketat
	// (hash per halaman) dipasang SvelteKit sendiri via meta CSP (svelte.config
	// kit.csp mode hash) — kedua policy berlaku sekaligus, yang ketat menang.
	const devConnect = dev ? ' ws:' : '';
	return [
		"default-src 'self'",
		// wasm-unsafe-eval: DuckDB-WASM & MapLibre butuh kompilasi WebAssembly
		`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${TURNSTILE_ORIGIN}`,
		// unsafe-inline utk style: MapLibre menyuntik style elemen kontrol/popup
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: blob: ${basemap}`,
		"font-src 'self' data:",
		`connect-src 'self' ${api} ${basemap} ${TURNSTILE_ORIGIN}${devConnect}`,
		"worker-src 'self' blob:",
		`frame-src ${TURNSTILE_ORIGIN}`,
		"object-src 'none'",
		"base-uri 'self'",
		"frame-ancestors 'self'"
	].join('; ');
}

export function securityHeaders({ dev = false } = {}) {
	return {
		'Content-Security-Policy': contentSecurityPolicy({ dev }),
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
	};
}
