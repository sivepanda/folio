<script>
    import { onMount } from 'svelte';

    /**
     * @type {{ text?: string, header?: string }}
     *   text: the copy inside the hero to keep readable
     *   header: the fixed bar over the hero that objects stay below
     */
    let { text = 'h1, p', header = '.header' } = $props();

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
                        ),
                        header: /** @type {HTMLElement | null} */ (document.querySelector(header))
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
