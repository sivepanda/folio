<script lang="js">
	import { Interactive } from 'svelte-cursor';

	/**
	 * @type {any}
	 */
	export let displayImage;
	/**
	 * @type {string}
	 */
	 export let url;

	/**
	 * @param {{ target: { getBoundingClientRect: () => { (): any; new (): any; x: number; y: number; }; offsetWidth: number; offsetHeight: number; style: { transform: string; }; }; clientX: number; clientY: number; }} node
	 */
	function hov(node) {
		const dampenFactor = 30;
		const centerX = node.target.getBoundingClientRect().x + node.target.offsetWidth / 2;
		const centerY = node.target.getBoundingClientRect().y + node.target.offsetHeight / 2;
		var rY = -Math.floor(centerX - node.clientX) / dampenFactor;
		var rX = (Math.floor(centerY - node.clientY) / dampenFactor) * 2;
		node.target.style.setProperty('--perspX', rX);
		node.target.style.setProperty('--perspY', rY);
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<a
	class="main"
	aria-live="polite"
	style="--displayimage: url({displayImage});"
	href={url}
    target="_blank"
	on:mousemove={hov}
>
	<div class="headerim">
		<slot name="headerim">no header provided</slot>
	</div>
</a>

<style>
	.main {
		--perspX: 0deg;
		--perspY: 0deg;
		--width: 40vw;
		--height: 40vh;
		--bor_rad: 2vw;
		width: var(--width);
		height: calc(var(--height) * 0.9);
		background-color: gray;
		background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 1)), var(--displayimage);
		background-position: center;
		background-size: cover;
		border-radius: var(--bor_rad);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-left: 3vw;
        transform: rotateX(0deg) rotateY(0deg);
		box-shadow: 0px 0px 0px white;
		transition: 200ms ease-in-out;
		transform-style: preserve-3d;
	}
	.main:hover {
		box-shadow: 0px 0px 8px black;
		height: calc(var(--height));
		transition: 200ms ease-in-out;
		transform-style: preserve-3d;
        transform: rotateX(--perspX) rotateY(--perspY);
	}
	/* .main:hover :global(img) {
    } */
	.headerim {
		align-self: center;
		transform: rotateX(0deg) rotateY(0deg);
		transform: translateZ(10px);
		width: 60%;
		-webkit-filter: drop-shadow(0px 0px 1px black);
		filter: drop-shadow(0px 0px 1px black);
		transition: 200ms ease-in-out;
	}
	.main:hover .headerim {
		transform: translateZ(50px);
		transition: 200ms ease-in-out;
		/* -webkit-filter: drop-shadow(0px 0px 10px black); */
		/* filter: drop-shadow(0px 0px 10px black); */
	}
	.headerim :global(img) {
		width: 100%;
	}
	.main::after {
		transform: translateZ(-1px);
		inset: -2px;
		width: var(--width);
		height: calc(var(--height) * 0.9);
		border-radius: inherit;
		position: absolute;
		content: '';
		background: linear-gradient(-45deg, red, blue);
		transition: 200ms ease-in-out;
	}
	.main:hover::after {
		height: calc(var(--height));
		transition: 200ms ease-in-out;
		transform: translateZ(-100px);
	}
</style>
