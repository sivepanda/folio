import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import { imageSizeFromFile } from 'image-size/fromFile';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const galleryDirectory = path.join(root, 'static/images/imgfolio');
const manifestPath = path.join(root, 'src/lib/gallery-images.json');
const supportedImage = /\.(?:gif|jpe?g|png|webp)$/i;
/** @type {Record<string, string>} */
const cameraNames = {
    'X-T5': 'FUJIFILM X-T5'
};

export async function generateGalleryManifest() {
    const filenames = (await fs.readdir(galleryDirectory))
        .filter((filename) => supportedImage.test(filename))
        .sort((a, b) => a.localeCompare(b));

    const images = await Promise.all(
        filenames.map(async (filename) => {
            const filePath = path.join(galleryDirectory, filename);
            const [metadata, dimensions] = await Promise.all([
                exifr.parse(filePath, ['Model']).catch(() => undefined),
                imageSizeFromFile(filePath)
            ]);

            if (!dimensions.width || !dimensions.height) {
                throw new Error(`Could not determine dimensions for ${filename}`);
            }

            return {
                src: `/images/imgfolio/${encodeURIComponent(filename)}`,
                alt: filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                camera: cameraNames[metadata?.Model] || metadata?.Model || 'Unknown',
                width: dimensions.width,
                height: dimensions.height
            };
        })
    );

    const manifest = `${JSON.stringify(images, null, 4)}\n`;
    const currentManifest = await fs.readFile(manifestPath, 'utf8').catch(() => '');
    if (manifest !== currentManifest) await fs.writeFile(manifestPath, manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await generateGalleryManifest();
}
