// A Pebble Classic: chunky body, e-paper face with hands, four side buttons and
// straps curving away behind the wrist.
export default {
    colors: {
        body: 'blue',
        bezel: 'ink',
        screen: 'lilac',
        hand: 'ink',
        button: 'mist',
        strap: 'violet'
    },
    parts: [
        ['box', 'body', [0, 0, 0], [0.42, 0.52, 0.13]],
        ['box', 'bezel', [0, 0.03, 0.135], [0.35, 0.41, 0.01]],
        ['box', 'screen', [0, 0.05, 0.145], [0.28, 0.3, 0.008]],
        ['box', 'hand', [0, 0.16, 0.155], [0.022, 0.11, 0.006]],
        ['box', 'hand', [0.07, 0.05, 0.155], [0.075, 0.022, 0.006]],
        ['box', 'button', [-0.44, 0.12, 0], [0.03, 0.09, 0.05]],
        ['box', 'button', [0.44, 0.26, 0], [0.03, 0.07, 0.05]],
        ['box', 'button', [0.44, 0.03, 0], [0.03, 0.07, 0.05]],
        ['box', 'button', [0.44, -0.2, 0], [0.03, 0.07, 0.05]],
        ['box', 'strap', [0, 0.84, -0.09], [0.3, 0.34, 0.05], { rot: [-22, 0, 0] }],
        ['box', 'strap', [0, -0.84, -0.09], [0.3, 0.34, 0.05], { rot: [22, 0, 0] }]
    ]
};
