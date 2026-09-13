/** TransitWarga TIDAK memakai service worker.
 *
 * Unregister SW nyasar yang mungkin menguasai origin ini: mis. dari proyek
 * lain yang pernah jalan di localhost:5173, atau versi lama di domain
 * produksi. SW asing bisa mematikan peta: Cache API menolak respons 206
 * (range request PMTiles) sehingga fetch tile/halaman gagal total.
 */
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
	navigator.serviceWorker
		.getRegistrations()
		.then((regs) => {
			for (const reg of regs) void reg.unregister();
			// Bila halaman ini masih dikontrol SW lama, muat ulang sekali supaya
			// permintaan berikutnya lepas dari SW (guard anti-loop via sessionStorage).
			if (
				regs.length > 0 &&
				navigator.serviceWorker.controller &&
				!sessionStorage.getItem('tw-sw-dibersihkan')
			) {
				sessionStorage.setItem('tw-sw-dibersihkan', '1');
				console.info('Service worker lama ditemukan: di-unregister, memuat ulang halaman...');
				location.reload();
			}
		})
		.catch(() => {
			/* tanpa SW API / gagal: abaikan */
		});
}
