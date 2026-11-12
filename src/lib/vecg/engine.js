/**
 * JS handle on my C++ 2D graphics engine, compiled to WebAssembly.
 *
 * vecg.mjs / vecg.wasm are build output from the vecg-345 repo (`web/build.sh`), which compiles
 * the engine sources unchanged plus a thin C ABI (`web/vecg_bindings.cpp`). Every method below
 * forwards to the real GCanvas / GShader / GPathBuilder code; nothing here rasterizes. The only
 * thing JS does is copy the finished framebuffer onto a <canvas> with putImageData.
 *
 * Don't edit vecg.mjs or vecg.wasm by hand; rebuild them and copy them over.
 */
import wasmUrl from './vecg.wasm?url';

export { wasmUrl };

/** FNV-1a of the 256x256 RGBA output of GDrawSomething from a native (x86-64 g++ -O3) build. */
export const NATIVE_ARTWORK_HASH = '4c7b65f4';

/** Same order as `enum class GBlendMode`, with the formulas from GBlendMode.h. */
export const BLEND_MODES = [
    ['kClear', '0'],
    ['kSrc', 'S'],
    ['kDst', 'D'],
    ['kSrcOver', 'S + (1 − Sa)·D'],
    ['kDstOver', 'D + (1 − Da)·S'],
    ['kSrcIn', 'Da·S'],
    ['kDstIn', 'Sa·D'],
    ['kSrcOut', '(1 − Da)·S'],
    ['kDstOut', '(1 − Sa)·D'],
    ['kSrcATop', 'Da·S + (1 − Sa)·D'],
    ['kDstATop', 'Sa·D + (1 − Da)·S'],
    ['kXor', '(1 − Sa)·D + (1 − Da)·S'],
    ['kModulate', 'S·D'],
    ['kScreen', 'S + D − S·D'],
    ['kDarken', 'S + D − max(S·Da, D·Sa)'],
    ['kLighten', 'S + D − min(S·Da, D·Sa)']
];
export const TILE_MODES = ['kClamp', 'kRepeat', 'kMirror'];

/** @param {number[]} nums */
const finite = (...nums) => nums.every(Number.isFinite);
/** @param {number} n */
const f1 = (n) => (Math.round(n * 10) / 10).toString();

/**
 * @typedef {[number, number, number, number]} RGBA
 * @typedef {{ x: number, y: number }} Pt
 */

export async function createEngine() {
    const { default: createVecg } = await import('./vecg.mjs');
    const M = await createVecg({
        locateFile: (/** @type {string} */ p) => (p.endsWith('.wasm') ? wasmUrl : p)
    });
    return new Engine(M);
}

export class Engine {
    /** @param {any} M emscripten module */
    constructor(M) {
        this.M = M;
        /** @type {string[]} */
        this.trace = [];
        /** @type {Map<string, number>} */
        this.counts = new Map();
        /** @type {string[]} */
        this.pathVerbs = [];
    }

