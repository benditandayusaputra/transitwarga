/** Store filter kategorikal (runes); diterapkan sebagai MapLibre filter expression. */

class FiltersStore {
	jenisTempat = $state<string[]>([]);
	keramaian = $state<string[]>([]);
	moda = $state<string[]>([]);
	/** Filter topik observasi #Devunder: pkl, trotoar, parkir, qris, transit */
	surveyTopik = $state<string[]>([]);
	/** Filter surveyor lapangan */
	surveyor = $state<string[]>([]);
	/**
	 * Hasil filter numerik DuckDB (fase analitik): daftar id usaha yang lolos.
	 * null = filter numerik tidak aktif.
	 */
	idWhitelist = $state<string[] | null>(null);

	aktif = $derived(
		this.jenisTempat.length > 0 ||
			this.keramaian.length > 0 ||
			this.moda.length > 0 ||
			this.idWhitelist !== null ||
			this.surveyTopik.length > 0 ||
			this.surveyor.length > 0
	);

	toggle(field: 'jenisTempat' | 'keramaian' | 'moda' | 'surveyTopik' | 'surveyor', value: string) {
		const current = this[field];
		this[field] = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];
	}

	reset() {
		this.jenisTempat = [];
		this.keramaian = [];
		this.moda = [];
		this.surveyTopik = [];
		this.surveyor = [];
		this.idWhitelist = null;
	}
}

export const filters = new FiltersStore();
