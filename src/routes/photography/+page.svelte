<script>
    import Load from '../../components/Load.svelte';
    import Footer from '../../components/Footer.svelte';
    import MasonryGallery from '../../components/MasonryGallery.svelte';
    import SimplePhotography from '../../components/SimplePhotography.svelte';
    import galleryImages from '$lib/gallery-images.json';
    import { getContext } from 'svelte';

    const allImages = galleryImages;
    const viewMode = getContext('view-mode');
    let simpleMode = $derived(viewMode.simpleMode);
    let images = $state(allImages);
    const cameras = [...new Set(allImages.map((image) => image.camera))]
        .filter((camera) => camera !== 'Unknown')
        .sort();
    let selectedCamera = $state('all');

    /** @param {string} camera */
    function filterByCamera(camera) {
        selectedCamera = camera;
        if (camera === 'all') {
            images = allImages;
        } else {
            images = allImages.filter((image) => image.camera === camera);
        }
    }
</script>

{#if simpleMode}
    <SimplePhotography images={allImages} />
{:else}
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
{/if}

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