    /** @param {string} name @param {string} [detail] */
    #log(name, detail = '') {
        this.trace.push(detail ? `${name}(${detail})` : `${name}()`);
        if (name.startsWith('draw') || name === 'clear' || name === 'GDrawSomething') {
            this.counts.set(name, (this.counts.get(name) ?? 0) + 1);
        }
    }

    /**
     * Copy typed arrays into wasm scratch memory; returns a pointer per array (0 for null).
     * @param {(Float32Array | Int32Array | null)[]} arrays
     */
    #scratch(arrays) {
        let total = 0;
        const offsets = arrays.map((a) => {
            if (!a) return -1;
            const off = total;
            total += a.length * 4;
            return off;
        });
        const base = this.M._vg_scratch(Math.max(total, 4));
        // Read the heap views after the call: a scratch resize can grow (and replace) memory.
        return arrays.map((a, i) => {
            if (!a) return 0;
            const ptr = base + offsets[i];
            (a instanceof Int32Array ? this.M.HEAP32 : this.M.HEAPF32).set(a, ptr >> 2);
            return ptr;
        });
    }

    // ---- device / frame ------------------------------------------------------------------

    /** @param {number} w @param {number} h */
    init(w, h) {
        return this.M._vg_init(w | 0, h | 0) === 1;
    }
    get width() {
        return this.M._vg_width();
    }
    get height() {
        return this.M._vg_height();
    }

    begin() {
        this.trace = [];
        this.counts = new Map();
        this.pathVerbs = [];
        this.M._vg_begin();
    }

    /** Unpremultiplied RGBA view of the framebuffer (valid until the next engine call). */
    rgba() {
        const ptr = this.M._vg_pixels_rgba();
        return new Uint8ClampedArray(this.M.HEAPU8.buffer, ptr, this.width * this.height * 4);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    present(ctx) {
        ctx.putImageData(new ImageData(this.rgba(), this.width, this.height), 0, 0);
    }

    hash() {
        const px = this.rgba();
        let h = 0x811c9dc5;
        for (let i = 0; i < px.length; i++) {
            h ^= px[i];
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    // ---- canvas state --------------------------------------------------------------------

    save() {
        this.#log('save');
        this.M._vg_save();
    }
    restore() {
        this.#log('restore');
        this.M._vg_restore();
    }
    /** @param {number} x @param {number} y */
    translate(x, y) {
        this.#log('translate', `${f1(x)}, ${f1(y)}`);
        this.M._vg_translate(x, y);
    }
    /** @param {number} x @param {number} y */
    scale(x, y) {
        this.#log('scale', `${x.toFixed(3)}, ${y.toFixed(3)}`);
        this.M._vg_scale(x, y);
    }
    /** @param {number} radians */
    rotate(radians) {
        this.#log('rotate', radians.toFixed(3));
        this.M._vg_rotate(radians);
    }
    /** @param {RGBA} c */
    clear([r, g, b, a]) {
        this.#log('clear');
        this.M._vg_clear(r, g, b, a);
    }

    // ---- paint ---------------------------------------------------------------------------

    paintReset() {
        this.M._vg_paint_reset();
    }
    /** @param {RGBA} c */
    color([r, g, b, a]) {
        this.M._vg_paint_color(r, g, b, a);
    }
    /** @param {number} mode index into BLEND_MODES */
    blend(mode) {
        this.M._vg_paint_blend(mode);
    }
    /** @param {number} width negative for hairline @param {number} [cap] 0 butt, 1 round, 2 square */
    stroke(width, cap = 0) {
        this.M._vg_paint_stroke(width, cap);
    }
    /** @param {number} id shader id, or -1 for none */
    shader(id) {
        this.M._vg_paint_shader(id);
    }

    // ---- shaders (ids last until the next begin()) ---------------------------------------

    /** @param {Pt} p0 @param {Pt} p1 @param {RGBA[]} colors @param {number} [tile] */
    linearGradient(p0, p1, colors, tile = 0) {
        if (!finite(p0.x, p0.y, p1.x, p1.y) || colors.length < 1) return -1;
        this.#log('GShader::LinearGradient', `${colors.length} colors, ${TILE_MODES[tile]}`);
        const [ptr] = this.#scratch([new Float32Array(colors.flat())]);
        return this.M._vg_shader_linear(p0.x, p0.y, p1.x, p1.y, ptr, colors.length, tile);
    }
    /**
     * @param {number} bitmap @param {number[]} m local matrix [a, b, c, d, e, f]
     * @param {number} [tile]
     */
    bitmapShader(bitmap, m, tile = 0) {
        this.#log('GShader::Bitmap', TILE_MODES[tile]);
        return this.M._vg_shader_bitmap(bitmap, m[0], m[1], m[2], m[3], m[4], m[5], tile);
    }
    /** @param {number} base @param {number} alpha */
    modAlpha(base, alpha) {
        this.#log('GShader::ModAlpha', alpha.toFixed(2));
        return this.M._vg_shader_modalpha(base, alpha);
    }

    // ---- bitmaps -------------------------------------------------------------------------

    /**
     * Write PNG bytes into the module's virtual filesystem and decode them with the engine's
     * own GBitmap::ReadFromFile (lodepng). Returns a bitmap id or -1.
     * @param {string} name @param {Uint8Array} bytes
     */
    loadBitmap(name, bytes) {
        this.M.FS.writeFile(name, bytes);
        const enc = new TextEncoder().encode(name + '\0');
        const ptr = this.M._vg_scratch(enc.length);
        this.M.HEAPU8.set(enc, ptr);
        return this.M._vg_bitmap_load(ptr);
    }
    /** Drop every loaded bitmap (ids become invalid). */
    freeBitmaps() {
        this.M._vg_bitmap_free_all();
    }
    /** @param {number} id */
    bitmapSize(id) {
        return { w: this.M._vg_bitmap_width(id), h: this.M._vg_bitmap_height(id) };
    }

    // ---- drawing -------------------------------------------------------------------------

    /** @param {number} l @param {number} t @param {number} r @param {number} b */
    drawRect(l, t, r, b) {
        if (!finite(l, t, r, b)) return;
        this.#log('drawRect', `${f1(l)}, ${f1(t)}, ${f1(r)}, ${f1(b)}`);
        this.M._vg_draw_rect(l, t, r, b);
    }
    /** @param {number} l @param {number} t @param {number} r @param {number} b */
    drawOval(l, t, r, b) {
        if (!finite(l, t, r, b)) return;
        this.#log('drawOval', `${f1(l)}, ${f1(t)}, ${f1(r)}, ${f1(b)}`);
        this.M._vg_draw_oval(l, t, r, b);
    }
    /** @param {Pt} a @param {Pt} b */
    drawLine(a, b) {
        if (!finite(a.x, a.y, b.x, b.y)) return;
        this.#log('drawLine', `{${f1(a.x)}, ${f1(a.y)}}, {${f1(b.x)}, ${f1(b.y)}}`);
        this.M._vg_draw_line(a.x, a.y, b.x, b.y);
    }
    /** @param {Pt[]} pts */
    drawConvexPolygon(pts) {
        if (pts.length < 3 || !pts.every((p) => finite(p.x, p.y))) return;
        this.#log('drawConvexPolygon', `${pts.length} pts`);
        const [ptr] = this.#scratch([new Float32Array(pts.flatMap((p) => [p.x, p.y]))]);
        this.M._vg_draw_convex(ptr, pts.length);
    }

    /** @param {number} x @param {number} y */
    moveTo(x, y) {
        this.pathVerbs.push('move');
        this.M._vg_path_move(x, y);
    }
    /** @param {number} x @param {number} y */
    lineTo(x, y) {
        this.pathVerbs.push('line');
        this.M._vg_path_line(x, y);
    }
    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
    quadTo(x1, y1, x2, y2) {
        this.pathVerbs.push('quad');
        this.M._vg_path_quad(x1, y1, x2, y2);
    }
    /**
     * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
     * @param {number} x3 @param {number} y3
     */
    cubicTo(x1, y1, x2, y2, x3, y3) {
        this.pathVerbs.push('cubic');
        this.M._vg_path_cubic(x1, y1, x2, y2, x3, y3);
    }
    /** @param {number} l @param {number} t @param {number} r @param {number} b @param {boolean} [ccw] */
    addOval(l, t, r, b, ccw = false) {
        this.pathVerbs.push(ccw ? 'oval·ccw' : 'oval·cw');
        this.M._vg_path_add_oval(l, t, r, b, ccw ? 1 : 0);
    }
    /** @param {Pt[]} pts */
    addPolygon(pts) {
        this.pathVerbs.push(`polygon·${pts.length}`);
        const [ptr] = this.#scratch([new Float32Array(pts.flatMap((p) => [p.x, p.y]))]);
        this.M._vg_path_add_polygon(ptr, pts.length);
    }
    drawPath() {
        /** @type {Record<string, number>} */
        const tally = {};
        for (const v of this.pathVerbs) tally[v] = (tally[v] ?? 0) + 1;
        const detail = Object.entries(tally)
            .map(([v, n]) => `${n} ${v}`)
            .join(', ');
        this.#log('drawPath', detail);
        this.pathVerbs = [];
        this.M._vg_draw_path();
    }

    /**
     * @param {Pt[]} verts 4 corners: top-left, top-right, bottom-right, bottom-left
     * @param {RGBA[] | null} colors @param {Pt[] | null} texs @param {number} level
     */
    drawQuad(verts, colors, texs, level) {
        if (verts.length !== 4 || !verts.every((p) => finite(p.x, p.y))) return;
        level = Math.max(0, Math.min(64, level | 0));
        this.#log(
            'drawQuad',
            `level ${level}${colors ? ', colors' : ''}${texs ? ', texs' : ''} → ${2 * (level + 1) ** 2} tris`
        );
        const [v, c, t] = this.#scratch([
            new Float32Array(verts.flatMap((p) => [p.x, p.y])),
            colors ? new Float32Array(colors.flat()) : null,
            texs ? new Float32Array(texs.flatMap((p) => [p.x, p.y])) : null
        ]);
        this.M._vg_draw_quad(v, c, t, level);
    }

    /**
     * Calls GDrawSomething(canvas, dim), the literal entry point the course harness used.
     * The artwork reads galaga-game-card.png from the filesystem, so load that first.
     */
    drawSomething() {
        this.#log('GDrawSomething', 'canvas, dim');
        const ptr = this.M._vg_draw_something();
        return ptr ? this.M.UTF8ToString(ptr) : null;
    }
}
