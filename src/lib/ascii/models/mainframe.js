// Two IBM Z style frames side by side, each with a blue light strip.
/** @param {number} x */
const frame = (x) => [
    ['box', 'frame', [x, 0, 0], [0.4, 0.95, 0.4]],
    ['box', 'door', [x, 0, 0.405], [0.35, 0.88, 0.01]],
    ['box', 'light', [x + 0.24, 0, 0.42], [0.03, 0.8, 0.012]],
    ...[0.6, 0.35, 0.1, -0.15, -0.4, -0.65].map((y) => [
        'box',
        'vent',
        [x - 0.06, y, 0.42],
        [0.22, 0.03, 0.01]
    ]),
    ['box', 'led', [x - 0.24, 0.8, 0.42], [0.03, 0.03, 0.012]]
];

export default {
    colors: {
        frame: 'indigo',
        door: 'ink',
        light: 'sky',
        vent: 'lilac',
        led: 'pink'
    },
    parts: [...frame(-0.42), ...frame(0.42)]
};
