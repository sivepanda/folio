// Builds the link-preview cards (iMessage, Slack, Discord, X, ...) from the photo gallery:
// each photo is cropped to 1200x630, dimmed, and stamped with the SP logo.
//
// Run with `bun run og` after adding or removing gallery photos, then commit
// static/og/ and src/lib/og-cards.json. This needs ImageMagick (`magick`) locally,
// which the Vercel build image does not have, so it is not part of `vite build`.

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { galleryDirectory } from './generate-gallery-manifest.js';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'static/og');
const listPath = path.join(root, 'src/lib/og-cards.json');
const logoPath = path.join(root, 'static/favicon.png');
const supportedImage = /\.(?:jpe?g|png|webp)$/i;

const WIDTH = 1200;
const HEIGHT = 630;
// Crop a little past "cover" so the corner watermarks fall outside the card.
const ZOOM = 1.12;
const LOGO_WIDTH = 440;

// Photos that don't survive a wide center crop. Add filenames here to skip them.
const exclude = new Set([]);

/** @param {string} filename */
function cardName(filename) {
    return `${filename
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.jpg`;
}

/**
 * @param {string} source
 * @param {string} destination
 */
async function renderCard(source, destination) {
    const cover = `${Math.round(WIDTH * ZOOM)}x${Math.round(HEIGHT * ZOOM)}^`;
    const size = `${WIDTH}x${HEIGHT}`;

    await run('magick', [
        source,
        '-auto-orient',
        '-resize',
        cover,
        '-gravity',
        'center',
        '-extent',
        size,
        // Light overall dim, plus a soft dark spot behind the logo so it reads on bright photos.
        '-fill',
        'black',
        '-colorize',
        '22',
        '(',
        '-size',
        size,
        'radial-gradient:rgba(0,0,0,0.55)-rgba(0,0,0,0)',
        ')',
        '-compose',
        'over',
        '-composite',
        '(',
        logoPath,
        '-resize',
        `${LOGO_WIDTH}x`,
        '(',
        '+clone',
        '-background',
        'black',
        '-shadow',
        '70x18+0+6',
        ')',
        '+swap',
        '-background',
        'none',
        '-layers',
        'merge',
        '+repage',
        ')',
        '-gravity',
        'center',
        '-composite',
        // -strip also drops EXIF, including GPS.
        '-strip',
        '-interlace',
        'JPEG',
        '-quality',
        '80',
        destination
    ]);
}

async function generateOgCards() {
    const filenames = (await fs.readdir(galleryDirectory))
        .filter((filename) => supportedImage.test(filename) && !exclude.has(filename))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    await fs.mkdir(outputDirectory, { recursive: true });

    const cards = [];
    for (const filename of filenames) {
        const card = cardName(filename);
        await renderCard(path.join(galleryDirectory, filename), path.join(outputDirectory, card));
        cards.push(card);
        console.log(`og: ${filename} -> static/og/${card}`);
    }

    const keep = new Set(cards);
    for (const stale of await fs.readdir(outputDirectory)) {
        if (!keep.has(stale)) await fs.rm(path.join(outputDirectory, stale));
    }

    await fs.writeFile(listPath, `${JSON.stringify(cards, null, 4)}\n`);
    console.log(`og: wrote ${cards.length} cards`);
}

await generateOgCards();
