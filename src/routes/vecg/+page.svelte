<script>
    import { getContext, onMount } from 'svelte';
    import Footer from '../../components/Footer.svelte';
    import SimpleHeader from '../../components/SimpleHeader.svelte';
    import {
        BLEND_MODES,
        TILE_MODES,
        NATIVE_ARTWORK_HASH,
        createEngine,
        wasmUrl
    } from '$lib/vecg/engine.js';
    import { L, PALETTES, SCENES, SCENE_ORDER } from '$lib/vecg/scenes.js';

    /** @typedef {import('$lib/vecg/scenes.js').SceneId} SceneId */

    // The simple view is the light, quiet one: easy to read, no motion. It's the same page in a
    // different skin, so the canvas (and the engine's context on it) never re-mounts.
    const viewMode = getContext('view-mode');
    let simpleMode = $derived(!!viewMode?.simpleMode);

    const IMAGE_URL = '/vecg/galaga-game-card.png';
    const IMAGE_NAME = 'galaga-game-card.png';
    const MAX_DEVICE = 1024;

    let sceneId = $state(/** @type {SceneId} */ ('curves'));
    /** @type {Record<SceneId, any>} */
    let states = $state(
        /** @type {any} */ (Object.fromEntries(SCENE_ORDER.map((id) => [id, SCENES[id].init()])))
    );
    let status = $state(/** @type {'loading' | 'ready' | 'recovering' | 'error'} */ ('loading'));
    let notice = $state('');
    let stats = $state({
        raster: 0,
        copy: 0,
        w: 0,
        h: 0,
        draws: 0,
        /** @type {[string, number][]} */
        counts: [],
        /** @type {string[]} */
        trace: [],
        title: /** @type {string | null} */ (null),
        frameHash: ''
    });
    let parity = $state(/** @type {{ hash: string, ok: boolean } | null} */ (null));
    let wasmKB = $state(0);

    let scene = $derived(SCENES[sceneId]);
    let s = $derived(states[sceneId]);
    let artworkLoading = $derived(
        sceneId === 'artwork' && status === 'ready' && !stats.title && !notice
    );

    /** @type {HTMLCanvasElement | undefined} */
    let canvas = $state();
    /** @type {CanvasRenderingContext2D | null} */
    let ctx = null;
    /** @type {import('$lib/vecg/engine.js').Engine | null} */
    let engine = null;

    /** @type {Uint8Array | null} */
    let imageBytes = null;
    /** @type {Promise<Uint8Array> | null} */
    let imageFetch = null;
    let bitmapId = -1;

    // A visitor's own image for the mesh. It's re-encoded as PNG in the browser and decoded by
    // the engine's GBitmap::ReadFromFile (lodepng); it never leaves the page.
    const UPLOAD_NAME = 'upload.png';
    const UPLOAD_MAX = 512;
    /** @type {Uint8Array | null} */
    let uploadBytes = null;
    let uploadId = -1;
    let uploadName = $state('');

    let active = -1;
    let hover = -1;
    let grab = { dx: 0, dy: 0 };
    let queued = false;

    // While something is being dragged, render at a lower resolution sized to a frame budget,
    // then draw one full-resolution frame when the drag ends.
    const FRAME_BUDGET_MS = 14;
    let quality = 1;
    let sliding = false;

    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(render);
    }

    /** @param {boolean} interactive */
    function deviceSize(interactive) {
        const css = canvas?.clientWidth || L;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const full = Math.max(128, Math.min(MAX_DEVICE, Math.round(css * dpr)));
        if (sceneId === 'artwork') return states.artwork.native ? 256 : Math.min(768, full);
        return interactive ? Math.max(256, Math.round(full * quality)) : full;
    }

    function render() {
        queued = false;
        if (!engine || !ctx || !canvas || status !== 'ready') return;
        const g = engine;
        const interactive = active >= 0 || sliding;
        const dev = deviceSize(interactive);
        try {
            if (g.width !== dev || canvas.width !== dev) {
                if (!g.init(dev, dev)) return;
                canvas.width = dev;
                canvas.height = dev;
            }
            const t0 = performance.now();
            g.begin();
            const logical = SCENES[sceneId].logical ?? L;
            if (dev !== logical) g.scale(dev / logical, dev / logical);
            const out = SCENES[sceneId].draw(g, states[sceneId], {
                active: active >= 0 ? active : hover,
                bitmap: sceneId === 'quad' && uploadId >= 0 ? uploadId : bitmapId
            });
            const t1 = performance.now();
            g.present(ctx);
            const t2 = performance.now();

            if (interactive) {
                // Cost scales with pixel count, i.e. quality².
                const frame = t2 - t0;
                if (frame > FRAME_BUDGET_MS * 1.25) {
                    quality = Math.max(0.3, quality * Math.sqrt(FRAME_BUDGET_MS / frame));
                } else if (frame < FRAME_BUDGET_MS * 0.6) {
                    quality = Math.min(1, quality * 1.1);
                }
            }

            const counts = [...g.counts.entries()].sort((a, b) => b[1] - a[1]);
            stats = {
                raster: t1 - t0,
                copy: t2 - t1,
                w: g.width,
                h: g.height,
                draws: counts.reduce((n, [, c]) => n + c, 0),
                counts,
                trace: g.trace,
                title: typeof out === 'string' ? out : null,
                frameHash: sceneId === 'artwork' && states.artwork.native ? g.hash() : ''
            };
        } catch (err) {
            recover(err);
        }
    }

    /** A wasm trap leaves the instance unusable: start a fresh one and reset this scene. */
    /** @param {unknown} err */
    async function recover(err) {
        console.error('vecg engine error', err);
        status = 'recovering';
        engine = null;
        bitmapId = -1;
        states[sceneId] = SCENES[sceneId].init();
        notice = 'The engine hit an error, so it was restarted and this scene was reset.';
        try {
            engine = await createEngine();
            if (imageBytes) bitmapId = engine.loadBitmap(IMAGE_NAME, imageBytes);
            if (uploadBytes) uploadId = engine.loadBitmap(UPLOAD_NAME, uploadBytes);
            status = 'ready';
            schedule();
        } catch (e) {
            console.error(e);
            status = 'error';
        }
    }

    async function ensureImage() {
        if (bitmapId >= 0) return;
        imageFetch ??= fetch(IMAGE_URL).then(async (r) => {
            if (!r.ok) throw new Error(`${IMAGE_URL}: ${r.status}`);
            return new Uint8Array(await r.arrayBuffer());
        });
        try {
            imageBytes = await imageFetch;
        } catch (e) {
            imageFetch = null;
            console.error(e);
            notice = "Couldn't load the Galaga bitmap. Switch tabs to try again.";
            return;
        }
        if (engine && bitmapId < 0) {
            bitmapId = engine.loadBitmap(IMAGE_NAME, imageBytes);
            verifyParity();
            schedule();
        }
    }

    /** Render GDrawSomething at 256² off to the side and compare with the native build's hash. */
    function verifyParity() {
        if (!engine || bitmapId < 0) return;
        try {
            engine.init(256, 256);
            engine.begin();
            engine.drawSomething();
            const hash = engine.hash();
            parity = { hash, ok: hash === NATIVE_ARTWORK_HASH };
        } catch (err) {
            recover(err);
        }
        // render() re-inits the device at the display size.
    }

    /** @param {Event & { currentTarget: HTMLInputElement }} e */
    async function onUpload(e) {
        const file = e.currentTarget.files?.[0];
        e.currentTarget.value = '';
        if (!file || !engine) return;
        try {
            const img = await createImageBitmap(file);
            const k = Math.min(1, UPLOAD_MAX / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(img.width * k));
            c.height = Math.max(1, Math.round(img.height * k));
            c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
            img.close();
            const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
            if (!blob || !engine) throw new Error('could not encode image');
            uploadBytes = new Uint8Array(await blob.arrayBuffer());
            // Free the previous upload instead of piling bitmaps up in wasm memory.
            engine.freeBitmaps();
            bitmapId = imageBytes ? engine.loadBitmap(IMAGE_NAME, imageBytes) : -1;
            uploadId = engine.loadBitmap(UPLOAD_NAME, uploadBytes);
            if (uploadId < 0) throw new Error('engine could not decode image');
            uploadName = file.name;
            notice = '';
            states.quad.texture = true;
            schedule();
        } catch (err) {
            console.error(err);
            notice = "Couldn't read that image. Try a PNG or JPEG.";
        }
    }

    function clearUpload() {
        uploadBytes = null;
        uploadId = -1;
        uploadName = '';
        schedule();
    }

    /** @param {SceneId} id */
    function select(id) {
        sceneId = id;
        active = hover = -1;
        notice = '';
        if (SCENES[id].needsImage) ensureImage();
    }

    function resetScene() {
        states[sceneId] = SCENES[sceneId].init();
        notice = '';
    }

    // ---- dragging ----------------------------------------------------------------------

    /** @param {{ clientX: number, clientY: number }} e */
    function toLogical(e) {
        const r = /** @type {HTMLCanvasElement} */ (canvas).getBoundingClientRect();
        const logical = scene.logical ?? L;
        return {
            x: ((e.clientX - r.left) / r.width) * logical,
            y: ((e.clientY - r.top) / r.height) * logical
        };
    }

    /** @param {{ x: number, y: number }} p @param {boolean} touch */
    function hit(p, touch) {
        const pts = s.pts ?? [];
        if (!pts.length || !canvas) return -1;
        const logical = scene.logical ?? L;
        const radius = ((touch ? 26 : 14) * logical) / canvas.clientWidth;
        let best = -1;
        let bestD = radius * radius;
        for (let i = pts.length - 1; i >= 0; i--) {
            if (scene.draggable && !scene.draggable(s, i)) continue;
            const d = (pts[i].x - p.x) ** 2 + (pts[i].y - p.y) ** 2;
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        }
        return best;
    }

    /** @param {number} i */
    function setCursor(i) {
        if (canvas) canvas.style.cursor = active >= 0 ? 'grabbing' : i >= 0 ? 'grab' : '';
    }

    /** @param {PointerEvent} e */
    function onpointerdown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const p = toLogical(e);
        const i = hit(p, e.pointerType !== 'mouse');
        if (i < 0) return;
        active = i;
        grab = { dx: s.pts[i].x - p.x, dy: s.pts[i].y - p.y };
        try {
            canvas?.setPointerCapture(e.pointerId);
        } catch {
            // The pointer may already be gone; dragging still works without capture.
        }
        setCursor(i);
        schedule();
    }

    /** @param {PointerEvent} e */
    function onpointermove(e) {
        const p = toLogical(e);
        if (active >= 0) {
            const logical = scene.logical ?? L;
            const pt = s.pts[active];
            pt.x = Math.max(0, Math.min(logical, p.x + grab.dx));
            pt.y = Math.max(0, Math.min(logical, p.y + grab.dy));
        } else if (e.pointerType === 'mouse') {
            const h = hit(p, false);
            if (h !== hover) {
                hover = h;
                setCursor(h);
                schedule();
            }
        }
    }

    /** @param {PointerEvent} e */
    function onpanelpointerdown(e) {
        if (e.target instanceof HTMLInputElement && e.target.type === 'range') sliding = true;
    }

    function endSlide() {
        if (!sliding) return;
        sliding = false;
        schedule();
    }

    function onpointerup() {
        if (active < 0) return;
        active = -1;
        setCursor(hover);
        schedule();
    }

    function onpointerleave() {
        if (hover >= 0 && active < 0) {
            hover = -1;
            setCursor(-1);
            schedule();
        }
    }

    // Let the page scroll on touch unless the finger lands on a handle.
    $effect(() => {
        const el = canvas;
        if (!el) return;
        /** @param {TouchEvent} e */
        const onTouch = (e) => {
            const t = e.touches[0];
            if (t && (active >= 0 || hit(toLogical(t), true) >= 0)) e.preventDefault();
        };
        el.addEventListener('touchstart', onTouch, { passive: false });
        el.addEventListener('touchmove', onTouch, { passive: false });
        return () => {
            el.removeEventListener('touchstart', onTouch);
            el.removeEventListener('touchmove', onTouch);
        };
    });

    // Re-render whenever the scene or anything in its state changes.
    $effect(() => {
        sceneId;
        $state.snapshot(states[sceneId]);
        schedule();
    });

    onMount(() => {
        ctx = /** @type {HTMLCanvasElement} */ (canvas).getContext('2d');
        const ro = new ResizeObserver(() => schedule());
        ro.observe(/** @type {HTMLCanvasElement} */ (canvas));

        let cancelled = false;
        createEngine()
            .then((e) => {
                if (cancelled) return;
                engine = e;
                status = 'ready';
                const entry = performance
                    .getEntriesByType('resource')
                    .find((r) => r.name.endsWith('.wasm') && r.name.includes('vecg'));
                const bytes = /** @type {PerformanceResourceTiming | undefined} */ (entry)
                    ?.encodedBodySize;
                if (bytes) wasmKB = Math.round(bytes / 1024);
                if (scene.needsImage) ensureImage();
                schedule();
            })
            .catch((err) => {
                console.error(err);
                status = 'error';
            });

        return () => {
            cancelled = true;
            ro.disconnect();
        };
    });

    /** @param {number} ms */
    const ms = (ms) => (ms < 0.1 ? '<0.1' : ms.toFixed(1));
