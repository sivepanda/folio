import adapter from '@sveltejs/adapter-vercel';

export default {
    kit: {
        adapter: adapter({
            images: {
                formats: ['image/avif', 'image/webp'],
                minimumCacheTTL: 300,
                domains: ['sivenpanda.com', 'folio-mauve.vercel.app'],

            }
        })
    }
}
