<script>
	import { onDestroy, onMount } from 'svelte';

	export let tag = 'div';

	/**
	 * @type {Element}
	 */
	let element;
	/**
	 * @type {IntersectionObserver}
	 */
	let observer;

	/**
	 * @type {String}
	 */
	export let classname;

	export let effect = 'slide';

	const originalEffectState = effect;

	$: effect = effect;

	/**
	 * @param {any[]} entries
	 */
	function onIntersect(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				switch (effect) {
					case 'slide':
						effect = 'complete';
						break;
				}
			} else {
				effect = originalEffectState;
			}
		});
	}

	onMount(() => {
		observer = new IntersectionObserver(onIntersect, {
			root: null,
			threshold: 0.5
		});

		if (element) {
			observer.observe(element);
		}
	});

	onDestroy(() => {
		if (element) {
			observer.unobserve(element);
		}
	});
</script>

<svelte:element this={tag} class="io {classname} {effect}" bind:this={element} {...$$restProps}>
	<slot />
</svelte:element>

<style>
	.io {
		margin: 0;
		padding: 0;
	}

	.slide {
		transform: translateX(100px);
		transition: 400ms 300ms cubic-bezier(0, 0.55, 0.45, 1);
	}

	.complete {
		transform: translateX(0px);
		transition: 400ms 300ms cubic-bezier(0, 0.55, 0.45, 1);
	}
</style>
