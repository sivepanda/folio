<script lang="js">
// @ts-nocheck

	// import { Interactive } from 'svelte-cursor';

	/**
	 * @type {any}
	 */
	export let displayImage;
	/**
	 * @type {any}
	 */
	 export let url;

	/**
	 * @param {{ target: { getBoundingClientRect: () => { (): any; new (): any; x: number; y: number; }; offsetWidth: number; offsetHeight: number; style: { transform: string; }; }; clientX: number; clientY: number; }} node
	 */
	function hov(node) {
		if (node.target.localName == 'a') {
			const dampenFactor = 30;
			const centerX = node.target.getBoundingClientRect().x + node.target.offsetWidth / 2;
			const centerY = node.target.getBoundingClientRect().y + node.target.offsetHeight / 2;
			var rY = -Math.floor(centerX - node.clientX) / dampenFactor;
			var rX = (Math.floor(centerY - node.clientY) / dampenFactor) * 2;
			node.target.style.transform = 'rotateY(' + rY + 'deg) rotateX(' + rX + 'deg)';
		}
	}

	/**
	 * @param {{ target: { style: { transform: string; }; }; }} node
	 */
	function out(node) {
		node.target.style.transform = 'rotateY(0deg) rotateX(0deg)';
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- <Interactive> -->
<a
	class="main"
	aria-live="polite"
	style="--displayimage: url({displayImage}); color:green"
	href={url}
	target="_blank"
	on:mousemove={hov}
	on:mouseleave={out}
>
	<div class="headerim">
		<slot name="headerim">no header provided</slot>
	</div>
</a>
<!-- </Interactive> -->
<style>
	.main {
		--perspX: 0deg;
		--perspY: 0deg;
		--width: 40vw;
		--height: 33vh;
		--bor_rad: 30px;
		width: 45vw;
		height: 35vh;
		background-color: gray;
		background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 1)), var(--displayimage);
		background-position: center;
		background-size: cover;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		align-content: center;
		justify-content: center;
		transform: rotateX(0deg) rotateY(0deg);
		box-shadow: 0px 0px 0px white;
		transition: 200ms ease-in-out;
		transform-style: preserve-3d;
	}
	.main:hover {
		border-radius: var(--bor_rad);
		box-shadow: 0px 0px 8px black;
		height: calc(var(--height));
		width: calc(var(--width));
		transition: 100ms ease-in-out;
	}
	/* .main:hover :global(img) {
    } */
	.headerim {
        display: flex;
		align-content: center;
		justify-content: center;
		align-self: center;
        justify-self: center;
        max-width: 60%;
        max-height: 60%;
		transform: rotateX(0deg) rotateY(0deg);
		transform: translateZ(10px);
		-webkit-filter: drop-shadow(0px 0px 1px black);
		filter: drop-shadow(0px 0px 1px black);
		transition: 200ms ease-in-out;
	}
	.main:hover .headerim {
		transform: translateZ(50px);
		transition: 200ms ease-in-out;
		z-index: 200;
		/* -webkit-filter: drop-shadow(0px 0px 10px black); */
		/* filter: drop-shadow(0px 0px 10px black); */
	}
	.headerim :global(img) {
        align-self: center;
        justify-self: center;
		max-width: 100%;
        border-radius: 20px;
        max-height: 100%;
        
	}
	.main::after {
		inset: 0px;
		transform: translateZ(-1px);
		width: calc(var(--width) * 0.9);
		height: calc(var(--height) * 0.9);
		border-radius: inherit;
		position: absolute;
		content: '';
		background: linear-gradient(-45deg, red, blue);
		transition: 200ms ease-in-out;
	}
	.main:hover::after {
		inset: -2px;
		height: calc(var(--height));
		width: calc(var(--width));
		transition: 200ms ease-in-out;
		transform: translateZ(-100px);
	}
</style>
