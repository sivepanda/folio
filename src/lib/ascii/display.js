// Draws a Raster's byte grid. With WebGL2 a whole frame is one quad: the grid is
// uploaded as a small texture and the fragment shader looks up each cell's glyph
// in a pre-rendered atlas. Canvas 2D is the fallback.

import { RAMP } from './raster.js';

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
export const PALETTE_SIZE = 128;

/**
 * @typedef {object} Display
 * @property {(width: number, height: number, cellW: number, cellH: number, cols: number, rows: number) => void} resize
 *   sizes the canvas and grid; everything in device pixels
 * @property {(rect: number[]) => void} dim area to dim, device pixels [x0, y0, x1, y1]
 * @property {(rgba: Uint8Array) => void} palette PALETTE_SIZE colours
 * @property {(cells: Uint8Array) => void} draw
 * @property {() => void} destroy
 */

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform sampler2D u_grid;
uniform sampler2D u_atlas;
uniform sampler2D u_palette;
uniform vec2 u_cell;
uniform float u_height;
uniform vec4 u_dim;
out vec4 o;
void main() {
    vec2 p = vec2(gl_FragCoord.x, u_height - gl_FragCoord.y);
    vec4 g = texelFetch(u_grid, ivec2(p / u_cell), 0);
    float glyph = floor(g.r * 255.0 + 0.5);
    if (glyph < 0.5) discard;
    vec2 f = fract(p / u_cell);
    float a = texture(u_atlas, vec2((glyph + f.x) / ${RAMP.length}.0, f.y)).a;
    vec3 col = texelFetch(u_palette, ivec2(int(g.g * 255.0 + 0.5), 0), 0).rgb;
    col *= 0.7 + 0.45 * g.b;
    bool under = p.x > u_dim.x && p.x < u_dim.z && p.y > u_dim.y && p.y < u_dim.w;
    a *= under ? 0.3 : 1.0;
    o = vec4(min(col, 1.0) * a, a);
}`;

/**
 * Renders each glyph of the ramp into one row of cells.
 * @param {number} w cell width in device pixels
 * @param {number} h
 */
function atlas(w, h) {
    const c = document.createElement('canvas');
    c.width = w * RAMP.length;
    c.height = h;
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    ctx.font = `bold ${Math.round(h / 1.15)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    for (let i = 1; i < RAMP.length; i++) ctx.fillText(RAMP[i], (i + 0.5) * w, h / 2);
    return c;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Display | null}
 */
export function createDisplay(canvas) {
    return createGL(canvas) ?? create2D(canvas);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Display | null}
 */
function createGL(canvas) {
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power'
    });
    if (!gl) return null;

    /** @type {(type: number, src: string) => WebGLShader} */
    const shader = (type, src) => {
        const s = /** @type {WebGLShader} */ (gl.createShader(type));
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    };
    const prog = /** @type {WebGLProgram} */ (gl.createProgram());
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'a');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /** @type {(unit: number, name: string, filter: number) => void} */
    const texture = (unit, name, filter) => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    };
    texture(0, 'u_grid', gl.NEAREST);
    texture(1, 'u_atlas', gl.LINEAR);
    texture(2, 'u_palette', gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PALETTE_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    /** @param {string} name */
    const u = (name) => gl.getUniformLocation(prog, name);
    const [uCell, uHeight, uDim] = [u('u_cell'), u('u_height'), u('u_dim')];
    gl.clearColor(0, 0, 0, 0);
    let cols = 0;
    let rows = 0;

    return {
        resize(width, height, cellW, cellH, c, r) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            [cols, rows] = [c, r];
            gl.uniform2f(uCell, cellW, cellH);
            gl.uniform1f(uHeight, height);
            gl.activeTexture(gl.TEXTURE1);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                atlas(cellW, cellH)
            );
            gl.activeTexture(gl.TEXTURE0);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                cols,
                rows,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            );
        },
        dim(rect) {
            gl.uniform4f(uDim, rect[0], rect[1], rect[2], rect[3]);
        },
        palette(rgba) {
            gl.activeTexture(gl.TEXTURE2);
            gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                0,
                0,
                PALETTE_SIZE,
                1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rgba
            );
        },
        draw(cells) {
            gl.activeTexture(gl.TEXTURE0);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, cells);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        destroy() {
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
    };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Display | null}
 */
function create2D(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let [cw, ch, cols, rows] = [0, 0, 0, 0];
    let dimRect = [0, 0, 0, 0];
    /** @type {Uint8Array} */
    let colors = new Uint8Array(PALETTE_SIZE * 4);

    return {
        resize(width, height, cellW, cellH, c, r) {
            canvas.width = width;
            canvas.height = height;
            [cw, ch, cols, rows] = [cellW, cellH, c, r];
        },
        dim(rect) {
            dimRect = rect;
        },
        palette(rgba) {
            colors = rgba;
        },
        draw(cells) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `bold ${Math.round(ch / 1.15)}px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const o = (y * cols + x) * 4;
                    if (!cells[o]) continue;
                    const p = cells[o + 1] * 4;
                    const k = 0.7 + (0.45 * cells[o + 2]) / 255;
                    const [px, py] = [x * cw, y * ch];
                    const under =
                        px > dimRect[0] && px < dimRect[2] && py > dimRect[1] && py < dimRect[3];
                    ctx.globalAlpha = under ? 0.3 : 1;
                    ctx.fillStyle = `rgb(${colors[p] * k},${colors[p + 1] * k},${colors[p + 2] * k})`;
                    ctx.fillText(RAMP[cells[o]], px + cw / 2, py + ch / 2);
                }
            }
        },
        destroy() {}
    };
}
