/**
 * Interactive scenes for /vecg. Each scene only issues engine calls; all pixels come from the
 * C++ rasterizer. Coordinates are in a fixed logical space (L x L, or 256 x 256 for the
 * artwork) that the page maps onto the device with the canvas CTM (scale).
 */

/** @typedef {import('./engine.js').Engine} Engine */
/** @typedef {import('./engine.js').RGBA} RGBA */
/** @typedef {import('./engine.js').Pt} Pt */
/** @typedef {{ active: number, bitmap: number }} DrawCtx */

export const L = 512;

/** @type {RGBA} */
const BG = [0.043, 0.043, 0.102, 1];
/** @type {RGBA} */
const MINT = [0.39, 0.78, 0.59, 1];
/** @type {RGBA} */
const VIOLET = [0.47, 0.25, 0.95, 1];
/** @type {RGBA} */
const PINK = [0.95, 0.3, 0.55, 1];
/** @type {RGBA} */
const CYAN = [0.15, 0.72, 0.95, 1];
/** @type {RGBA} */
const GOLD = [1, 0.8, 0.3, 1];

export const PALETTES = [
    { name: 'Aurora', colors: [MINT, CYAN, VIOLET] },
    {
        name: 'Sunset',
        colors: /** @type {RGBA[]} */ ([
            GOLD,
            [1, 0.38, 0.35, 1],
            [0.6, 0.2, 0.7, 1],
            [0.1, 0.1, 0.33, 1]
        ])
    },
    { name: 'Mono', colors: /** @type {RGBA[]} */ ([[1, 1, 1, 1], BG]) },
    {
        name: 'Spectrum',
        colors: /** @type {RGBA[]} */ ([
            [1, 0.25, 0.3, 1],
            [1, 0.75, 0.2, 1],
            [0.4, 0.9, 0.35, 1],
            [0.2, 0.75, 1, 1],
            [0.55, 0.35, 1, 1],
            [1, 0.3, 0.75, 1]
        ])
    }
];

/** @param {Engine} g @param {number} [size] */
function grid(g, size = L) {
    g.paintReset();
    g.stroke(-1);
    g.color([1, 1, 1, 0.07]);
    for (let v = 32; v < size; v += 32) {
        g.drawLine({ x: v, y: 0 }, { x: v, y: size });
        g.drawLine({ x: 0, y: v }, { x: size, y: v });
    }
}

/** @param {Engine} g @param {Pt} a @param {Pt} b @param {number} [alpha] */
function hairline(g, a, b, alpha = 0.45) {
    g.paintReset();
    g.stroke(-1);
    g.color([1, 1, 1, alpha]);
    g.drawLine(a, b);
}

/**
 * Draggable handles, drawn by the engine like everything else.
 * @param {Engine} g @param {Pt[]} pts @param {number} active @param {(i: number) => boolean} [small]
 */
function handles(g, pts, active, small = () => false) {
    pts.forEach((p, i) => {
        const r = small(i) ? 5 : 7;
        g.paintReset();
        g.color([0.04, 0.04, 0.1, 0.85]);
        g.drawOval(p.x - r - 2.5, p.y - r - 2.5, p.x + r + 2.5, p.y + r + 2.5);
        g.color(i === active ? MINT : [1, 1, 1, 0.95]);
        g.drawOval(p.x - r, p.y - r, p.x + r, p.y + r);
    });
}

/** Bilinear point inside the quad, matching how drawQuad tessellates. */
/** @param {Pt[]} q @param {number} u @param {number} v @returns {Pt} */
function bilerp(q, u, v) {
    const w0 = (1 - u) * (1 - v);
    const w1 = u * (1 - v);
    const w2 = u * v;
    const w3 = (1 - u) * v;
    return {
        x: w0 * q[0].x + w1 * q[1].x + w2 * q[2].x + w3 * q[3].x,
        y: w0 * q[0].y + w1 * q[1].y + w2 * q[2].y + w3 * q[3].y
    };
}

/**
 * @typedef {'curves' | 'blend' | 'gradient' | 'quad' | 'artwork'} SceneId
 * @typedef {object} Scene
 * @property {string} label
 * @property {string} blurb
 * @property {boolean} needsImage fetch the galaga bitmap before drawing
 * @property {boolean} transparent show a checkerboard behind the canvas
 * @property {number} [logical] logical canvas size if not L
 * @property {() => any} init
 * @property {(s: any, i: number) => boolean} [draggable]
 * @property {(g: Engine, s: any, c: DrawCtx) => string | null | void} draw
 */

