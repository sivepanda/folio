<script>
    import { onMount } from 'svelte';
    import ParticleShapes from '../../components/ParticleShapes.svelte';

    let activeShape = $state(null);

    const shapes = {
        star: 'M150,20 L180,100 L260,100 L200,150 L220,230 L150,180 L80,230 L100,150 L40,100 L120,100 Z',
        heart: 'M140,20C73,20,20,74,20,140c0,135,136,170,228,303c88-132,229-173,229-303c0-66-54-120-120-120C311,20,259,51,237,94C216,51,164,20,140,20z',
        wave: 'M0,150 Q50,50 100,150 T200,150 T300,150',
        lightning: null
    };

    onMount(async () => {
        // Fetch and parse SVG file
        const response = await fetch('/shapes/lightning.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const pathElement = svgDoc.querySelector('path');

        if (pathElement) {
            shapes.lightning = pathElement.getAttribute('d');
        }
    });
</script>

<div class="demo-container">
    <ParticleShapes svgPath={shapes[activeShape]} active={activeShape !== null}>
        <div class="controls">
            <button
                class="shape-button"
                onmouseenter={() => (activeShape = 'star')}
                onmouseleave={() => (activeShape = null)}
            >
                STAR
            </button>
            <button
                class="shape-button"
                onmouseenter={() => (activeShape = 'heart')}
                onmouseleave={() => (activeShape = null)}
            >
                HEART
            </button>
            <button
                class="shape-button"
                onmouseenter={() => (activeShape = 'wave')}
                onmouseleave={() => (activeShape = null)}
            >
                WAVE
            </button>
            <button
                class="shape-button"
                onmouseenter={() => (activeShape = 'lightning')}
                onmouseleave={() => (activeShape = null)}
            >
                LIGHTNING
            </button>
        </div>
    </ParticleShapes>
</div>

<style>
    .demo-container {
        width: 100vw;
        height: 100vh;
        background: #0a0a0a;
    }

    .controls {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        gap: 30px;
    }

    .shape-button {
        font-size: 32px;
        font-weight: 700;
        padding: 20px 40px;
        background: transparent;
        border: 2px solid rgba(100, 200, 255, 0.3);
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        user-select: none;
    }

    .shape-button:hover {
        color: #00ffff;
        border-color: #00ffff;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    }
</style>
