// Turns a model (a list of simple solid parts) into a point cloud: points spread
// over every visible surface, each with a normal and a material. The renderer
// only ever rotates and projects these points, which is what keeps it cheap.
//
// Model format:
//   { colors: { material: tone, ... }, parts: [[shape, material, [x, y, z], size, opts?], ...], scale? }
// where tone is a key of TONES in palette.js, and scale (default 1) draws the model
// larger than the rest.
// Models sit roughly inside the unit sphere, y up, facing +z (toward the viewer).
// Shapes and their sizes:
//   ellipsoid [rx, ry, rz]       box [hx, hy, hz] (half extents)
//   cylinder  [r, hy] (y axis)   cone [rBottom, rTop, hy] (y axis)
//   capsule   [r, hy] (y axis)   torus [R, r] (ring around the z axis)
//   extrude   [hz]: a flat outline in the xy plane given depth 2·hz (for logos)
// opts: { rot: [x, y, z] degrees, cap: material for the +y cap (the front face of
//   an extrude), arc: [from, to] degrees for torus, rings: outlines for extrude as
//   lists of [x, y] points; rings inside rings make holes }

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** @typedef {(x: number, y: number, z: number, nx: number, ny: number, nz: number, mat?: number) => void} Emit */
/** @typedef {{ rot?: number[], cap?: string, arc?: number[], rings?: number[][][] }} PartOpts */
/** @typedef {(size: number[], s: number, emit: Emit, cap?: number, opts?: PartOpts) => void} Sampler */
/** @typedef {(size: number[], x: number, y: number, z: number, e: number, opts?: PartOpts) => boolean} Inside */

/** @param {number[]} [r] */
function rotation([rx = 0, ry = 0, rz = 0] = []) {
    const [cx, sx] = [Math.cos(rx * D2R), Math.sin(rx * D2R)];
    const [cy, sy] = [Math.cos(ry * D2R), Math.sin(ry * D2R)];
    const [cz, sz] = [Math.cos(rz * D2R), Math.sin(rz * D2R)];
    // Rz * Ry * Rx, row major.
    // prettier-ignore
    return [
        cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
        sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
        -sy, cy * sx, cy * cx
    ];
}

/**
 * Points on a unit sphere, evenly spread.
 * @param {number} n
 * @param {(x: number, y: number, z: number) => void} emit
 */
function fibonacci(n, emit) {
    for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n;
        const r = Math.sqrt(1 - y * y);
        const t = i * GOLDEN;
        emit(r * Math.cos(t), y, r * Math.sin(t));
    }
}

/**
 * Concentric rings filling a disc of radius r at height y, facing ny.
 * @param {number} r
 * @param {number} y
 * @param {number} ny
 * @param {number} s
 * @param {Emit} emit
 * @param {number} [mat]
 */
function disc(r, y, ny, s, emit, mat) {
    const rings = Math.max(1, Math.ceil(r / s));
    for (let k = 0; k <= rings; k++) {
        const rho = (r * k) / rings;
        const n = Math.max(1, Math.ceil((TAU * rho) / s));
        for (let j = 0; j < n; j++) {
            const t = ((j + 0.5 * k) / n) * TAU;
            emit(rho * Math.cos(t), y, rho * Math.sin(t), 0, ny, 0, mat);
        }
    }
}

