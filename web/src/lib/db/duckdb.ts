/** Inisialisasi DuckDB-WASM di Web Worker secara lazy (blueprint 7.3).

Worker baru dibuat saat pertama dibutuhkan (buka /analisis, pasang filter
numerik, atau buka detail popup). File parquet diregister via HTTP sehingga
DuckDB membaca per-range, bukan mengunduh utuh.

Bundel wasm/worker di-serve dari origin sendiri (?url) supaya cocok dengan CSP
ketat — tanpa CDN pihak ketiga.
*/

import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import duckdbWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdbWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdbWasmEh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbWorkerEh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

export type Row = Record<string, unknown>;
export type QueryFn = (sql: string, params?: unknown[]) => Promise<Row[]>;

const TABLES = ['usaha', 'transaksi', 'aktivitas', 'properti', 'kawasan'] as const;

/**
 * Batas waktu inisialisasi. Worker yang gagal dimuat bisa membuat init
 * menggantung tanpa error — timeout memastikan fallback agregat tetap terpicu
 * (blueprint bag. 11: perangkat lemah).
 */
const INIT_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`${label} melebihi ${ms} ms`)), ms);
		promise.then(
			(v) => {
				clearTimeout(timer);
				resolve(v);
			},
			(e) => {
				clearTimeout(timer);
				reject(e);
			}
		);
	});
}

let connPromise: Promise<AsyncDuckDBConnection> | null = null;

/** Paksa gagal untuk menguji fallback: buka halaman dengan ?duckdb=off. */
export function dbDimatikanLewatQuery(): boolean {
	if (typeof location === 'undefined') return false;
	return new URLSearchParams(location.search).get('duckdb') === 'off';
}

async function initConnection(): Promise<AsyncDuckDBConnection> {
	// Pustaka DuckDB (~MB) dimuat dinamis: hanya saat analitik benar-benar dipakai.
	const duckdb = await import('@duckdb/duckdb-wasm');
	const bundle = await duckdb.selectBundle({
		mvp: { mainModule: duckdbWasm, mainWorker: duckdbWorker },
		eh: { mainModule: duckdbWasmEh, mainWorker: duckdbWorkerEh }
	});
	if (!bundle.mainWorker) throw new Error('bundel duckdb tidak punya worker');
	const worker = new Worker(bundle.mainWorker);
	const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
	for (const t of TABLES) {
		await db.registerFileURL(
			`${t}.parquet`,
			new URL(`/data/${t}.parquet`, location.origin).href,
			duckdb.DuckDBDataProtocol.HTTP,
			false
		);
	}
	const conn = await db.connect();
	// Ekstensi parquet di-self-host (static/duckdb-ext) supaya berjalan offline
	// dan lolos CSP connect-src 'self' — tanpa menyentuh extensions.duckdb.org.
	await conn.query(`SET custom_extension_repository='${location.origin}/duckdb-ext'`);
	await conn.query('INSTALL parquet');
	await conn.query('LOAD parquet');
	for (const t of TABLES) {
		await conn.query(`CREATE OR REPLACE VIEW ${t} AS SELECT * FROM read_parquet('${t}.parquet')`);
	}
	return conn;
}

async function getConnection(): Promise<AsyncDuckDBConnection> {
	if (dbDimatikanLewatQuery()) {
		throw new Error('DuckDB dimatikan lewat query string (?duckdb=off)');
	}
	if (!connPromise) {
		connPromise = withTimeout(initConnection(), INIT_TIMEOUT_MS, 'init DuckDB').catch((err) => {
			connPromise = null; // biarkan percobaan berikutnya mengulang init
			console.warn('DuckDB-WASM gagal diinisialisasi (fallback agregat dipakai):', err);
			throw err;
		});
	}
	return connPromise;
}

function normalizeValue(v: unknown): unknown {
	if (typeof v === 'bigint') return Number(v);
	return v;
}

function normalizeRow(raw: Record<string, unknown>): Row {
	const out: Row = {};
	for (const [k, v] of Object.entries(raw)) out[k] = normalizeValue(v);
	return out;
}

/**
 * Jalankan SQL dengan parameter aman (prepared statement, tanpa konkatenasi).
 * Hasil dikembalikan sebagai array objek polos (BigInt -> Number).
 */
export const query: QueryFn = async (sql, params = []) => {
	const conn = await getConnection();
	let table;
	if (params.length > 0) {
		const stmt = await conn.prepare(sql);
		try {
			table = await stmt.query(...params);
		} finally {
			await stmt.close();
		}
	} else {
		table = await conn.query(sql);
	}
	return table.toArray().map((r) => normalizeRow(r.toJSON() as Record<string, unknown>));
};
