import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { galleryDirectory, generateGalleryManifest } from './scripts/generate-gallery-manifest.js';

/** @type {import('vite').Plugin} */
const galleryManifest = {
    name: 'gallery-manifest',
    async buildStart() {
        await generateGalleryManifest();
    },
    configureServer(server) {
        server.watcher.add(galleryDirectory);
        server.watcher.on('all', async (_event, changedPath) => {
            if (!changedPath.startsWith(galleryDirectory)) return;
            try {
                await generateGalleryManifest();
            } catch (error) {
                server.config.logger.error(`Could not update gallery manifest: ${error}`);
            }
        });
    }
};

export default defineConfig({
    plugins: [galleryManifest, sveltekit()]
});
