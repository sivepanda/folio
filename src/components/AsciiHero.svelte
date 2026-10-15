<script>
    import { onMount } from 'svelte';

    /** @type {{ text?: string }} selector for the copy inside the hero to keep readable */
    let { text = 'h1, p' } = $props();

    /** @type {HTMLCanvasElement} */
    let canvas;

    onMount(() => {
        let stop = () => {};
        let cancelled = false;

        // The renderer is its own chunk, fetched once the page has painted so it
        // never competes with the headline or fonts.
        const start = () =>
            import('$lib/ascii/scene.js')
                .then(({ startScene }) => {
                    if (cancelled) return;
                    const host = /** @type {HTMLElement} */ (canvas.parentElement);
                    stop = startScene(canvas, {
                        host,
                        text: [...host.querySelectorAll(text)].map(
                            (el) => /** @type {HTMLElement} */ (el)
                        )
                    });
                })
                .catch(() => {});

        const hasIdle = 'requestIdleCallback' in window;
        const id = hasIdle ? requestIdleCallback(start, { timeout: 800 }) : setTimeout(start, 200);

        return () => {
            cancelled = true;
            if (hasIdle) cancelIdleCallback(/** @type {number} */ (id));
            else clearTimeout(id);
            stop();
        };
    });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
    canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }
</style>
