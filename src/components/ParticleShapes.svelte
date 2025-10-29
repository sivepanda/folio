<script>
	import { onMount } from 'svelte';
	import { animate } from 'animejs';

	let {
		svgPath = null,
		active = false,
		particleCount = 1000,
		particleColor = 'rgba(100, 200, 255, 1)',
		backgroundColor = 'rgba(10, 10, 10, 0.1)'
	} = $props();

	let canvas;
	let ctx;
	let particles = [];
	let previousActive = false;

	$effect(() => {
		if (!canvas) return;

		if (active && !previousActive && svgPath) {
			// Activate: morph to shape
			const positions = generatePathPositions(svgPath, canvas.width, canvas.height);
			animateToShape(positions);
		} else if (!active && previousActive) {
			// Deactivate: scatter
			const positions = generateScatteredPositions(canvas.width, canvas.height);
			animateToShape(positions);
		}

		previousActive = active;
	});

	class Particle {
		constructor(width, height) {
			this.x = Math.random() * width;
			this.y = Math.random() * height;
			this.size = Math.random() * 2 + 1;
			this.opacity = Math.random() * 0.5 + 0.5;
		}

		draw(ctx, color) {
			const rgb = color.match(/\d+/g);
			ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${this.opacity})`;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function generateScatteredPositions(width, height) {
		const positions = [];
		for (let i = 0; i < particleCount; i++) {
			positions.push({
				x: Math.random() * width,
				y: Math.random() * height
			});
		}
		return positions;
	}

	function generatePathPositions(pathData, width, height) {
		const positions = [];
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', pathData);
		svg.appendChild(path);

		const pathLength = path.getTotalLength();
		const bbox = path.getBBox();

		for (let i = 0; i < particleCount; i++) {
			const distance = (i / particleCount) * pathLength;
			const point = path.getPointAtLength(distance);
			positions.push({
				x: point.x - bbox.x - bbox.width / 2 + width / 2,
				y: point.y - bbox.y - bbox.height / 2 + height / 2
			});
		}

		return positions;
	}

	function animateToShape(targetPositions) {
		particles.forEach((particle, i) => {
			const target = targetPositions[i % targetPositions.length];

			animate(particle, {
				x: target.x,
				y: target.y,
				duration: 1500,
				ease: 'outExpo'
			});
		});
	}

	onMount(() => {
		ctx = canvas.getContext('2d');

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		resizeCanvas();

		// Initialize particles
		for (let i = 0; i < particleCount; i++) {
			particles.push(new Particle(canvas.width, canvas.height));
		}

		// Animation loop
		function animateLoop() {
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			particles.forEach((particle) => particle.draw(ctx, particleColor));

			requestAnimationFrame(animateLoop);
		}

		animateLoop();

		// Handle resize
		const handleResize = () => {
			resizeCanvas();

			if (active && svgPath) {
				const positions = generatePathPositions(svgPath, canvas.width, canvas.height);
				animateToShape(positions);
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<div class="particle-container">
	<canvas bind:this={canvas}></canvas>
	<div class="content">
		<slot />
	</div>
</div>

<style>
	.particle-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: block;
	}

	.content {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
	}
</style>
