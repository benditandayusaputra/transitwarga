<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	let { onToken }: { onToken: (token: string) => void } = $props();

	const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
	let el = $state<HTMLDivElement | undefined>(undefined);

	interface TurnstileApi {
		render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => void;
	}

	onMount(() => {
		if (!siteKey || !el) return;
		const w = window as unknown as { turnstile?: TurnstileApi; __twTurnstileOnload?: () => void };
		const render = () => {
			if (el) w.turnstile?.render(el, { sitekey: siteKey, callback: onToken });
		};
		if (w.turnstile) {
			render();
			return;
		}
		w.__twTurnstileOnload = render;
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__twTurnstileOnload';
		script.async = true;
		document.head.appendChild(script);
	});
</script>

{#if siteKey}
	<div bind:this={el} class="my-2" data-testid="turnstile-widget"></div>
{/if}
