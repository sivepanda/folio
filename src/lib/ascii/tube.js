// A capsule running from point a to point b, as a model part. Models use it to
// build strands, branches and other line-like shapes.

/**
 * @param {string} mat
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} r
 */
export function tube(mat, a, b, r) {
    const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(dx, dy, dz) || 1e-6;
    // Capsules run along y; tilt about x, then turn about z, to point y along a→b.
    const tilt = (Math.asin(dz / len) * 180) / Math.PI;
    const turn = (Math.atan2(-dx, dy) * 180) / Math.PI;
    const mid = [0, 1, 2].map((k) => (a[k] + b[k]) / 2);
    return ['capsule', mat, mid, [r, len / 2], { rot: [tilt, 0, turn] }];
}
