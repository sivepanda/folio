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
    /** @type {Record<string, string>} */
    const cameraIcons = {
        'NIKON D50': '/cams/d50.svg',
        'X-T5': '/cams/xt5.svg',
        'iPhone 16 Pro': '/cams/16pro.svg'
    };
    let selectedCamera = $state('all');
    let selectedCameraIndex = $derived(
        selectedCamera === 'all' ? 0 : cameras.indexOf(selectedCamera) + 1
    );

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
            <div class="camera-selector" style:--selected-index={selectedCameraIndex}>
                <button
                    type="button"
                    class="camera-option all-option"
                    class:active={selectedCamera === 'all'}
                    aria-pressed={selectedCamera === 'all'}
                    onclick={() => filterByCamera('all')}
                >
                    <span>All</span>
                </button>
                {#each cameras as camera}
                    <button
                        type="button"
                        class="camera-option"
                        class:active={selectedCamera === camera}
                        aria-pressed={selectedCamera === camera}
                        onclick={() => filterByCamera(camera)}
                    >
                        {#if cameraIcons[camera]}
                            <img
                                src={cameraIcons[camera]}
                                alt=""
                                width="112"
                                height="76"
                                decoding="async"
                            />
                        {/if}
                        <span>{camera}</span>
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
        width: 100%;
        min-height: 0;
        padding: 0;
    }

    .top {
        width: 100%;
        margin-top: 60px;
        padding: clamp(1.5rem, 5vw, 4rem) clamp(1rem, 5vw, 5rem) 5vh;
    }

    .top h1 {
        font-size: 5vh;
        text-align: center;
    }

    .sect {
        min-height: 100vh;
        padding-bottom: 5vh;
    }

    .camera-selector {
        position: relative;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        width: min(700px, 100%);
        margin: 4vh auto 6vh;
    }

    .camera-selector::after {
        position: absolute;
        bottom: 8px;
        left: 7.5%;
        width: 10%;
        height: 1px;
        background: white;
        content: '';
        transform: translateX(calc(var(--selected-index) * 250%));
        transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .camera-option {
        position: relative;
        display: grid;
        grid-template-rows: 76px auto;
        place-items: center;
        gap: 12px;
        min-width: 0;
        padding: 20px 12px 17px;
        border: 0;
        background: transparent;
        color: rgba(255, 255, 255, 0.55);
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
        transition: color 180ms ease;
    }

    .camera-option img {
        width: min(112px, 100%);
        height: 76px;
        object-fit: contain;
        opacity: 0.6;
        transform: translateY(2px) rotate(0deg) scale(0.96);
        transition:
            opacity 180ms ease,
            transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .camera-option:hover,
    .camera-option:focus-visible {
        color: rgba(255, 255, 255, 0.9);
    }

    .camera-option.active img {
        opacity: 1;
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
        transform: translateY(-4px) rotate(0deg) scale(1.03);
    }

    .camera-option:hover img,
    .camera-option:focus-visible img {
        opacity: 1;
        filter: drop-shadow(0 9px 8px rgba(0, 0, 0, 0.25));
        transform: translateY(-6px) rotate(-2deg) scale(1.02);
    }

    .camera-option:nth-child(even):hover img,
    .camera-option:nth-child(even):focus-visible img {
        transform: translateY(-6px) rotate(2deg) scale(1.02);
    }

    .camera-option.active:hover img,
    .camera-option.active:focus-visible img {
        filter: drop-shadow(0 10px 9px rgba(0, 0, 0, 0.28))
            drop-shadow(0 0 10px rgba(255, 255, 255, 0.28));
        transform: translateY(-10px) rotate(-2deg) scale(1.05);
    }

    .camera-option.active:nth-child(even):hover img,
    .camera-option.active:nth-child(even):focus-visible img {
        transform: translateY(-10px) rotate(2deg) scale(1.05);
    }

    .camera-option:focus-visible {
        outline: 1px solid rgba(255, 255, 255, 0.65);
        outline-offset: -3px;
    }

    .camera-option.active {
        color: white;
    }

    .all-option {
        display: grid;
        grid-template-rows: 1fr;
        font-size: 0.9rem;
    }

    @media (max-width: 620px) {
        .top h1 {
            margin: 0;
            font-size: clamp(2rem, 10vw, 2.75rem);
        }

        .camera-selector {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.35rem;
            margin: 1.5rem auto 2.5rem;
        }

        .camera-selector::after {
            display: none;
        }

        .camera-option {
            gap: 8px;
            min-height: 7.25rem;
            padding: 0.75rem 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 0.75rem;
            background: rgba(255, 255, 255, 0.035);
            font-size: 0.75rem;
        }

        .camera-option.active {
            border-color: rgba(255, 255, 255, 0.45);
            background: rgba(255, 255, 255, 0.1);
        }

        .camera-option img {
            height: 62px;
        }

        .all-option {
            min-height: 7.25rem;
        }
    }

    @media (max-width: 380px) {
        .top {
            padding-inline: 0.75rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .camera-selector::after,
        .camera-option,
        .camera-option img {
            transition: none;
        }
    }
</style>