// Each sampler emits local points + normals spaced roughly `s` apart.
/** @type {Record<string, Sampler>} */
const samplers = {
    ellipsoid([a, b, c], s, emit) {
        const m = Math.max(a, b, c);
        fibonacci(Math.ceil((4 * Math.PI * m * m) / (s * s)), (x, y, z) =>
            emit(a * x, b * y, c * z, x / a, y / b, z / c)
        );
    },
    box([hx, hy, hz], s, emit) {
        /** @type {(u: number, v: number, put: (a: number, b: number) => void) => void} */
        const face = (u, v, put) => {
            const nu = Math.max(1, Math.ceil((2 * u) / s));
            const nv = Math.max(1, Math.ceil((2 * v) / s));
            for (let i = 0; i <= nu; i++)
                for (let j = 0; j <= nv; j++) put(-u + (2 * u * i) / nu, -v + (2 * v * j) / nv);
        };
        for (const d of [-1, 1]) {
            face(hy, hz, (y, z) => emit(d * hx, y, z, d, 0, 0));
            face(hx, hz, (x, z) => emit(x, d * hy, z, 0, d, 0));
            face(hx, hy, (x, y) => emit(x, y, d * hz, 0, 0, d));
        }
    },
    cylinder([r, hy], s, emit, cap) {
        samplers.cone([r, r, hy], s, emit, cap);
    },
    cone([r0, r1, hy], s, emit, cap) {
        const nt = Math.max(6, Math.ceil((TAU * Math.max(r0, r1)) / s));
        const ny = Math.max(1, Math.ceil(Math.hypot(2 * hy, r1 - r0) / s));
        const slope = (r0 - r1) / (2 * hy);
        for (let j = 0; j <= ny; j++) {
            const f = j / ny;
            const y = -hy + 2 * hy * f;
            const r = r0 + (r1 - r0) * f;
            const n = Math.max(6, Math.ceil((nt * Math.max(r, s)) / Math.max(r0, r1)));
            for (let i = 0; i < n; i++) {
                const t = ((i + 0.5 * (j & 1)) / n) * TAU;
                emit(r * Math.cos(t), y, r * Math.sin(t), Math.cos(t), slope, Math.sin(t));
            }
        }
        if (r0 > 0) disc(r0, -hy, -1, s, emit);
        if (r1 > 0) disc(r1, hy, 1, s, emit, cap);
    },
    capsule([r, hy], s, emit) {
        samplers.cone([r, r, hy], s, (x, y, z, nx, ny, nz) => {
            if (Math.abs(y) < hy || ny === 0) emit(x, y, z, nx, ny, nz);
        });
        fibonacci(Math.ceil((4 * Math.PI * r * r) / (s * s)), (x, y, z) =>
            emit(r * x, r * y + Math.sign(y) * hy, r * z, x, y, z)
        );
    },
    torus([R, r], s, emit, _cap, { arc: [a0, a1] = [0, 360] } = {}) {
        const nt = Math.max(3, Math.ceil(((a1 - a0) * D2R * (R + r)) / s));
        const np = Math.max(6, Math.ceil((TAU * r) / s));
        for (let i = 0; i <= nt; i++) {
            const t = (a0 + ((a1 - a0) * i) / nt) * D2R;
            for (let j = 0; j < np; j++) {
                const p = ((j + 0.5 * (i & 1)) / np) * TAU;
                const nx = Math.cos(p) * Math.cos(t);
                const ny = Math.cos(p) * Math.sin(t);
                const nz = Math.sin(p);
                emit(R * Math.cos(t) + r * nx, R * Math.sin(t) + r * ny, r * nz, nx, ny, nz);
            }
        }
    },
    extrude([hz], s, emit, cap, { rings = [] } = {}) {
        // Front and back faces: a staggered grid clipped to the outline.
        const all = rings.flat();
        const [x0, x1] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
        const [y0, y1] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
        for (let y = y0, row = 0; y <= y1; y += s * 0.87, row++) {
            for (let x = x0 + (row & 1 ? s / 2 : 0); x <= x1; x += s) {
                if (!inOutline(rings, x, y)) continue;
                emit(x, y, hz, 0, 0, 1, cap);
                emit(x, y, -hz, 0, 0, -1);
            }
        }
        // Side walls along every edge, facing out of the solid.
        const nz = Math.max(1, Math.ceil((2 * hz) / s));
        for (const ring of rings) {
            ring.forEach(([ax, ay], i) => {
                const [bx, by] = ring[(i + 1) % ring.length];
                const len = Math.hypot(bx - ax, by - ay);
                if (!len) return;
                let [nx, ny] = [(by - ay) / len, -(bx - ax) / len];
                if (inOutline(rings, (ax + bx) / 2 + nx * 1e-3, (ay + by) / 2 + ny * 1e-3)) {
                    [nx, ny] = [-nx, -ny];
                }
                for (let k = 0, n = Math.max(1, Math.ceil(len / s)); k < n; k++) {
                    const [x, y] = [ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n];
                    for (let j = 0; j <= nz; j++) emit(x, y, -hz + (2 * hz * j) / nz, nx, ny, 0);
                }
            });
        }
    }
};

/**
 * Even-odd test, so rings inside other rings cut holes.
 * @param {number[][][]} rings
 * @param {number} x
 * @param {number} y
 */
function inOutline(rings, x, y) {
    let inside = false;
    for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
    }
    return inside;
}

// Whether a local point is inside a shape, shrunk by e so touching surfaces survive.
/** @type {Record<string, Inside>} */
const inside = {
    ellipsoid: ([a, b, c], x, y, z, e) =>
        a > e && b > e && c > e && (x / (a - e)) ** 2 + (y / (b - e)) ** 2 + (z / (c - e)) ** 2 < 1,
    box: ([hx, hy, hz], x, y, z, e) =>
        Math.abs(x) < hx - e && Math.abs(y) < hy - e && Math.abs(z) < hz - e,
    cylinder: ([r, hy], x, y, z, e) => Math.abs(y) < hy - e && x * x + z * z < (r - e) ** 2,
    cone: ([r0, r1, hy], x, y, z, e) =>
        Math.abs(y) < hy - e && Math.hypot(x, z) < r0 + ((r1 - r0) * (y + hy)) / (2 * hy) - e,
    capsule: ([r, hy], x, y, z, e) => {
        const dy = y - Math.max(-hy, Math.min(hy, y));
        return x * x + dy * dy + z * z < (r - e) ** 2;
    },
    torus: ([R, r], x, y, z, e, { arc: [a0, a1] = [0, 360] } = {}) => {
        let t = Math.atan2(y, x) / D2R;
        if (t < a0) t += 360;
        return t >= a0 && t <= a1 && (Math.hypot(x, y) - R) ** 2 + z * z < (r - e) ** 2;
    },
    extrude: ([hz], x, y, z, e, { rings = [] } = {}) =>
        Math.abs(z) < hz - e && inOutline(rings, x, y)
};

