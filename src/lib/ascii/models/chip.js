// A poker chip, standing up and facing the viewer, with stripes around the rim.
const stripes = [0, 60, 120, 180, 240, 300].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [
        'box',
        'stripe',
        [0.86 * Math.cos(a), 0.86 * Math.sin(a), 0],
        [0.06, 0.13, 0.13],
        { rot: [0, 0, deg] }
    ];
});

export default {
    colors: {
        chip: 'blue',
        stripe: 'mist',
        inlay: 'lilac'
    },
    parts: [
        ['cylinder', 'chip', [0, 0, 0], [0.9, 0.12], { rot: [90, 0, 0] }],
        ...stripes,
        ['cylinder', 'inlay', [0, 0, 0], [0.48, 0.135], { rot: [90, 0, 0] }],
        ['box', 'chip', [0, 0, 0.13], [0.17, 0.17, 0.02], { rot: [0, 0, 45] }],
        ['box', 'chip', [0, 0, -0.13], [0.17, 0.17, 0.02], { rot: [0, 0, 45] }]
    ]
};
