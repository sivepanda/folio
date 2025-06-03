<script>
    import Load from '../../components/Load.svelte';
    import Header from '../../components/Header.svelte';
    import Footer from '../../components/Footer.svelte';
    import { Gallery } from 'flowbite-svelte';

    const images1 = [
        { src: '/images/imgfolio/DSC_3157.JPG' },
        { src: '/images/imgfolio/IMG_6097.jpg' },
        { src: '/images/imgfolio/IMG_6098.jpg' }
    ];

    const images2 = [
        { src: '/images/imgfolio/IMG_6186.png' },
        { src: '/images/imgfolio/DSC_7764_FIN.JPG' },
        { src: '/images/imgfolio/DSC_7782_FIN.png' }
    ];

    const images3 = [
        { src: '/images/imgfolio/IMG_6099.jpg' },
        { src: '/images/imgfolio/DSC_7777_FINAL.png' },
        { src: '/images/imgfolio/DSC_7778_FINAL.png' }
    ];
</script>

<Load />
<Header />

<div class="top sect">
    <h1>Photography</h1>

    <Gallery>
        <Gallery items={images1} />
        <Gallery items={images2} />
        <Gallery items={images3} />
    </Gallery>
</div>

<Footer />

<style>
    .top {
        margin-top: 10vh;
    }

    .top h1 {
        font-size: 5vh;
        text-align: center;
    }

    .sect {
        height: 100vh;
    }
</style>
