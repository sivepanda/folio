<script>
    import Load from '../../components/Load.svelte';
    import Header from '../../components/Header.svelte';
    import Footer from '../../components/Footer.svelte';
    import MasonryGallery from '../../components/MasonryGallery.svelte';

    // Dynamically import all images from the imgfolio directory
    const imageModules = import.meta.glob(
        '/static/images/imgfolio/*.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)',
        { eager: true, as: 'url' }
    );

    const images = Object.entries(imageModules).map(([path, url]) => {
        // Extract filename from path for alt text
        const filename =
            path
                .split('/')
                .pop()
                ?.replace(/\.[^/.]+$/, '') || '';
        // Convert static path to public URL
        const publicPath = path.replace('/static', '');

        return {
            src: publicPath,
            alt: filename.replace(/[_-]/g, ' ') // Convert underscores/dashes to spaces for cleaner alt text
        };
    });
</script>

<Load />
<div class="top sect">
    <h1>Photography</h1>

    <div class="im sect">
        <MasonryGallery {images} />
    </div>
</div>

<Footer />

<style>
    .im {
        width: 90vw;
        padding-left: 5vw;
    }

    .top {
        margin-top: 10vh;
    }

    .top h1 {
        font-size: 5vh;
        text-align: center;
    }

    .sect {
        min-height: 100vh;
        padding-bottom: 5vh;
    }
</style>