/** @type {Record<SceneId, Scene>} */
export const SCENES = {
    curves: {
        label: 'Curves',
        blurb: 'Four cubic Béziers make one closed contour, filled with the non-zero winding rule. Drag any point. The circle is a second contour: wind it the same way and the counts add to 2 (filled), wind it the opposite way and they cancel to 0 (a hole).',
        needsImage: false,
        transparent: false,
        init: () => ({
            pts: [
                { x: 256, y: 92 },
                { x: 352, y: 64 },
                { x: 436, y: 168 },
                { x: 424, y: 256 },
                { x: 412, y: 352 },
                { x: 340, y: 436 },
                { x: 256, y: 420 },
                { x: 168, y: 408 },
                { x: 84, y: 352 },
                { x: 96, y: 256 },
                { x: 78, y: 160 },
                { x: 162, y: 78 },
                { x: 256, y: 256 }
            ],
            fill: 'gradient',
            hole: 'ccw',
            controls: true
        }),
        /** @param {any} s @param {number} i */
        draggable: (s, i) => s.controls || i === 12,
        /** @param {Engine} g @param {any} s @param {DrawCtx} c */
        draw(g, s, c) {
            const p = s.pts;
            g.clear(BG);
            grid(g);

            g.paintReset();
            if (s.fill === 'gradient') {
                g.shader(
                    g.linearGradient({ x: 96, y: 96 }, { x: 416, y: 416 }, [MINT, CYAN, VIOLET])
                );
            } else {
                g.color(PINK);
            }
            g.moveTo(p[0].x, p[0].y);
            for (let i = 0; i < 4; i++) {
                const c1 = p[3 * i + 1];
                const c2 = p[3 * i + 2];
                const end = p[(3 * i + 3) % 12];
                g.cubicTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
            }
            if (s.hole !== 'none') {
                const h = p[12];
                g.addOval(h.x - 64, h.y - 64, h.x + 64, h.y + 64, s.hole === 'ccw');
            }
            g.drawPath();

            if (s.controls) {
                for (let i = 0; i < 4; i++) {
                    hairline(g, p[3 * i], p[3 * i + 1]);
                    hairline(g, p[3 * i + 2], p[(3 * i + 3) % 12]);
                }
                handles(g, p, c.active, (i) => i % 3 !== 0 && i !== 12);
            } else {
                handles(g, [p[12]], c.active === 12 ? 0 : -1);
            }
        }
    },

    blend: {
        label: 'Blend modes',
        blurb: 'All 16 Porter-Duff and separable blend modes from the engine. The circle is drawn first (the destination), then the rounded square is drawn over it with the selected mode (the source). The canvas starts fully transparent, so the checkerboard shows exactly where the engine wrote alpha.',
        needsImage: false,
        transparent: true,
        init: () => ({
            pts: [
                { x: 205, y: 215 },
                { x: 310, y: 300 }
            ],
            mode: 11,
            srcAlpha: 0.9,
            dstAlpha: 1
        }),
        /** @param {Engine} g @param {any} s @param {DrawCtx} c */
        draw(g, s, c) {
            const [d, src] = s.pts;
            g.clear([0, 0, 0, 0]);

            g.paintReset();
            g.color([CYAN[0], CYAN[1], CYAN[2], s.dstAlpha]);
            g.drawOval(d.x - 125, d.y - 125, d.x + 125, d.y + 125);

            g.paintReset();
            g.color([PINK[0], PINK[1], PINK[2], s.srcAlpha]);
            g.blend(s.mode);
            const h = 110;
            const r = 38;
            const l = src.x - h;
            const t = src.y - h;
            const ri = src.x + h;
            const b = src.y + h;
            g.moveTo(l + r, t);
            g.lineTo(ri - r, t);
            g.quadTo(ri, t, ri, t + r);
            g.lineTo(ri, b - r);
            g.quadTo(ri, b, ri - r, b);
            g.lineTo(l + r, b);
            g.quadTo(l, b, l, b - r);
            g.lineTo(l, t + r);
            g.quadTo(l, t, l + r, t);
            g.drawPath();

            handles(g, s.pts, c.active);
        }
    },

    gradient: {
        label: 'Gradients',
        blurb: 'A linear gradient shader. Drag its two endpoints, and switch the tile mode to see what happens past them: clamp, repeat, or mirror. Opacity wraps the gradient in a ModAlpha shader.',
        needsImage: false,
        transparent: false,
        init: () => ({
            pts: [
                { x: 196, y: 196 },
                { x: 286, y: 286 }
            ],
            tile: 2,
            palette: 0,
            shape: 'star',
            opacity: 1
        }),
        /** @param {Engine} g @param {any} s @param {DrawCtx} c */
        draw(g, s, c) {
            const [p0, p1] = s.pts;
            g.clear(BG);
            grid(g);

            g.paintReset();
            let sh = g.linearGradient(p0, p1, PALETTES[s.palette].colors, s.tile);
            if (s.opacity < 1) sh = g.modAlpha(sh, s.opacity);
            g.shader(sh);

            if (s.shape === 'full') {
                g.drawRect(0, 0, L, L);
            } else if (s.shape === 'ring') {
                g.addOval(56, 56, 456, 456, false);
                g.addOval(150, 150, 362, 362, true);
                g.drawPath();
            } else {
                // A self-intersecting pentagram: non-zero winding fills the center too.
                const star = [0, 2, 4, 1, 3].map((k) => {
                    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
                    return { x: 256 + 230 * Math.cos(a), y: 272 + 230 * Math.sin(a) };
                });
                g.addPolygon(star);
                g.drawPath();
            }

            hairline(g, p0, p1, 0.7);
            handles(g, s.pts, c.active);
        }
    },

    quad: {
        label: 'Textured mesh',
        blurb: 'drawQuad tessellates a quad into (level + 1)² cells, two triangles each, and passes them to drawMesh. Every triangle samples a bitmap shader through texture coordinates and can multiply in interpolated vertex colors. Drag the corners, or try your own image.',
        needsImage: true,
        transparent: false,
        init: () => ({
            pts: [
                { x: 92, y: 120 },
                { x: 424, y: 76 },
                { x: 446, y: 410 },
                { x: 64, y: 388 }
            ],
            level: 5,
            texture: true,
            colors: false,
            repeat: 1,
            tile: 1,
            wire: true
        }),
        /** @param {Engine} g @param {any} s @param {DrawCtx} c */
        draw(g, s, c) {
            const q = s.pts;
            g.clear(BG);
            grid(g);

            g.paintReset();
            /** @type {Pt[] | null} */
            let texs = null;
            if (s.texture && c.bitmap >= 0) {
                const { w, h } = g.bitmapSize(c.bitmap);
                g.shader(g.bitmapShader(c.bitmap, [1, 0, 0, 1, 0, 0], s.tile));
                const k = s.repeat;
                texs = [
                    { x: 0, y: 0 },
                    { x: w * k, y: 0 },
                    { x: w * k, y: h * k },
                    { x: 0, y: h * k }
                ];
            }
            /** @type {RGBA[] | null} */
            const colors = s.colors ? [MINT, GOLD, PINK, CYAN] : null;
            if (!texs && !colors) g.color(MINT);
            g.drawQuad(q, colors, texs, s.level);

            if (s.wire) {
                const n = s.level + 1;
                for (let i = 0; i <= n; i++) {
                    hairline(g, bilerp(q, i / n, 0), bilerp(q, i / n, 1), 0.3);
                    hairline(g, bilerp(q, 0, i / n), bilerp(q, 1, i / n), 0.3);
                }
                // Each cell is split on its top-right -> bottom-left diagonal.
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        hairline(
                            g,
                            bilerp(q, (i + 1) / n, j / n),
                            bilerp(q, i / n, (j + 1) / n),
                            0.18
                        );
                    }
                }
            }
            handles(g, q, c.active);
        }
    },

    artwork: {
        label: 'Artwork',
        blurb: 'A piece I made, drawn by calling GDrawSomething(canvas, dim), the same entry point the grading harness called, compiled from the same source. "Native 256²" renders it at the size it was graded at, one engine pixel per square.',
        needsImage: true,
        transparent: false,
        logical: 256,
        init: () => ({ pts: [], native: false }),
        /** @param {Engine} g @param {any} _s @param {DrawCtx} c */
        draw(g, _s, c) {
            if (c.bitmap < 0) {
                g.clear(BG); // the artwork reads galaga-game-card.png; wait for it
                return null;
            }
            return g.drawSomething();
        }
    }
};

/** @type {SceneId[]} */
export const SCENE_ORDER = ['curves', 'blend', 'gradient', 'quad', 'artwork'];
