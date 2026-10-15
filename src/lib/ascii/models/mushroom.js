const cap = [0.75, 0.42, 0.75];
/**
 * A spot sitting on the cap surface at the given elevation and azimuth (degrees).
 * @param {number} el
 * @param {number} az
 */
const spot = (el, az, r = 0.1) => {
    const [e, a] = [(el * Math.PI) / 180, (az * Math.PI) / 180];
    return [
        'ellipsoid',
        'spot',
        [
            cap[0] * Math.cos(e) * Math.cos(a),
            0.25 + cap[1] * Math.sin(e),
            cap[2] * Math.cos(e) * Math.sin(a)
        ],
        [r, r * 0.7, r]
    ];
};

export default {
    colors: {
        cap: 'magenta',
        spot: 'mist',
        gill: 'pink',
        stem: 'lilac'
    },
    parts: [
        ['ellipsoid', 'cap', [0, 0.25, 0], cap],
        ['ellipsoid', 'gill', [0, 0.18, 0], [0.71, 0.4, 0.71]],
        ['cone', 'stem', [0, -0.45, 0], [0.3, 0.22, 0.35]],
        ['torus', 'stem', [0, -0.22, 0], [0.24, 0.04], { rot: [90, 0, 0] }],
        spot(85, 0, 0.13),
        spot(45, 90),
        spot(45, 210),
        spot(45, 330),
        spot(15, 30, 0.08),
        spot(15, 150, 0.08),
        spot(15, 270, 0.08)
    ]
};
