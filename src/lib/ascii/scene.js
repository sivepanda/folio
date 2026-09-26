// The hero's bouncing ASCII objects: loading, physics, input and the frame loop.

import { buildCloud } from './cloud.js';
import { Raster, orientation } from './raster.js';
import { createDisplay, PALETTE_SIZE } from './display.js';
import { areaBudget, hintBudget, measuredBudget } from './budget.js';
import { FLASH, TONES } from './palette.js';

// One small chunk per model, fetched only when it's about to be shown.
const loaders = import.meta.glob('./models/*.js', { import: 'default' });
const NAMES = Object.keys(loaders).map((k) => k.slice(9, -3));
const FIRST = ['tux', 'camera'];

const SLOTS = 8; // palette entries per object
const FPS = 30; // idle frame rate; dragging runs at the display's rate
const SLOW_FRAME_MS = 8; // stop adding objects past this much work per frame
const TAU = Math.PI * 2;

/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** @param {string} name */
const load = async (name) => /** @type {any} */ (await loaders[`./models/${name}.js`]());
/** @type {(a: number, b: number) => number} */
const rand = (a, b) => a + Math.random() * (b - a);
/** @type {<T>(list: T[]) => T} */
const pick = (list) => list[(Math.random() * list.length) | 0];

/**
 * Runs fn once the browser is idle, at least `delay` ms from now.
 * @param {() => void} fn
 */
const idle = (fn, delay = 0) => {
    const run = () =>
        'requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 1000 }) : fn();
    return setTimeout(run, delay);
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ host: HTMLElement, text: HTMLElement[] }} opts
 * @returns {() => void} stops the scene and frees the GPU context
 */
