<script>
	// @ts-nocheck

	import { onMount, createEventDispatcher } from 'svelte';
	import { tick } from 'svelte';
    import {Interactive} from 'svelte-cursor'

	export let gap = 10;
	export let maxColumnWidth = 250;
	export let hover = 'false';
	export let loading;

	const dispatch = createEventDispatcher();

	let slotHolder = null;
	let columns = [];
	let galleryWidth = 0;
	let columnCount = 0;
	var ran = false;

	$: columnCount = parseInt(galleryWidth / maxColumnWidth) || 1;
	$: columnCount && Draw();
	$: galleryStyle = `grid-template-columns: repeat(${columnCount}, 1fr); --gap: ${gap}px`;

	onMount(Draw);

	async function getNatHeight(img) {
		return new Promise(function(resolve, reject) {
			if (img.naturalHeight) {
				resolve(img.naturalHeight);
			} else {
				reject();
			}
		});
	}

	async function consLog(arg) {
		return new Promise(function(resolve, reject) {
			if (arg) {
				resolve(console.log(arg));
			} else {
				reject();
			}
		});
	}

	function HandleClick(e) {
		dispatch('click', {
			src: e.target.src,
			alt: e.target.alt,
			loading: e.target.loading,
			class: e.target.className
		});
	}

	async function Draw() {
		await tick();

		if (!slotHolder) {
			return;
		}

		console.log('drawing 1')
		console.log('drawing 2')
		console.log('drawing 3')

		const images = Array.from(slotHolder.childNodes).filter((child) => child.tagName === 'IMG');
		columns = [];
		var shift = 0;

		console.log('ilen', images.length)

		if(!ran){
			// Fill the columns with image URLs
			for (let i = 0; (i < images.length); i++) {
				var idx = (i % columnCount) + shift;
				const img = new Image();
				img.src = await images[i].src;

				if(columns[idx]){
					console.log(i, img.src)
					if(columns[idx].length > 0) {
						columns[idx]?.push({ src: images[i].src, alt: images[i].alt, class: images[i].className, height: img.naturalHeight })
						getNatHeight(img).then( async (nh) => {
							await console.log('nh', nh);
							await console.log('a', columns[idx].slice(-1)[0].height);
							await console.log('b', nh + columns[idx + 1].slice(-1)[0].height);
							
							if (columns[idx].slice(-1)[0].height + 100 >= nh + columns[idx + 1].slice(-1)[0].height) {
								await consLog('shift');
								shift += 1;
								idx += 1;
							}
							await consLog(idx + ' into arr');
							consLog(columns[idx])

						});
					}
				} else {
					console.log('top');
					columns[idx] = [{ src: images[i].src, alt: images[i].alt, class: images[i].className, height: img.naturalHeight }]
				}

				
				
			}
			ran = true;
		}
		
	}
</script>

<div id="slotHolder" bind:this={slotHolder} on:DOMNodeInserted={Draw} on:DOMNodeRemoved={Draw}>
	<slot />
</div>

{#if columns}
	<div id="gallery" bind:clientWidth={galleryWidth} style={galleryStyle}>
		{#each columns as column}
			<div class="column">
				{#each column as img}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <Interactive>
                        <img
                            src={img.src}
                            alt={img.alt}
                            on:click={HandleClick}
                            class="imag {hover === "true" ? 'img-hover' : ''} {img.class}"
                            {loading}
                        />
                    </Interactive>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<style>
	#slotHolder {
		display: none;
	}
	#gallery {
		width: 100%;
		display: grid;
		gap: var(--gap);
	}
	#gallery .column {
		display: flex;
		flex-direction: column;
	}
	#gallery .column * {
		width: 100%;
		margin-top: var(--gap);
	}
	#gallery .column *:nth-child(1) {
		margin-top: 0;
	}
	.img-hover {
		opacity: 0.9;
        z-index: 1;
		transition: all 0.2s;
	}
	.img-hover:hover {
        position:relative;
		opacity: 1;
		transform: scale(1.5);
        z-index: 9;
	}
</style>