</script>

<svelte:window onpointerup={endSlide} onpointercancel={endSlide} />

<svelte:head>
    <title>2D Vector Graphics Library · Siven Panda</title>
    <meta
        name="description"
        content="An interactive demo of a 2D vector graphics engine I wrote in C++, compiled to WebAssembly and running in the browser."
    />
    <link rel="preload" href={wasmUrl} as="fetch" type="application/wasm" crossorigin="anonymous" />
</svelte:head>

<div class="page" class:simple-page={simpleMode}>
    {#if simpleMode}<SimpleHeader />{/if}
    <main id="main" class="vecg">
        <header class="intro">
            <h1>2D Vector Graphics Library</h1>
            <p>
                A software rasterizer I wrote from scratch in C++: paths and Bézier curves,
                Porter-Duff blending, gradient and bitmap shaders, transforms, and textured triangle
                meshes.
            </p>
            <p>
                The canvas below is running that C++. It's compiled to WebAssembly, unchanged, and
                every pixel you see was written by my engine into its own framebuffer. There's no
                Canvas2D or WebGL drawing here: JavaScript only copies the finished frame onto the
                page.
            </p>
        </header>

        <div class="tabs" role="tablist" aria-label="Demos">
            {#each SCENE_ORDER as id}
                <button
                    type="button"
                    role="tab"
                    aria-selected={sceneId === id}
                    class:active={sceneId === id}
                    onclick={() => select(id)}
                >
                    {SCENES[id].label}
                </button>
            {/each}
        </div>

        <section class="stage">
            <div class="canvas-wrap" class:checker={scene.transparent}>
                <canvas
                    bind:this={canvas}
                    width="512"
                    height="512"
                    class:pixelated={sceneId === 'artwork' && states.artwork.native}
                    aria-label={`${scene.label} demo rendered by the C++ engine. ${s.pts?.length ? 'Drag the round handles to edit it.' : ''}`}
                    {onpointerdown}
                    {onpointermove}
                    {onpointerup}
                    onpointercancel={onpointerup}
                    {onpointerleave}
                ></canvas>
                {#if status !== 'ready' || artworkLoading}
                    <div class="overlay" aria-live="polite">
                        {#if status === 'error'}
                            Couldn't start the engine in this browser.
                        {:else if status === 'recovering'}
                            Restarting the engine…
                        {:else if artworkLoading}
                            Loading the artwork's bitmap…
                        {:else}
                            Loading the engine…
                        {/if}
                    </div>
                {/if}
            </div>

            <aside class="panel" onpointerdown={onpanelpointerdown}>
                <h2>{scene.label}</h2>
                <p class="blurb">{scene.blurb}</p>
                {#if notice}<p class="notice">{notice}</p>{/if}

                {#if sceneId === 'curves'}
                    <fieldset>
                        <legend>Fill</legend>
                        <div class="seg">
                            {#each [['gradient', 'Gradient shader'], ['solid', 'Solid color']] as [v, label]}
                                <button
                                    type="button"
                                    class:on={s.fill === v}
                                    onclick={() => (s.fill = v)}>{label}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Circle contour</legend>
                        <div class="seg">
                            {#each [['ccw', 'Opposite winding'], ['cw', 'Same winding'], ['none', 'None']] as [v, label]}
                                <button
                                    type="button"
                                    class:on={s.hole === v}
                                    onclick={() => (s.hole = v)}>{label}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                    <label class="check"
                        ><input type="checkbox" bind:checked={s.controls} /> Show control points</label
                    >
                {:else if sceneId === 'blend'}
                    <div>
                        <label class="pick">
                            <span class="caption">Blend mode</span>
                            <span class="picker">
                                <select bind:value={s.mode}>
                                    {#each BLEND_MODES as [name], i}
                                        <option value={i}>{name.slice(1)}</option>
                                    {/each}
                                </select>
                            </span>
                        </label>
                        <p class="formula">
                            <code>GBlendMode::{BLEND_MODES[s.mode][0]}</code> = {BLEND_MODES[
                                s.mode
                            ][1]}
                        </p>
                    </div>
                    <label class="range"
                        >Source alpha <span>{s.srcAlpha.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.01" bind:value={s.srcAlpha} />
                    </label>
                    <label class="range"
                        >Destination alpha <span>{s.dstAlpha.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.01" bind:value={s.dstAlpha} />
                    </label>
                {:else if sceneId === 'gradient'}
                    <fieldset>
                        <legend>Tile mode</legend>
                        <div class="seg">
                            {#each TILE_MODES as name, i}
                                <button
                                    type="button"
                                    class:on={s.tile === i}
                                    onclick={() => (s.tile = i)}>{name.slice(1)}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Colors</legend>
                        <div class="seg">
                            {#each PALETTES as p, i}
                                <button
                                    type="button"
                                    class:on={s.palette === i}
                                    onclick={() => (s.palette = i)}>{p.name}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Shape</legend>
                        <div class="seg">
                            {#each [['star', 'Star path'], ['ring', 'Ring'], ['full', 'Whole canvas']] as [v, label]}
                                <button
                                    type="button"
                                    class:on={s.shape === v}
                                    onclick={() => (s.shape = v)}>{label}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                    <label class="range"
                        >Opacity (ModAlpha) <span>{s.opacity.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.01" bind:value={s.opacity} />
                    </label>
                {:else if sceneId === 'quad'}
                    <label class="range"
                        >Tessellation level <span
                            >{s.level} → {2 * (s.level + 1) ** 2} triangles</span
                        >
                        <input type="range" min="0" max="24" step="1" bind:value={s.level} />
                    </label>
                    <label class="check"
                        ><input type="checkbox" bind:checked={s.texture} /> Bitmap texture</label
                    >
                    <label class="check"
                        ><input type="checkbox" bind:checked={s.colors} /> Vertex colors</label
                    >
                    <label class="check"
                        ><input type="checkbox" bind:checked={s.wire} /> Show triangles</label
                    >
                    <label class="range"
                        >Texture repeats <span>{s.repeat}×</span>
                        <input
                            type="range"
                            min="1"
                            max="4"
                            step="1"
                            bind:value={s.repeat}
                            disabled={!s.texture}
                        />
                    </label>
                    <div class="upload">
                        <label class="file">
                            <i class="ri-image-add-line" aria-hidden="true"></i>
                            {uploadName ? 'Use a different image' : 'Use your own image'}
                            <input type="file" accept="image/*" onchange={onUpload} />
                        </label>
                        {#if uploadName}
                            <button type="button" class="link" onclick={clearUpload}
                                >Back to Galaga</button
                            >
                        {/if}
                    </div>
                    <fieldset disabled={!s.texture}>
                        <legend>Texture tile mode</legend>
                        <div class="seg">
                            {#each TILE_MODES as name, i}
                                <button
                                    type="button"
                                    class:on={s.tile === i}
                                    onclick={() => (s.tile = i)}>{name.slice(1)}</button
                                >
                            {/each}
                        </div>
                    </fieldset>
                {:else if sceneId === 'artwork'}
                    {#if stats.title}<p class="title">“{stats.title}”</p>{/if}
                    <fieldset>
                        <legend>Resolution</legend>
                        <div class="seg">
                            <button
                                type="button"
                                class:on={!s.native}
                                onclick={() => (s.native = false)}>Scaled to screen</button
                            >
                            <button
                                type="button"
                                class:on={s.native}
                                onclick={() => (s.native = true)}>Native 256²</button
                            >
                        </div>
                    </fieldset>
                    {#if s.native && stats.frameHash}
                        <p class="hashline">
                            This frame: <code>{stats.frameHash}</code><br />
                            Native g++ build: <code>{NATIVE_ARTWORK_HASH}</code>
                            {#if stats.frameHash === NATIVE_ARTWORK_HASH}<span class="ok"
                                    >identical</span
                                >{/if}
                        </p>
                    {/if}
                {/if}

                {#if s.pts?.length}
                    <button type="button" class="reset" onclick={resetScene}>
                        <i class="ri-refresh-line" aria-hidden="true"></i> Reset
                    </button>
                {/if}
            </aside>
        </section>

        <section class="proof" aria-label="What the engine did this frame">
            <div class="stat-row">
                <span><b>{ms(stats.raster)} ms</b> in the C++ engine</span>
                <span><b>{ms(stats.copy)} ms</b> to copy to screen</span>
                <span><b>{stats.w}×{stats.h}</b> px framebuffer</span>
                <span><b>{stats.draws}</b> engine call{stats.draws === 1 ? '' : 's'}</span>
                {#if wasmKB}<span><b>{wasmKB} KB</b> of WebAssembly</span>{/if}
            </div>
            {#if stats.counts.length}
                <p class="counts">
                    {#each stats.counts as [name, n], i}{i ? ' · ' : ''}<code>{name}</code>
                        ×{n}{/each}
                </p>
            {/if}
            {#if parity}
                <p class="parity">
                    {#if parity.ok}
                        <i class="ri-checkbox-circle-line" aria-hidden="true"></i>
                        Checked in your browser: this build's <code>GDrawSomething</code> output
                        hashes to
                        <code>{parity.hash}</code>, bit-for-bit the same as a native x86-64 build of
                        the same source.
                    {:else}
                        This build's <code>GDrawSomething</code> output hashes to
                        <code>{parity.hash}</code>
                        (native build: <code>{NATIVE_ARTWORK_HASH}</code>).
                    {/if}
                </p>
            {/if}
            <details>
                <summary>Calls made this frame ({stats.trace.length})</summary>
                <ol class="trace">
                    {#each stats.trace as line}<li><code>{line}</code></li>{/each}
                </ol>
            </details>
        </section>
    </main>
</div>

{#if !simpleMode}
    <Footer />
{/if}

<style>
    /* Colours are tokens so the simple view can swap the whole skin. */
    .page {
        --fg: #fff;
        --body: rgba(255, 255, 255, 0.82);
        --muted: rgba(255, 255, 255, 0.6);
        --line: rgba(255, 255, 255, 0.12);
        --glass: rgba(255, 255, 255, 0.035);
        --hover: rgba(255, 255, 255, 0.08);
        --pill-line: rgba(255, 255, 255, 0.08);
        --dash: rgba(255, 255, 255, 0.25);
        --well: rgba(0, 0, 0, 0.25);
        --menu: rgb(20, 20, 38);
        --accent: rgb(100, 200, 150);
        --tint: rgba(100, 200, 150, 0.14);
        --notice: rgb(255, 200, 120);
        --scheme: dark;
        /* Squircle-ish corners: rounded rectangles, not full pills. */
        --round: 0.6rem;
        color-scheme: var(--scheme);
    }

    /* Simple: the site's light reading view. Cream, ink, deeper accent, no motion. */
    :global(html:has(.page.simple-page)),
    :global(body:has(.page.simple-page)) {
        background: #f5f3ed;
    }

    .page.simple-page {
        --fg: #171511;
        --body: #3a3832;
        --muted: #626158;
        --line: #cbc8be;
        --glass: #fbfaf6;
        --hover: #efece3;
        --pill-line: #dcd9cf;
        --dash: #b3b0a6;
        --well: #efece3;
        --menu: #fbfaf6;
        --accent: #17694a;
        --tint: rgba(23, 105, 74, 0.1);
        --notice: #8a5a00;
        --scheme: light;
        min-height: 100vh;
        background: #f5f3ed;
        color: var(--fg);
        font-family: 'Mozilla Text', sans-serif;
        line-height: 1.65;
    }

    .simple-page .vecg,
    .simple-page .vecg :global(*) {
        transition: none !important;
    }

    .vecg {
        width: 100%;
        max-width: 1240px;
        margin: 60px auto 0;
        padding: clamp(1.5rem, 5vw, 4rem) clamp(1rem, 5vw, 5rem) 6vh;
    }

    .simple-page .vecg {
        width: min(70rem, calc(100% - 3rem));
        max-width: none;
        margin: 0 auto;
        padding: 3.5rem 0 5rem;
    }

    .intro {
        max-width: 760px;
    }

    .intro h1 {
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 1.05;
        margin: 0 0 1rem;
    }

    .intro p {
        line-height: 1.55;
        margin: 0 0 0.8rem;
        color: var(--body);
    }

    .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 2rem 0 1rem;
    }

    button {
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    /* Choices are faded until they're hovered or picked. */
    .tabs button,
    .seg button,
    .reset {
        border: 1px solid var(--pill-line);
        background: transparent;
        border-radius: var(--round);
        padding: 0.45rem 0.95rem;
        color: var(--muted);
        font-size: 0.9rem;
        transition:
            background 0.15s,
            border-color 0.15s,
            color 0.15s;
    }

    .tabs button:hover,
    .seg button:hover,
    .reset:hover {
        border-color: var(--line);
        background: var(--hover);
        color: var(--fg);
    }

    .tabs button.active,
    .seg button.on {
        border-color: color-mix(in srgb, var(--accent) 70%, transparent);
        background: var(--tint);
        color: var(--fg);
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .stage {
        display: grid;
        grid-template-columns: minmax(0, 640px) minmax(260px, 1fr);
        gap: clamp(1rem, 3vw, 2rem);
        align-items: start;
    }

    .canvas-wrap {
        position: relative;
        border: 1px solid var(--line);
        border-radius: 0.9rem;
        overflow: hidden;
        background: rgb(11, 11, 26);
        aspect-ratio: 1;
    }

    .canvas-wrap.checker {
        background-color: #1d1d2b;
        background-image: conic-gradient(
            #2a2a3a 25%,
            transparent 0 50%,
            #2a2a3a 0 75%,
            transparent 0
        );
        background-size: 24px 24px;
    }

    canvas {
        display: block;
        width: 100%;
        height: 100%;
        user-select: none;
        -webkit-user-select: none;
    }

    canvas.pixelated {
        image-rendering: pixelated;
    }

    /* Sits on the canvas, which stays dark in both views. */
    .overlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 1rem;
        text-align: center;
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.75);
        background: rgba(11, 11, 26, 0.6);
    }

    .panel {
        border: 1px solid var(--line);
        background: var(--glass);
        border-radius: 0.9rem;
        padding: 1.1rem 1.2rem 1.3rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .panel h2 {
        margin: 0;
        font-size: 1.4rem;
    }

    .panel p {
        margin: 0;
        line-height: 1.5;
    }

    .blurb {
        color: var(--body);
    }

    .notice {
        color: var(--notice);
    }

    fieldset {
        border: 0;
        margin: 0;
        padding: 0;
        min-width: 0;
    }

    fieldset:disabled {
        opacity: 0.45;
    }

    legend,
    .caption {
        display: block;
        font-size: 0.8rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 0.45rem;
        padding: 0;
    }

    .seg {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    .seg button {
        padding: 0.35rem 0.75rem;
        font-size: 0.85rem;
    }

    .pick {
        display: block;
    }

    /* A native select, dressed like the rest of the panel, with a drawn chevron. */
    .picker {
        position: relative;
        display: block;
    }

    .picker::after {
        content: '';
        position: absolute;
        top: 50%;
        right: 0.95rem;
        width: 0.4rem;
        height: 0.4rem;
        border: solid var(--muted);
        border-width: 0 1.5px 1.5px 0;
        transform: translateY(-70%) rotate(45deg);
        pointer-events: none;
    }

    select {
        appearance: none;
        width: 100%;
        padding: 0.5rem 2.4rem 0.5rem 0.8rem;
        border: 1px solid var(--line);
        border-radius: var(--round);
        background: var(--glass);
        color: var(--fg);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.85rem;
        cursor: pointer;
        transition: border-color 0.15s;
    }

    select:hover {
        border-color: color-mix(in srgb, var(--accent) 60%, var(--line));
    }

    option {
        background: var(--menu);
        color: var(--fg);
    }

    .formula {
        margin-top: 0.6rem !important;
        font-size: 0.9rem;
        color: var(--body);
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        cursor: pointer;
    }

    .check input {
        accent-color: var(--accent);
        width: 1rem;
        height: 1rem;
    }

    .range {
        display: grid;
        grid-template-columns: 1fr auto;
        row-gap: 0.35rem;
        font-size: 0.95rem;
    }

    .range span {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82rem;
        color: var(--muted);
    }

    .range input {
        grid-column: 1 / -1;
        accent-color: var(--accent);
        width: 100%;
    }

    .title {
        font-family: 'Mozilla Headline', serif;
        font-size: 1.15rem;
    }

    .hashline {
        font-size: 0.88rem;
        line-height: 1.7 !important;
    }

    .ok {
        margin-left: 0.4rem;
        color: var(--accent);
    }

    .upload {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem 0.9rem;
    }

    .file {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px dashed var(--dash);
        border-radius: var(--round);
        padding: 0.4rem 0.9rem;
        color: var(--muted);
        font-size: 0.85rem;
        cursor: pointer;
    }

    .file:hover,
    .file:focus-within {
        border-color: var(--accent);
        color: var(--fg);
    }

    .file input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }

    .link {
        border: 0;
        background: none;
        padding: 0;
        font-size: 0.85rem;
        color: var(--muted);
        text-decoration: underline;
    }

    .reset {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
    }

    code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.85em;
    }

    .proof {
        margin-top: 1.25rem;
        font-size: 0.92rem;
        color: var(--body);
    }

    .stat-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1.4rem;
    }

    .stat-row b {
        color: var(--fg);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .counts,
    .parity {
        margin: 0.6rem 0 0;
        line-height: 1.6;
    }

    .parity i {
        color: var(--accent);
    }

    details {
        margin-top: 0.8rem;
    }

    summary {
        cursor: pointer;
        color: var(--muted);
    }

    .trace {
        margin: 0.6rem 0 0;
        padding: 0.8rem 0.8rem 0.8rem 2.6rem;
        max-height: 16rem;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 0.6rem;
        background: var(--well);
        font-size: 0.82rem;
        line-height: 1.55;
        color: var(--body);
    }

    @media (max-width: 860px) {
        .stage {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    @media (max-width: 480px) {
        .vecg {
            padding-inline: 1rem;
        }

        .simple-page .vecg {
            width: auto;
        }

        .tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            margin-inline: -1rem;
            padding-inline: 1rem;
        }

        .tabs button {
            flex: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .tabs button,
        .seg button,
        .reset,
        select {
            transition: none;
        }
    }
</style>
