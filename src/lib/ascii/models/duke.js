// The Duke athletics "D", traced from the logo on Wikipedia: an I-beam stem with
// angled serifs and a separate bowl, with the counter as the gap between them.
const BOWL = [
    [0.113, 0.89],
    [0.363, 0.475],
    [0.363, -0.475],
    [0.113, -0.89],
    [0.648, -0.89],
    [0.717, -0.881],
    [0.774, -0.863],
    [0.83, -0.834],
    [0.876, -0.799],
    [0.938, -0.728],
    [0.972, -0.664],
    [0.988, -0.616],
    [1, -0.534],
    [1, 0.526],
    [0.984, 0.623],
    [0.946, 0.71],
    [0.901, 0.771],
    [0.847, 0.82],
    [0.779, 0.86],
    [0.716, 0.881],
    [0.647, 0.89]
];
const STEM = [
    [-0.999, 0.889],
    [-0.75, 0.477],
    [-0.75, -0.476],
    [-0.999, -0.889],
    [0.057, -0.889],
    [-0.192, -0.477],
    [-0.192, 0.478],
    [0.057, 0.89]
];

export default {
    colors: {
        face: 'blue',
        side: 'indigo'
    },
    parts: [['extrude', 'side', [0, 0, 0], [0.16], { rings: [BOWL, STEM], cap: 'face' }]]
};
