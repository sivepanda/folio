// How many objects the hero should show. Three independent limits, and the
// smallest one wins:
//   - hints: what the browser says about the connection and the device. Only
//     Chromium exposes these, so elsewhere this limit is just `total`.
//   - measured: how long the first models actually took to arrive. Works in
//     every browser, and a cached repeat visit comes back as fast.
//   - area: how many fit on screen without crowding the headline.
// The frame-time check in scene.js is a fourth limit, applied live.

/** @param {number} total */
export function hintBudget(total) {
    const nav = /** @type {any} */ (navigator);
    const conn = nav.connection;
    let n = total;
    if (conn?.saveData) return 1;
    if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') n = 2;
    else if (conn?.effectiveType === '3g') n = 4;
    else if (conn?.downlink && conn.downlink < 2) n = 6;

    const cores = nav.hardwareConcurrency || 8;
    const memory = nav.deviceMemory || 8;
    if (cores <= 2 || memory <= 1) n = Math.min(n, 3);
    else if (cores <= 4 || memory <= 2) n = Math.min(n, 6);
    return n;
}

/**
 * Each model is a tiny chunk, so the time for the first batch is mostly round
 * trip latency, which is also what every later model will cost.
 * @param {number} ms time to fetch the first batch in parallel
 * @param {number} total
 */
export function measuredBudget(ms, total) {
    if (ms < 300) return total;
    if (ms < 800) return 5;
    if (ms < 1600) return 3;
    return 2;
}

/**
 * Objects cover at most about a fifth of the space around the headline.
 * @param {number} area open area of the hero, px²
 * @param {number} radius object radius, px
 */
export function areaBudget(area, radius) {
    return Math.max(1, Math.floor((0.22 * area) / (Math.PI * radius * radius)));
}
