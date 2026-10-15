// Draws stroked SVG paths on a canvas and breaks them up like corrupted video:
// rows of blocks torn sideways, macroblocks smeared in from the previous frame
// (datamosh), low-res blocky bands, colour fringing and stray junk blocks.
// Every effect is a drawImage between canvases, so it stays on the GPU and never
// reads pixels back.

import { TONES } from '$lib/ascii/palette.js';

const BLOCK = 12; // macroblock size, CSS px
const HOLD = 60; // ms each glitch frame holds, like a stuttering decoder
const JUNK = ['magenta', 'violet', 'blue', 'pink', 'sky'].map((t) => TONES[t]);

/** @type {(a: number, b: number) => number} */
const rand = (a, b) => a + Math.random() * (b - a);
/** @type {(v: number, step: number) => number} */
const snap = (v, step) => Math.round(v / step) * step;

/** @param {number} w @param {number} h */
function layer(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
}

/** @param {string} d */
function pathLength(d) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    return el.getTotalLength();
}

/**
 * @typedef {(ctx: CanvasRenderingContext2D, area: { width: number, height: number, top: number, dpr: number }) => void} Overlay
 *   draws extra content (in device pixels) that glitches along with the art;
 *   `top` is where the art ends, since any canvas height beyond it is free space
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ paths: string[], viewBox: number[], matrix: number[], strokeWidth: number }} art
 *   drawn across the top of the canvas at full width; matrix maps path
 *   coordinates into the viewBox, as [a, b, c, d, e, f]
 */
export function createGlitch(canvas, { paths, viewBox, matrix, strokeWidth }) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = (canvas.width = Math.round(canvas.clientWidth * dpr));
    const H = (canvas.height = Math.round(canvas.clientHeight * dpr));
    const B = BLOCK * dpr;
    const out = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    const clean = layer(W, H); // the logo as drawn so far
    const comp = layer(W, H); // clean plus colour fringe
    const tint = layer(W, H);
    const prev = layer(W, H); // last output frame, the datamosh source
    const tiny = layer(Math.ceil(W / 8), Math.ceil(H / 8));

    const shapes = paths.map((d) => ({ path: new Path2D(d), length: pathLength(d) }));
    const s = W / viewBox[0];
    const [a, b, c, d, e, f] = matrix;

    /** @type {any} */
    let glitch = null;
    let until = 0;

    /** @param {number} k intensity 0..1 */
    function roll(k) {
        // Occasional bursts on top of the base level keep it stuttering.
        if (Math.random() < 0.2) k = Math.max(k, rand(0.45, 0.9));
        const rows = () => snap(rand(0, H - B), B);
        return {
            fringe: (1 + k * 7) * dpr * (Math.random() < 0.5 ? -1 : 1),
            tears: Array.from({ length: Math.round(k * 5) }, () => ({
                y: rows(),
                h: snap(rand(B / 2, B * 3), B / 2) || B / 2,
                dx: snap(rand(-1, 1) * k * W * 0.15, B / 2)
            })),
            // Runs of blocks along a row, all dragged by the same motion vector.
            smears: Array.from({ length: Math.round(k * k * 10) }, () => ({
                x: snap(rand(0, W - B), B),
                y: rows(),
                n: Math.round(rand(2, 8)),
                mx: snap(rand(-3, 3) * B, B / 2),
                my: snap(rand(-0.5, 0.5) * B, B / 2)
            })),
            mosaic: Math.random() < k * 0.8 ? { y: rows(), h: snap(rand(B, B * 5), B) } : null,
            junk: Array.from({ length: Math.round(k * k * 6) }, () => ({
                x: snap(rand(0, W - B), B),
                y: rows(),
                w: B * Math.round(rand(1, 6)),
                h: B * Math.round(rand(1, 2)),
                color: JUNK[(Math.random() * JUNK.length) | 0],
                alpha: rand(0.2, 0.6)
            }))
        };
    }

    /** @param {CanvasRenderingContext2D} ctx */
    const wipe = (ctx) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W, H);
    };

    /** @param {string} color @param {number} dx */
    function fringe(color, dx) {
        wipe(tint);
        tint.drawImage(clean.canvas, 0, 0);
        tint.globalCompositeOperation = 'source-in';
        tint.fillStyle = color;
        tint.fillRect(0, 0, W, H);
        comp.drawImage(tint.canvas, dx, 0);
    }

    /**
     * @param {number[]} progress how much of each path is drawn, 0..1
     * @param {number} intensity 0 draws it clean
     * @param {number} now ms timestamp
     * @param {Overlay} [overlay]
     */
    function render(progress, intensity, now, overlay) {
        wipe(clean);
        clean.setTransform(s * a, s * b, s * c, s * d, s * e, s * f);
        clean.strokeStyle = '#fff';
        clean.lineWidth = strokeWidth;
        shapes.forEach((shape, i) => {
            if (progress[i] <= 0) return;
            clean.setLineDash([shape.length * progress[i], shape.length]);
            clean.stroke(shape.path);
        });
        if (overlay) {
            clean.setTransform(1, 0, 0, 1, 0, 0);
            clean.setLineDash([]);
            overlay(clean, { width: W, height: H, top: viewBox[1] * s, dpr });
        }

        wipe(out);
        if (intensity <= 0) {
            out.drawImage(clean.canvas, 0, 0);
            return;
        }
        if (now >= until) {
            glitch = roll(intensity);
            until = now + HOLD * rand(0.5, 1.8);
        }
        const g = glitch;

        // Colour fringe from the site palette, added under the white strokes.
        wipe(comp);
        comp.globalCompositeOperation = 'lighter';
        fringe(TONES.magenta, g.fringe);
        fringe(TONES.blue, -g.fringe);
        comp.globalCompositeOperation = 'source-over';
        comp.drawImage(clean.canvas, 0, 0);

        out.drawImage(comp.canvas, 0, 0);
        for (const t of g.tears) {
            out.clearRect(0, t.y, W, t.h);
            out.drawImage(comp.canvas, 0, t.y, W, t.h, t.dx, t.y, W, t.h);
        }
        // Datamosh: stale blocks from the last frame dragged along their vectors.
        for (const m of g.smears) {
            const w = m.n * B;
            out.drawImage(prev.canvas, m.x, m.y, w, B, m.x + m.mx, m.y + m.my, w, B);
        }
        if (g.mosaic) {
            const { y, h } = g.mosaic;
            const [tw, th] = [Math.ceil(W / 8), Math.ceil(h / 8)];
            tiny.clearRect(0, 0, tw, th);
            tiny.drawImage(out.canvas, 0, y, W, h, 0, 0, tw, th);
            out.imageSmoothingEnabled = false;
            out.clearRect(0, y, W, h);
            out.drawImage(tiny.canvas, 0, 0, tw, th, 0, y, W, h);
            out.imageSmoothingEnabled = true;
        }
        out.globalCompositeOperation = 'lighter';
        for (const j of g.junk) {
            out.globalAlpha = j.alpha;
            out.fillStyle = j.color;
            out.fillRect(j.x, j.y, j.w, j.h);
        }

        wipe(prev);
        prev.drawImage(out.canvas, 0, 0);
    }

    return { render };
}
