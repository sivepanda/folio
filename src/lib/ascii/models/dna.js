// A DNA double helix, for the bioinformatics and medical research work: two
// backbones twisting around each other, joined by base pairs.
import { tube } from '../tube.js';

const TURNS = 1.4;
const RADIUS = 0.36;
const HEIGHT = 1.8;
const STEPS = 28;
const GROOVE = 2.4; // radians between the two strands, giving a major and minor groove

/** @param {number} i @param {number} phase */
const strand = (i, phase) => {
    const t = (i / STEPS) * TURNS * Math.PI * 2 + phase;
    return [RADIUS * Math.cos(t), -HEIGHT / 2 + (HEIGHT * i) / STEPS, RADIUS * Math.sin(t)];
};

const backbones = [0, GROOVE].flatMap((phase, s) =>
    Array.from({ length: STEPS }, (_, i) =>
        tube(s ? 'violet' : 'sky', strand(i, phase), strand(i + 1, phase), 0.055)
    )
);

// Every other step carries a base pair, each half its own colour.
const pairs = Array.from({ length: STEPS / 2 }, (_, k) => {
    const i = k * 2 + 1;
    const [a, b] = [strand(i, 0), strand(i, GROOVE)];
    const mid = [0, 1, 2].map((j) => (a[j] + b[j]) / 2);
    const [left, right] = k % 2 ? ['pink', 'mist'] : ['magenta', 'lilac'];
    return [tube(left, a, mid, 0.03), tube(right, mid, b, 0.03)];
}).flat();

export default {
    colors: {
        sky: 'sky',
        violet: 'violet',
        pink: 'pink',
        mist: 'mist',
        magenta: 'magenta',
        lilac: 'lilac'
    },
    parts: [...backbones, ...pairs]
};
