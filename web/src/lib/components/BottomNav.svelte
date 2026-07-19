<script lang="ts">
	import { page } from '$app/state';
	import Icon, { type IconName } from './Icon.svelte';

	const MENU: { href: string; label: string; icon: IconName }[] = [
		{ href: '/', label: 'Beranda', icon: 'beranda' },
		{ href: '/peta', label: 'Peta', icon: 'peta' },
		{ href: '/analisis', label: 'Analisis', icon: 'analisis' },
		{ href: '/rekomendasi', label: 'Saran', icon: 'rekomendasi' },
		{ href: '/survey', label: 'Survey', icon: 'survey' },
		{ href: '/metodologi', label: 'Metode', icon: 'metodologi' }
	];

	/**
	 * null = ikuti default rute: di /peta navigasi disembunyikan (peta butuh
	 * ruang penuh + atribusi basemap tetap terlihat), di halaman lain tampil.
	 */
	let tampil = $state<boolean | null>(null);
	const efektifTampil = $derived(tampil ?? page.url.pathname !== '/peta');

	// pindah halaman -> kembali ke default rute tersebut
	$effect(() => {
		void page.url.pathname;
		tampil = null;
	});
</script>

{#if efektifTampil}
	<nav
		class="fixed inset-x-3 bottom-3 z-20 md:hidden"
		aria-label="Navigasi bawah"
		data-testid="bottom-nav"
	>
		<div
			class="relative rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-md"
		>
			<button
				type="button"
				class="absolute -top-3 left-1/2 flex h-6 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 shadow-sm hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
				aria-label="Sembunyikan navigasi"
				onclick={() => (tampil = false)}
				data-testid="bottom-nav-sembunyikan"
			>
				<Icon name="chevron-bawah" size={14} />
			</button>
			<ul class="grid grid-cols-6">
				{#each MENU as item (item.href)}
					{@const aktif = page.url.pathname === item.href}
					<li>
						<a
							href={item.href}
							class={`flex flex-col items-center gap-0.5 rounded-2xl py-2.5 ${
								aktif ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
							}`}
							aria-current={aktif ? 'page' : undefined}
						>
							<Icon name={item.icon} size={20} />
							<span class={`text-[10px] leading-none ${aktif ? 'font-bold' : 'font-medium'}`}>
								{item.label}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</nav>
{:else}
	<button
		type="button"
		class="fixed right-3 bottom-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-600 shadow-2xl shadow-slate-900/10 backdrop-blur-md hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none md:hidden"
		aria-label="Tampilkan navigasi"
		onclick={() => (tampil = true)}
		data-testid="bottom-nav-tampilkan"
	>
		<Icon name="chevron-atas" size={18} />
	</button>
{/if}
