import adapter from '@sveltejs/adapter-vercel';

export default {
    kit: {
        adapter: adapter({
            images: {
                sizes: [640, 828, 1200, 1920, 3840],
                formats: ['image/avif', 'image/webp'],
                minimumCacheTTL: 300,
                domains: ['sivenpanda.com', 'folio-mauve.vercel.app'],

            }
        })
    }
}
