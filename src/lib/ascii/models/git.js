// A git history, for Carya and Mycelia: commits as rings on a main line, with a
// branch that splits off and merges back.
import { tube } from '../tube.js';

const RING = [0.11, 0.035]; // commit ring radius and thickness
const main = [
    [-0.32, -0.85],
    [-0.32, -0.35],
    [-0.32, 0.15],
    [-0.32, 0.8]
];
const branch = [
    [0.34, -0.05],
    [0.34, 0.4]
];

/**
 * A line from commit a to commit b that stops at each ring's edge.
 * @param {string} mat
 * @param {number[]} a
 * @param {number[]} b
 */
const link = (mat, a, b) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = (RING[0] + RING[1]) / d;
    const from = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, 0];
    const to = [b[0] - (b[0] - a[0]) * k, b[1] - (b[1] - a[1]) * k, 0];
    return tube(mat, from, to, 0.04);
};

/** @param {string} mat @param {number[]} p */
const commit = (mat, p) => ['torus', mat, [p[0], p[1], 0], RING];

export default {
    colors: {
        main: 'sky',
        branch: 'pink',
        line: 'lilac'
    },
    parts: [
        ...main.map((p) => commit('main', p)),
        ...branch.map((p) => commit('branch', p)),
        ...main.slice(1).map((p, i) => link('line', main[i], p)),
        link('line', main[1], branch[0]),
        link('line', branch[0], branch[1]),
        link('line', branch[1], main[3])
    ]
};
