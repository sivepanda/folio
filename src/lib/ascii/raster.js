// Projects point clouds onto a character grid. Each cell keeps the nearest point,
// stored as 4 bytes: glyph index, palette index, brightness, unused. That byte
// grid is all the display needs to draw a frame.

export const RAMP = ' .,-~:;=!*#$@';
const LEVELS = RAMP.length - 1;

// Light from the upper left, slightly in front.
const LIGHT = [-0.45, 0.65, 0.62].map((v, _, a) => v / Math.hypot(...a));
// Mild perspective: points nearer the viewer get up to ~20% larger.
const FOCAL = 6;

export class Raster {
    cols = 0;
    rows = 0;
    invW = 0;
    invH = 0;
    cells = new Uint8Array(0);
    depth = new Float32Array(0);

    /**
     * @param {number} cols
     * @param {number} rows
     * @param {number} cellW cell width in the same units as object positions
     * @param {number} cellH
     */
    resize(cols, rows, cellW, cellH) {
        this.cols = cols;
        this.rows = rows;
        this.invW = 1 / cellW;
        this.invH = 1 / cellH;
        this.cells = new Uint8Array(cols * rows * 4);
        this.depth = new Float32Array(cols * rows);
    }

    clear() {
        this.cells.fill(0);
        this.depth.fill(-Infinity);
    }

    /**
     * @param {{ count: number, pos: Float32Array, nrm: Float32Array, mat: Uint8Array }} cloud
     * @param {number[]} m 3x3 row-major rotation
     * @param {number} x screen position of the centre
     * @param {number} y
     * @param {number} scale screen size of the unit sphere
     * @param {number} layer depth offset so whole objects stack cleanly
     * @param {number} palette first palette slot of this object
     */
    draw(cloud, m, x, y, scale, layer, palette) {
        const { pos, nrm, mat, count } = cloud;
        const { cells, depth, cols, rows, invW, invH } = this;
        const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = m;
        // Light direction and view direction in the object's own frame, so the
        // normals never need rotating.
        const lx = m00 * LIGHT[0] + m10 * LIGHT[1] + m20 * LIGHT[2];
        const ly = m01 * LIGHT[0] + m11 * LIGHT[1] + m21 * LIGHT[2];
        const lz = m02 * LIGHT[0] + m12 * LIGHT[1] + m22 * LIGHT[2];

        for (let i = 0, j = 0; i < count; i++, j += 3) {
            const nx = nrm[j];
            const ny = nrm[j + 1];
            const nz = nrm[j + 2];
            // Back faces only fill in silhouettes; the depth test hides the rest.
            if (m20 * nx + m21 * ny + m22 * nz < -0.2) continue;

            const px = pos[j];
            const py = pos[j + 1];
            const pz = pos[j + 2];
            const z = m20 * px + m21 * py + m22 * pz;
            const k = (scale * FOCAL) / (FOCAL - z);
            const sx = (x + (m00 * px + m01 * py + m02 * pz) * k) * invW;
            const sy = (y - (m10 * px + m11 * py + m12 * pz) * k) * invH;
            if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) continue;

            const cell = (sy | 0) * cols + (sx | 0);
            const d = layer + z;
            if (d <= depth[cell]) continue;
            depth[cell] = d;

            const lit = 0.2 + 0.8 * Math.max(0, lx * nx + ly * ny + lz * nz);
            const o = cell * 4;
            cells[o] = 1 + Math.min(LEVELS - 1, (lit * LEVELS) | 0);
            cells[o + 1] = palette + mat[i];
            cells[o + 2] = (lit * 255) | 0;
        }
    }
}

/**
 * Rotation for an object spinning about its vertical axis with a little wobble.
 * @param {number} yaw
 * @param {number} pitch
 * @param {number} roll
 */
export function orientation(yaw, pitch, roll) {
    const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
    const [cp, sp] = [Math.cos(pitch), Math.sin(pitch)];
    const [cr, sr] = [Math.cos(roll), Math.sin(roll)];
    // Rz(roll) * Rx(pitch) * Ry(yaw), row major.
    // prettier-ignore
    return [
        cr * cy - sr * sp * sy, -sr * cp, cr * sy + sr * sp * cy,
        sr * cy + cr * sp * sy, cr * cp, sr * sy - cr * sp * cy,
        -cp * sy, sp, cp * cy
    ];
}
