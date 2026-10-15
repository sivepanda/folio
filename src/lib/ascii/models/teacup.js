export default {
    colors: {
        cup: 'mist',
        tea: 'violet',
        saucer: 'sky',
        tag: 'pink',
        string: 'lilac'
    },
    parts: [
        ['cone', 'cup', [0, 0.02, 0], [0.42, 0.6, 0.38], { cap: 'tea' }],
        ['torus', 'cup', [0.56, 0.06, 0], [0.19, 0.055], { arc: [-100, 100] }],
        ['cylinder', 'saucer', [0, -0.4, 0], [0.82, 0.04]],
        ['cylinder', 'saucer', [0, -0.45, 0], [0.4, 0.03]],
        ['capsule', 'string', [-0.48, 0.24, 0.12], [0.014, 0.3], { rot: [0, 0, 32] }],
        ['box', 'tag', [-0.68, -0.08, 0.16], [0.11, 0.13, 0.015], { rot: [0, 0, 8] }]
    ]
};
