// Every object is coloured from these tones, anchored on a deep, saturated
// indigo (#1300a6) with blues and violets around it, plus magenta and pink
// accents and one pale tone for whites. Models name a tone instead of a hex value.
/** @type {Record<string, string>} */
export const TONES = {
    ink: '#0c0566',
    indigo: '#1300a6',
    blue: '#1d35e8',
    sky: '#4c6dff',
    violet: '#4b0fd1',
    lilac: '#8a6bff',
    magenta: '#b0189f',
    pink: '#e2389f',
    mist: '#d6d0ff'
};

// Flashed on wall hits, DVD style.
export const FLASH = ['sky', 'violet', 'magenta', 'pink', 'lilac'].map((t) => TONES[t]);
