/** Base URL API Workers; produksi di-set lewat PUBLIC_API_BASE_URL. */

import { env } from '$env/dynamic/public';

export function apiBase(): string {
	return (env.PUBLIC_API_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');
}
