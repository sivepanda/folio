<script>
    import Load from '../../components/Load.svelte';
    import Header from '../../components/Header.svelte';
    import Footer from '../../components/Footer.svelte';
    import MasonryGallery from '../../components/MasonryGallery.svelte';
    import exifr from 'exifr';
    import { onMount } from 'svelte';

    // Dynamically import all images from the imgfolio directory
    const imageModules = import.meta.glob(
        '/static/images/imgfolio/*.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)',
        { eager: true, as: 'url' }
    );

    let images = $state([]);
    let allImages = [];
    let cameras = $state([]);
    let selectedCamera = $state('all');

    onMount(async () => {
        const imagePromises = Object.entries(imageModules).map(async ([path, url]) => {
            const filename =
                path
                    .split('/')
                    .pop()
                    ?.replace(/\.[^/.]+$/, '') || '';
            const publicPath = path.replace('/static', '');

            let camera = 'Unknown';
            try {
                const exifData = await exifr.parse(publicPath, ['Make', 'Model']);
                if (exifData?.Make && exifData?.Model) {
                    camera = `${exifData.Model}`;
                } else if (exifData?.Model) {
                    camera = exifData.Model;
                }
            } catch (e) {
                console.log(`No EXIF data for ${filename}`);
            }

            return {
                src: publicPath,
                alt: filename.replace(/[_-]/g, ' '),
                camera: camera
            };
        });

        allImages = await Promise.all(imagePromises);
        images = allImages;

        // Extract unique cameras, excluding 'Unknown'
        const uniqueCameras = [...new Set(allImages.map(img => img.camera))]
            .filter(camera => camera !== 'Unknown')
            .sort();
        cameras = uniqueCameras;
    });

    function filterByCamera(camera) {
        selectedCamera = camera;
        if (camera === 'all') {
            images = allImages;
        } else {
            images = allImages.filter(img => img.camera === camera);
        }
    }
</script>

<Load />
<div class="top sect">
    <h1>Photography</h1>

    {#if cameras.length > 0}
        <div class="filter-buttons">
            <button
                class="filter-btn"
                class:active={selectedCamera === 'all'}
                onclick={() => filterByCamera('all')}
            >
                All
            </button>
            {#each cameras as camera}
                <button
                    class="filter-btn"
                    class:active={selectedCamera === camera}
                    onclick={() => filterByCamera(camera)}
                >
                    {camera}
                </button>
            {/each}
        </div>
    {/if}

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

    .filter-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin: 3vh 5vw;
    }

    .filter-btn {
        padding: 8px 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        backdrop-filter: blur(10px);
    }

    .filter-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .filter-btn.active {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
    }
</style>
