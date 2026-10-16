// A padlock, for P2Poker's signed, cheat-proof turns.
export default {
    colors: {
        body: 'blue',
        shackle: 'lilac',
        keyhole: 'ink'
    },
    parts: [
        ['box', 'body', [0, -0.3, 0], [0.55, 0.42, 0.2]],
        ['torus', 'shackle', [0, 0.2, 0], [0.34, 0.08], { arc: [0, 180] }],
        ['cylinder', 'shackle', [-0.34, 0.12, 0], [0.08, 0.1]],
        ['cylinder', 'shackle', [0.34, 0.12, 0], [0.08, 0.1]],
        ['cylinder', 'keyhole', [0, -0.22, 0.2], [0.085, 0.015], { rot: [90, 0, 0] }],
        ['box', 'keyhole', [0, -0.37, 0.2], [0.035, 0.11, 0.015]]
    ]
};
