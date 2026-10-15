<script>
    import { createTimeline, animate, stagger } from 'animejs';
    import { onMount } from 'svelte';
    import { createGlitch } from '$lib/glitch.js';

    // The SP logo strokes, in the coordinates of the original SVG's inner group.
    const LOGO = {
        paths: [
            'M 18.926311,66.016776 V 41.358024 a 7.7587396,7.7587396 130.64145 0 1 6.582858,-7.669116 l 51.829597,-7.946871 v 11.034219 a 9.7936922,9.7936922 130.56116 0 1 -8.282277,9.676364 l -15.262956,2.384022 v 11.772617 z',
            'm 46.358197,35.881132 -16.590655,2.459531 a 5.047311,5.047311 130.78372 0 0 -4.307147,4.992745 v 7.136755 L 46.58351,47.372106 v 5.4631 A 7.2123416,7.2123416 130.92569 0 1 40.393456,59.97473 L 22.193353,62.580749 V 42.009908 a 5.9040234,5.9040234 130.58981 0 1 4.998716,-5.834202 l 47.273953,-7.335613 v 8.292199 a 6.8074949,6.8074949 130.38167 0 1 -5.714805,6.719227 L 51.25876,46.696167 v 11.153005',
            'M 51.089775,43.142815 V 35.26152 L 71.53695,31.994479 v 2.703758'
        ],
        viewBox: [790.15509, 553.80859],
        matrix: [13.203648, 0, 0, 13.203648, -240.447559, -328.880823],
        strokeWidth: 1.43124
    };

    // A systemd-style boot log printed under the logo, then one frame of the
    // shell before the site appears.
    const BOOT = [
        'mounted /home/siven',
        'loaded experiences',
        'loaded projects',
        'loaded photography',
        'started ascii renderer',
        'started animations',
        'reached target folio'
    ];
    const PROMPT = 'siven@folio:~$ cd ~/folio';
    const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
    const LINE_EVERY = 170; // ms between boot lines
    const PROMPT_AT = [1650, 1740]; // ms window where only the prompt shows

    let visible = $state(true);
    /** @type {HTMLCanvasElement | undefined} */
    let canvas = $state();

    onMount(() => {
        let destroyed = false;
        document.body.classList.add('no-scroll');

        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const el = /** @type {HTMLCanvasElement} */ (canvas);
        const logo = createGlitch(el, LOGO);
        const progress = LOGO.paths.map(() => ({ v: 0 }));
        const started = performance.now();

        // Breaks up hard as it boots, stutters while drawing, and falls apart
        // again as the overlay fades out.
        /** @param {number} t ms since start */
        const intensity = (t) => {
            if (still) return 0;
            const boot = Math.max(0, 1 - t / 450);
            const end = Math.min(1, Math.max(0, (t - 1450) / 450));
            return Math.min(1, 0.1 + boot * 0.8 + end * 0.9);
        };

        /**
         * @param {number} t ms since start
         * @returns {import('$lib/glitch.js').Overlay}
         */
        const bootLog =
            (t) =>
            (ctx, { width, height, top, dpr }) => {
                const size = Math.round(Math.min(14, Math.max(10, width / dpr / 46)) * dpr);
                ctx.font = `${size}px ${MONO}`;
                ctx.textBaseline = 'top';
                const char = ctx.measureText('M').width;
                const x = width * 0.06;
                if (t >= PROMPT_AT[0]) {
                    // Everything else is gone; just the shell, for about one glitch frame.
                    if (t >= PROMPT_AT[1]) return;
                    ctx.fillStyle = '#eeeaff';
                    ctx.fillText(PROMPT, (width - char * PROMPT.length) / 2, height / 2 - size);
                    return;
                }
                BOOT.forEach((line, i) => {
                    if (t < 120 + i * LINE_EVERY) return;
                    const y = top + size * (0.6 + i * 1.4);
                    ctx.fillStyle = '#eeeaff';
                    ctx.fillText('[', x, y);
                    ctx.fillText(`] ${line}`, x + char * 7, y);
                    ctx.fillStyle = '#3ddc84';
                    ctx.fillText('  OK  ', x + char, y);
                });
            };

        let raf = requestAnimationFrame(function frame(now) {
            if (destroyed) return;
            const t = now - started;
            logo.render(
                // The logo drops out for the prompt frame.
                progress.map((p) => (t >= PROMPT_AT[0] ? 0 : p.v)),
                intensity(t),
                now,
                bootLog(t)
            );
            raf = requestAnimationFrame(frame);
        });

        const anim = animate(progress, {
            v: 1,
            ease: 'inOutExpo',
            duration: 1500,
            delay: stagger(150),
            autoplay: false
        });

        const tl = createTimeline({
            duration: 2000,
            autoplay: false
            // @ts-ignore
        })
            .add(el, {
                scale: 0.7,
                duration: 1000
            })
            .sync(anim, '<<')
            .add(
                '#page',
                {
                    opacity: 0,
                    duration: 500,
                    ease: 'outCubic'
                },
                '-=200'
            )
            .add(
                el,
                {
                    scale: 1,
                    ease: 'outCubic',
                    duration: 300
                },
                '<<'
            );

        tl.play();
        tl.then(() => {
            if (destroyed) return;
            cancelAnimationFrame(raf);
            visible = false;
            // Remove no-scroll class when loading is complete
            document.body.classList.remove('no-scroll');

            // Handle path-based scrolling after animation
            const path = window.location.pathname.slice(1); // Remove leading slash
            if (path && path !== '') {
                const target = document.getElementById(path);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        return () => {
            destroyed = true;
            cancelAnimationFrame(raf);
            tl.revert();
            document.body.classList.remove('no-scroll');
        };
    });
</script>

{#if visible}
    <div id="page">
        <canvas bind:this={canvas} aria-hidden="true"></canvas>
    </div>
{/if}

<style>
    :global(.no-scroll),
    :global(body:has(#page)) {
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
    }

    #page {
        position: absolute;
        z-index: 10000;
        display: flex;
        background-color: rgba(0, 0, 0, 0.5);
        height: 100vh;
        width: 100vw;
        backdrop-filter: blur(40px);
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }
    /* The logo's own aspect ratio, plus room underneath for the boot log. */
    canvas {
        width: min(790px, 90vw);
        height: calc(min(790px, 90vw) * 0.70088 + 9.5rem);
    }
</style>
