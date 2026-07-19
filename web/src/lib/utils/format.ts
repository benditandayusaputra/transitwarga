/** Formatter angka Indonesia (murni, teruji Vitest). */

const rupiah = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	maximumFractionDigits: 0
});

const angka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Ganti NBSP/narrow-NBSP hasil Intl dengan spasi biasa (stabil dirender & diuji). */
function normalisasiSpasi(s: string): string {
	return s.replace(/[\u00A0\u202F]/g, ' ');
}

/** 15000 -> "Rp 15.000". */
export function formatRupiah(nilai: number): string {
	return normalisasiSpasi(rupiah.format(nilai));
}

export function formatAngka(nilai: number): string {
	return normalisasiSpasi(angka.format(nilai));
}

/** Skor 0-100 -> "73" (dibulatkan, tanpa desimal). */
export function formatSkor(nilai: number): string {
	return String(Math.round(nilai));
}

/** Persen 0-100 -> "73%". */
export function formatPersen(nilai: number): string {
	return `${Math.round(nilai)}%`;
}