export function startScene(canvas, { host, text }) {
    const queue = [
        ...FIRST,
        ...NAMES.filter((n) => !FIRST.includes(n)).sort(() => Math.random() - 0.5)
    ];
    let budget = hintBudget(queue.length);

    // Start fetching the first one or two models before setting up the GPU, so
    // the two overlap and the timing below measures only the network.
    const fetchStart = performance.now();
    const firstBatch = Promise.all(queue.splice(0, Math.min(2, budget)).map(load)).then(
        (models) => {
            budget = Math.min(budget, measuredBudget(performance.now() - fetchStart, NAMES.length));
            return models;
        }
    );

    const created = createDisplay(canvas);
    if (!created) return () => {};
    const display = created;

    const raster = new Raster();
    const palette = new Uint8Array(PALETTE_SIZE * 4);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    /** @type {any[]} */
    const objects = [];

    let width = 0;
    let height = 0;
    let radius = 0; // object radius, CSS px
    let cellW = 0; // CSS px
    let ready = false;
    let loading = false;
    let visible = true;
    let destroyed = false;
    let frameCost = 0;
    let raf = 0;
    let last = 0;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let rebuildTimer;
    let dimRect = [0, 0, 0, 0];
    /** @type {any} */
    let press = null;

    // Point spacing that leaves no gaps at the current cell and object size.
    const spacing = () => cellW / radius / 1.6;
    const cruise = () => Math.min(90, Math.max(30, Math.min(width, height) * 0.08));
    const target = () => {
        if (still) return Math.min(budget, 2);
        const [x0, y0, x1, y1] = dimRect;
        const open = width * height - Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
        return Math.min(budget, areaBudget(open, radius));
    };

    function resize() {
        const dpr = Math.min(2, devicePixelRatio || 1);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        if (!width || !height) return;
        const font = Math.min(13, Math.max(9, Math.round(Math.min(width, height) / 55)));
        const cw = Math.round(font * 0.6 * dpr);
        const ch = Math.round(font * 1.15 * dpr);
        const [w, h] = [Math.round(width * dpr), Math.round(height * dpr)];
        const [cols, rows] = [Math.ceil(w / cw), Math.ceil(h / ch)];
        cellW = cw / dpr;
        radius = Math.min(110, Math.max(46, Math.min(width, height) * 0.12));
        display.resize(w, h, cw, ch, cols, rows);
        raster.resize(cols, rows, cw / dpr, ch / dpr);

        // Dim whatever passes behind the headline so it stays readable.
        const box = canvas.getBoundingClientRect();
        const rects = text.map((el) => el.getBoundingClientRect()).filter((r) => r.width);
        if (rects.length) {
            const pad = 12;
            const x0 = Math.min(...rects.map((r) => r.left)) - box.left - pad;
            const y0 = Math.min(...rects.map((r) => r.top)) - box.top - pad;
            const x1 = Math.max(...rects.map((r) => r.right)) - box.left + pad;
            const y1 = Math.max(...rects.map((r) => r.bottom)) - box.top + pad;
            dimRect = [x0, y0, x1, y1];
            display.dim(dimRect.map((v) => v * dpr));
        }

        for (const o of objects) {
            o.r = radius * 0.9;
            o.x = Math.min(Math.max(o.x, o.r), width - o.r);
            o.y = Math.min(Math.max(o.y, o.r), height - o.r);
        }
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(rebuild, 250);
        if (still) render(0);
        else scheduleNext(1500);
    }

    // Once a resize settles, resample any cloud whose spacing drifted enough to
    // leave holes, one object per idle slot so a window drag never hitches.
    function rebuild() {
        const o = objects.find((o) => Math.abs(o.built / spacing() - 1) > 0.15);
        if (!o || destroyed) return;
        o.cloud = buildCloud(o.model, spacing());
        o.built = spacing();
        if (still) render(0);
        rebuildTimer = idle(rebuild);
    }

    /**
     * A spot clear of the headline and the other objects.
     * @param {number} r
     */
    function freeSpot(r) {
        let best = [width / 2, height / 2];
        let bestScore = -Infinity;
        for (let i = 0; i < 40; i++) {
            const x = rand(r, width - r);
            const y = rand(r, height - r);
            let score = Math.min(
                ...objects.map((o) => Math.hypot(o.x - x, o.y - y) - o.r - r),
                width
            );
            const [x0, y0, x1, y1] = dimRect;
            if (x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1) score -= width;
            if (score > bestScore) [best, bestScore] = [[x, y], score];
        }
        return best;
    }

    /**
     * @param {any} model
     * @param {boolean} enter slide in from an edge instead of appearing in place
     */
    function add(model, enter) {
        const slot = objects.length;
        const r = radius * 0.9;
        const speed = cruise();
        let x, y, angle;
        if (enter) {
            // Slide in from a random edge, heading inwards.
            const edge = (Math.random() * 4) | 0;
            const inward = [0, Math.PI / 2, Math.PI, -Math.PI / 2][edge];
            angle = inward + rand(-0.8, 0.8);
            x = edge === 0 ? -r : edge === 2 ? width + r : rand(r, width - r);
            y = edge === 1 ? -r : edge === 3 ? height + r : rand(r, height - r);
        } else {
            [x, y] = freeSpot(r);
            angle = rand(0, Math.PI * 2);
        }
        objects.push({
            model,
            cloud: buildCloud(model, spacing()),
            built: spacing(),
            colors: Object.values(model.colors).map((/** @type {string} */ tone) =>
                rgb(TONES[tone])
            ),
            pal: slot * SLOTS,
            layer: slot * 4,
            r,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            // Each object sways around a mostly front-on angle; taps and corner hits
            // add full spins that settle back home.
            facing: rand(-0.4, 0.4),
            sway: [rand(0, 7), rand(0.4, 0.7) * pick([-1, 1])],
            wobble: [rand(0, 7), rand(0, 7)],
            turn: 0,
            kick: 0,
            flash: 0,
            flashColor: rgb(pick(FLASH)),
            entering: enter,
            grab: null
        });
    }

    // The first batch places its objects straight away; how long it took to arrive
    // sets how many more are worth fetching. The rest trickle in while the hero is
    // on screen.
    async function loadFirst() {
        const models = await firstBatch;
        if (destroyed) return;
        models.forEach((m) => add(m, false));
        ready = true;
        if (still) render(0);
        else scheduleNext(1500);
    }

    /** @param {number} delay */
    function scheduleNext(delay) {
        clearTimeout(timer);
        if (still || destroyed || !ready || !queue.length || loading) return;
        if (objects.length >= target()) return;
        // Frames are running slow; look again later rather than giving up.
        if (frameCost > SLOW_FRAME_MS) {
            timer = setTimeout(() => scheduleNext(0), 3000);
            return;
        }
        timer = idle(async () => {
            if (!visible || destroyed || loading) return;
            loading = true;
            const model = await load(/** @type {string} */ (queue.shift()));
            loading = false;
            if (destroyed) return;
            add(model, true);
            scheduleNext(rand(1800, 3200));
        }, delay);
    }

    /** @param {any} o */
    function flash(o, strength = 1) {
        o.flash = strength;
        let c;
        do c = rgb(pick(FLASH));
        while (c.join() === o.flashColor.join());
        o.flashColor = c;
    }

    /**
     * @param {number} dt seconds since the last step
     * @param {number} t ms timestamp
     */
    function step(dt, t) {
        const speed = cruise();
        for (const o of objects) {
            if (o.grab) {
                const nx = Math.min(Math.max(o.grab.x - o.grab.dx, o.r), width - o.r);
                const ny = Math.min(Math.max(o.grab.y - o.grab.dy, o.r), height - o.r);
                o.vx += ((nx - o.x) / dt - o.vx) * 0.5;
                o.vy += ((ny - o.y) / dt - o.vy) * 0.5;
                [o.x, o.y] = [nx, ny];
            } else {
                // Thrown or bumped objects ease back to the constant DVD cruise.
                const v = Math.hypot(o.vx, o.vy) || 1;
                const k = (v + (speed - v) * Math.min(1, dt * 0.9)) / v;
                o.vx *= k;
                o.vy *= k;
                o.x += o.vx * dt;
                o.y += o.vy * dt;
            }
            o.turn += o.kick * dt;
            o.kick *= Math.max(0, 1 - dt * 1.4);
            if (Math.abs(o.kick) < 1.5) {
                // Finish the current revolution rather than unwinding it.
                const rev = o.turn / TAU;
                const home = (o.kick >= 0 ? Math.ceil(rev - 0.25) : Math.floor(rev + 0.25)) * TAU;
                o.turn += (home - o.turn) * Math.min(1, dt * 1.6);
            }
            o.flash = Math.max(0, o.flash - dt * 1.2);

            if (o.entering) {
                o.entering = !(o.x > o.r && o.x < width - o.r && o.y > o.r && o.y < height - o.r);
                continue;
            }
            const hitX = o.x < o.r || o.x > width - o.r;
            const hitY = o.y < o.r || o.y > height - o.r;
            if (hitX) o.vx = (o.x < o.r ? 1 : -1) * Math.abs(o.vx);
            if (hitY) o.vy = (o.y < o.r ? 1 : -1) * Math.abs(o.vy);
            o.x = Math.min(Math.max(o.x, o.r), width - o.r);
            o.y = Math.min(Math.max(o.y, o.r), height - o.r);
            if (o.grab || !(hitX || hitY)) continue;

            // Hitting the second wall within a moment of the first counts as a corner.
            const now = t;
            const corner = (hitX && (hitY || now - o.lastY < 150)) || (hitY && now - o.lastX < 150);
            if (hitX) o.lastX = now;
            if (hitY) o.lastY = now;
            if (corner) {
                for (const other of objects) flash(other);
                o.kick += 16 * (Math.sign(o.kick) || 1);
            } else flash(o);
        }

        // Objects bounce off each other like equal-mass billiard balls.
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const a = objects[i];
                const b = objects[j];
                if (a.entering || b.entering) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const overlap = a.r + b.r - dist;
                if (overlap <= 0 || !dist) continue;
                const [nx, ny] = [dx / dist, dy / dist];
                const [wa, wb] = a.grab ? [0, 1] : b.grab ? [1, 0] : [0.5, 0.5];
                a.x -= nx * overlap * wa;
                a.y -= ny * overlap * wa;
                b.x += nx * overlap * wb;
                b.y += ny * overlap * wb;
                const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (rel >= 0) continue;
                a.vx += rel * nx;
                a.vy += rel * ny;
                b.vx -= rel * nx;
                b.vy -= rel * ny;
            }
        }
    }

    /** @param {number} t ms timestamp */
    function render(t) {
        raster.clear();
        for (const o of objects) {
            const yaw = o.facing + o.turn + Math.sin(t * 0.001 * o.sway[1] + o.sway[0]) * 0.7;
            const pitch = Math.sin(t * 0.0007 + o.wobble[0]) * 0.22;
            const roll = Math.sin(t * 0.0005 + o.wobble[1]) * 0.12;
            raster.draw(o.cloud, orientation(yaw, pitch, roll), o.x, o.y, radius, o.layer, o.pal);
            const f = o.flash * 0.85;
            o.colors.forEach((/** @type {number[]} */ c, /** @type {number} */ i) => {
                const p = (o.pal + i) * 4;
                for (let k = 0; k < 3; k++) palette[p + k] = c[k] + (o.flashColor[k] - c[k]) * f;
            });
        }
        display.palette(palette);
        display.draw(raster.cells);
    }

    /** @param {number} now */
    function frame(now) {
        raf = requestAnimationFrame(frame);
        if (now - last < (press?.o.grab ? 0 : 1000 / FPS - 2)) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const start = performance.now();
        step(dt, now);
        render(now);
        // Clamped so one stalled frame (a GC pause, a tab switch) can't swamp the average.
        const cost = Math.min(performance.now() - start, SLOW_FRAME_MS * 2);
        frameCost += (cost - frameCost) * 0.1;
    }

    function play() {
        if (still || raf || destroyed) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
        scheduleNext(1500);
    }

    function pause() {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    // Input. Mouse and pen can grab and throw; touch only taps, so it never blocks
    // scrolling past the hero.
    /** @param {PointerEvent} e */
    function local(e) {
        const box = canvas.getBoundingClientRect();
        return [e.clientX - box.left, e.clientY - box.top];
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    function hit(x, y) {
        /** @type {any} */
        let found = null;
        for (const o of objects) {
            if (Math.hypot(o.x - x, o.y - y) < o.r && (!found || o.layer > found.layer)) found = o;
        }
        return found;
    }

    /** @param {PointerEvent} e */
    function down(e) {
        const target = /** @type {Element} */ (e.target);
        if (still || e.button !== 0 || target.closest('a, button')) return;
        const [x, y] = local(e);
        const o = hit(x, y);
        if (!o) return;
        press = { o, id: e.pointerId, x, y, moved: false };
        if (e.pointerType === 'touch') return;
        e.preventDefault();
        host.setPointerCapture(e.pointerId);
        host.style.cursor = 'grabbing';
        o.grab = { dx: x - o.x, dy: y - o.y, x, y };
    }

    /** @param {PointerEvent} e */
    function move(e) {
        const [x, y] = local(e);
        if (press && e.pointerId === press.id) {
            if (Math.hypot(x - press.x, y - press.y) > 6) press.moved = true;
            if (press.o.grab) Object.assign(press.o.grab, { x, y });
        } else if (e.pointerType === 'mouse' && !still) {
            host.style.cursor = hit(x, y) ? 'grab' : '';
        }
    }

    /** @param {PointerEvent} e */
    function up(e) {
        if (!press || e.pointerId !== press.id) return;
        const { o, moved } = press;
        press = null;
        host.style.cursor = '';
        if (o.grab) {
            o.grab = null;
            const v = Math.hypot(o.vx, o.vy);
            const max = 1600;
            if (v > max) [o.vx, o.vy] = [(o.vx / v) * max, (o.vy / v) * max];
        }
        if (moved || e.type === 'pointercancel') return;
        // A tap gives it a spin and a shove away from the finger.
        const [x, y] = local(e);
        const d = Math.hypot(o.x - x, o.y - y) || 1;
        const push = cruise() * 4;
        o.vx += ((o.x - x) / d) * push;
        o.vy += ((o.y - y) / d) * push;
        o.kick += 10 * (Math.sign(x - o.x) || 1);
        flash(o);
    }

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    text.forEach((el) => resizer.observe(el));
    // Stop animating (and fetching) once the hero is scrolled almost out of view.
    const watcher = new IntersectionObserver(
        ([entry]) => {
            visible = entry.intersectionRatio >= 0.15;
            visible ? play() : pause();
        },
        { threshold: [0, 0.15] }
    );
    watcher.observe(host);
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);

    resize();
    loadFirst();

    return () => {
        destroyed = true;
        pause();
        clearTimeout(timer);
        clearTimeout(rebuildTimer);
        resizer.disconnect();
        watcher.disconnect();
        host.removeEventListener('pointerdown', down);
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', up);
        host.removeEventListener('pointercancel', up);
        host.style.cursor = '';
        display.destroy();
    };
}
