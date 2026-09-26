export default {
    colors: {
        body: 'indigo',
        trim: 'lilac',
        lens: 'blue',
        glass: 'sky',
        accent: 'magenta'
    },
    parts: [
        ['box', 'body', [0, 0, 0], [0.8, 0.44, 0.26]],
        ['box', 'body', [-0.6, -0.02, 0.12], [0.2, 0.42, 0.24]],
        ['box', 'accent', [-0.6, 0.2, 0.36], [0.17, 0.04, 0.012]],
        ['cone', 'body', [0.08, 0.54, 0], [0.3, 0.2, 0.12]],
        ['cylinder', 'trim', [-0.56, 0.5, 0.06], [0.08, 0.06]],
        ['cylinder', 'trim', [0.55, 0.49, 0], [0.11, 0.05]],
        ['cylinder', 'lens', [0.08, -0.02, 0.44], [0.37, 0.2], { rot: [90, 0, 0] }],
        ['cylinder', 'trim', [0.08, -0.02, 0.58], [0.39, 0.035], { rot: [90, 0, 0] }],
        ['cylinder', 'lens', [0.08, -0.02, 0.66], [0.33, 0.04], { rot: [90, 0, 0], cap: 'glass' }]
    ]
};
