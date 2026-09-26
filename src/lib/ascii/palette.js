// Every object is coloured from these tones, which come from the old hero
// background: its blue (#0545c7), indigo (#3f20c6) and violet (#6405c6), plus
// the magenta its hue shift reached. Each is lightened enough to read as glyphs
// on the page's dark navy. Models name a tone instead of giving a hex value.
/** @type {Record<string, string>} */
export const TONES = {
    ink: '#30287a',
    indigo: '#5b3ff0',
    blue: '#2d63f0',
    sky: '#7ea6ff',
    violet: '#8b2fe6',
    lilac: '#c3b2ff',
    magenta: '#d02ab6',
    pink: '#ff72d9',
    mist: '#eeeaff'
};

// Flashed on wall hits, DVD style.
export const FLASH = ['sky', 'violet', 'magenta', 'pink', 'lilac'].map((t) => TONES[t]);