// Radius of a sphere around each shape's centre that contains all of it.
/** @type {Record<string, (size: number[], opts: PartOpts) => number>} */
const bounds = {
    ellipsoid: (s) => Math.max(...s),
    box: (s) => Math.hypot(...s),
    cylinder: ([r, hy]) => Math.hypot(r, hy),
    cone: ([r0, r1, hy]) => Math.hypot(Math.max(r0, r1), hy),
    capsule: ([r, hy]) => r + hy,
    torus: ([R, r]) => R + r,
    extrude: ([hz], { rings = [] }) =>
        Math.hypot(Math.max(...rings.flat().map(([x, y]) => Math.hypot(x, y))), hz)
};

/**
 * @param {{ colors: Record<string, string>, parts: any[] }} model
 * @param {number} spacing distance between neighbouring points, in model units
 */
export function buildCloud(model, spacing) {
    const names = Object.keys(model.colors);
    const parts = model.parts.map(([shape, mat, t, size, opts = {}]) => ({
        shape,
        size,
        t,
        opts,
        m: rotation(opts.rot),
        mat: names.indexOf(mat),
        cap: opts.cap ? names.indexOf(opts.cap) : undefined,
        bound: bounds[shape](size, opts) ** 2
    }));

    /** @type {number[]} */
    const pos = [];
    /** @type {number[]} */
    const nrm = [];
    /** @type {number[]} */
    const mats = [];
    const eps = spacing * 0.3;

    parts.forEach((part, pi) => {
        const { m, t } = part;
        samplers[part.shape](
            part.size,
            spacing,
            (lx, ly, lz, nx, ny, nz, mat = part.mat) => {
                const x = m[0] * lx + m[1] * ly + m[2] * lz + t[0];
                const y = m[3] * lx + m[4] * ly + m[5] * lz + t[1];
                const z = m[6] * lx + m[7] * ly + m[8] * lz + t[2];
                // Drop points buried inside any other part.
                for (let qi = 0; qi < parts.length; qi++) {
                    if (qi === pi) continue;
                    const q = parts[qi];
                    const dx = x - q.t[0];
                    const dy = y - q.t[1];
                    const dz = z - q.t[2];
                    if (dx * dx + dy * dy + dz * dz > q.bound) continue;
                    const qm = q.m;
                    // Transpose of the rotation takes the point into q's local frame.
                    const qx = qm[0] * dx + qm[3] * dy + qm[6] * dz;
                    const qy = qm[1] * dx + qm[4] * dy + qm[7] * dz;
                    const qz = qm[2] * dx + qm[5] * dy + qm[8] * dz;
                    if (inside[q.shape](q.size, qx, qy, qz, eps, q.opts)) return;
                }
                const wx = m[0] * nx + m[1] * ny + m[2] * nz;
                const wy = m[3] * nx + m[4] * ny + m[5] * nz;
                const wz = m[6] * nx + m[7] * ny + m[8] * nz;
                const len = Math.hypot(wx, wy, wz) || 1;
                pos.push(x, y, z);
                nrm.push(wx / len, wy / len, wz / len);
                mats.push(mat);
            },
            part.cap,
            part.opts
        );
    });

    // Recentre and scale so the whole thing fits the unit sphere.
    const count = mats.length;
    let [minX, minY, minZ] = [Infinity, Infinity, Infinity];
    let [maxX, maxY, maxZ] = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) {
        minX = Math.min(minX, pos[i]);
        maxX = Math.max(maxX, pos[i]);
        minY = Math.min(minY, pos[i + 1]);
        maxY = Math.max(maxY, pos[i + 1]);
        minZ = Math.min(minZ, pos[i + 2]);
        maxZ = Math.max(maxZ, pos[i + 2]);
    }
    const c = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    let radius = 0;
    for (let i = 0; i < pos.length; i += 3) {
        radius = Math.max(radius, Math.hypot(pos[i] - c[0], pos[i + 1] - c[1], pos[i + 2] - c[2]));
    }
    const out = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i++) out[i] = (pos[i] - c[i % 3]) / radius;

    // How far the object can reach on screen while it spins about y and wobbles a
    // little, so walls can keep all of it in view.
    let reachX = 0;
    let reachY = 0;
    for (let i = 0; i < out.length; i += 3) {
        const flat = Math.hypot(out[i], out[i + 2]);
        reachX = Math.max(reachX, flat);
        reachY = Math.max(reachY, Math.abs(out[i + 1]) + flat * 0.25);
    }

    return {
        count,
        reach: [reachX, Math.min(1, reachY)],
        pos: out,
        nrm: new Float32Array(nrm),
        mat: new Uint8Array(mats),
        colors: names.map((n) => model.colors[n])
    };
}
