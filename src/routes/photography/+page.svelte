<script>
    import Load from '../../components/Load.svelte';
    import Header from '../../components/Header.svelte';
    import Footer from '../../components/Footer.svelte';
    import MasonryGallery from '../../components/MasonryGallery.svelte';

    const images = [
        { src: '/images/imgfolio/DSC_3157.JPG' },
        { src: '/images/imgfolio/IMG_6097.jpg' },
        { src: '/images/imgfolio/IMG_6098.jpg' },
        { src: '/images/imgfolio/IMG_6186.png' },
        { src: '/images/imgfolio/DSC_7764_FIN.JPG' },
        { src: '/images/imgfolio/DSC_7782_FIN.png' },
        { src: '/images/imgfolio/IMG_6099.jpg' },
        { src: '/images/imgfolio/DSC_7777_FINAL.png' },
        { src: '/images/imgfolio/DSC_7778_FINAL.png' }
    ];
</script>

<Load />
<Header />

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
