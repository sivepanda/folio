export default {
    colors: {
        band: 'lilac',
        cup: 'pink',
        cushion: 'indigo',
        yoke: 'mist'
    },
    parts: [
        ['torus', 'band', [0, 0.1, 0], [0.64, 0.07], { arc: [8, 172] }],
        ['box', 'yoke', [-0.64, 0.08, 0], [0.035, 0.14, 0.06]],
        ['box', 'yoke', [0.64, 0.08, 0], [0.035, 0.14, 0.06]],
        ['cylinder', 'cup', [-0.68, -0.26, 0], [0.28, 0.11], { rot: [0, 0, 90] }],
        ['cylinder', 'cup', [0.68, -0.26, 0], [0.28, 0.11], { rot: [0, 0, 90] }],
        ['cylinder', 'cushion', [-0.52, -0.26, 0], [0.25, 0.07], { rot: [0, 0, 90] }],
        ['cylinder', 'cushion', [0.52, -0.26, 0], [0.25, 0.07], { rot: [0, 0, 90] }]
    ]
};
