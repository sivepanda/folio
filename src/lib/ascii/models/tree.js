// A round hickory tree.
export default {
    colors: {
        leaf: 'blue',
        light: 'sky',
        bark: 'violet'
    },
    parts: [
        ['cone', 'bark', [0, -0.55, 0], [0.15, 0.1, 0.38]],
        ['capsule', 'bark', [0.16, -0.18, 0], [0.04, 0.16], { rot: [0, 0, -40] }],
        ['ellipsoid', 'leaf', [0, 0.28, 0], [0.52, 0.48, 0.5]],
        ['ellipsoid', 'leaf', [-0.38, 0.08, 0.06], [0.34, 0.3, 0.32]],
        ['ellipsoid', 'leaf', [0.4, 0.1, -0.04], [0.36, 0.32, 0.34]],
        ['ellipsoid', 'light', [-0.14, 0.52, 0.22], [0.3, 0.26, 0.28]],
        ['ellipsoid', 'light', [0.26, 0.3, 0.3], [0.26, 0.24, 0.24]],
        ['ellipsoid', 'leaf', [0.02, 0.06, -0.3], [0.36, 0.3, 0.3]]
    ]
};
