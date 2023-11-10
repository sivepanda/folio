<script>
	// @ts-nocheck

	import { onMount, createEventDispatcher } from 'svelte';
	import { tick } from 'svelte';
	// import { Interactive } from 'svelte-cursor';

	export let gap = 10;
	export let maxColumnWidth = 250;
	export let hover = 'false';
	export let loading = 'lazy';

	const dispatch = createEventDispatcher();

	let slotHolder;
	let columns = [];
	let galleryWidth = 100;
	let columnCount = 0;
	var ran = 0;

	$: columnCount = Math.floor(galleryWidth / maxColumnWidth) || 1;
	$: columnCount;
	$: galleryStyle = `grid-template-columns: repeat(${columnCount}, 1fr); --gap: ${gap}px`;

	async function getNatHeight(img) {
		return new Promise(function (resolve, reject) {
			if (img.naturalHeight && img.naturalWidth) {
				resolve((img.naturalHeight) / (img.naturalWidth / galleryWidth));
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
		await tick()

		if (!slotHolder) {
			console.log('no bueno',columns);
			return;
		}

		console.log('drawing 2');
		console.log('drawing 3');

		const images = Array.from(slotHolder.childNodes).filter((child) => child.tagName === 'IMG');
		columns = [];
		var shift = 0;

		console.log('ran', ran);
		console.log(columns)

		let promises = images.map((value, i) => {
			new Promise(async (resolve, reject) => {
				var idx = (i % columnCount) + shift;
				const img = new Image();
				img.src = await images[i].src;
				columns[idx] = columns[idx]?columns[idx]:[]

				console.log(columns, idx, 'ind',i, '\ncolumncount', columnCount, '\ngw', galleryWidth, '\nmcw', maxColumnWidth)
				
				const imgObject = {
						src: images[i].src,
						alt: images[i].alt,
						class: images[i].className,
						height: (img.naturalHeight) / (img.naturalWidth / galleryWidth)
					}

				if (columns[idx].length > 0) {
					const naturalHeight = await getNatHeight(img);
					if ( idx < columnCount - 1 && columns[idx].slice(-1)[0].height + 100 >= naturalHeight + columns[idx + 1].slice(-1)[0].height ) {
						await columns[(idx + 1)]?.push(imgObject);
						console.log((idx+1),'e',imgObject);
						shift += 1;
						
						await resolve(imgObject);
						
					} else {
						await columns[idx]?.push(imgObject);
						console.log(columns);
						
						resolve(imgObject);
					}
				} else {
					columns[idx] = [imgObject];
					console.log(columns);

					await resolve(imgObject);
				}
				reject();
			})
		});

		
		return Promise.all(promises).then(values => {
			console.log('v',values);
			return columns;
		});
	}
</script>

<div id="slotHolder" bind:this={slotHolder} on:DOMNodeInserted={Draw} on:DOMNodeRemoved={Draw}>
	<slot />
</div>

<div id="gallery" bind:clientWidth={galleryWidth} style={galleryStyle}>

	{#await Draw()}
		<div><p>Loading...</p></div>
	{:then columns}
			{#each columns as column}
				<div class="column">
					{#each column as img}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<!-- <Interactive> -->
							<img
								src={img.src}
								alt={img.alt}
								on:click={HandleClick}
								class="imag {hover === 'true' ? 'img-hover' : ''} {img.class}"
								{loading}
							/>
						<!-- </Interactive> -->
					{/each}
				</div>
			{/each}
	{/await}
</div>

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
		position: relative;
		opacity: 1;
		transform: scale(1.5);
		z-index: 9;
	}
</style>
