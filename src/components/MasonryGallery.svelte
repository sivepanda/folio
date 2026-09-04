<script lang="ts">
    import { optimize } from '$lib/image';
    import { onDestroy } from 'svelte';

    interface Image {
        src: string;
        alt: string;
        width: number;
        height: number;
    }

    let {
        images = [],
        columns = 3,
        lightbox = true
    } = $props<{
        images?: Image[];
        columns?: number;
        lightbox?: boolean;
    }>();

    let selectedImage = $state<Image | null>(null);
    let isLightboxOpen = $state(false);
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let previousBodyOverflow = '';
    const preloadedImages = new Map<string, HTMLImageElement>();

    function preloadFullSize(image: Image) {
        if (!lightbox || preloadedImages.has(image.src)) return;

        const preload = new window.Image();
        preload.src = image.src;
        preloadedImages.set(image.src, preload);
    }

    function openLightbox(image: Image) {
        selectedImage = image;
        isLightboxOpen = true;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        isLightboxOpen = false;
        document.body.style.overflow = previousBodyOverflow;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            selectedImage = null;
        }, 300); // Wait for fade out animation
    }

    function handleContentClick(event: MouseEvent) {
        event.stopPropagation();
    }

    onDestroy(() => {
        clearTimeout(closeTimer);
        if (selectedImage) document.body.style.overflow = previousBodyOverflow;
    });
</script>

<div class="masonry" style="--columns: {columns};">
    {#each images as image, index}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <img
            srcset={optimize(image.src)}
            sizes="(max-width: 480px) 90vw, (max-width: 768px) 45vw, 30vw"
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchpriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
            tabindex="0"
            onmouseenter={() => preloadFullSize(image)}
            onfocus={() => preloadFullSize(image)}
            onclick={() => openLightbox(image)}
            onkeydown={(e) => e.key === 'Enter' && openLightbox(image)}
            class="gallery-image"
        />
    {/each}
</div>

{#if selectedImage}
    <div class="lightbox-backdrop" class:open={isLightboxOpen} onclick={closeLightbox}>
        <div class="lightbox-content" onclick={handleContentClick}>
            <img
                src={selectedImage.src}
                width={selectedImage.width}
                height={selectedImage.height}
                alt={selectedImage.alt}
            />
        </div>
    </div>
{/if}

<style>
    .masonry {
        column-count: var(--columns);
        column-gap: 12px;
    }

    @media (max-width: 768px) {
        .masonry {
            column-count: 2;
            column-gap: 10px;
        }

        .gallery-image {
            margin-bottom: 10px;
        }
    }

    @media (max-width: 480px) {
        .masonry {
            column-count: 1;
            column-gap: 8px;
        }

        .gallery-image {
            margin-bottom: 8px;
        }
    }

    .gallery-image {
        width: 100%;
        height: auto;
        margin-bottom: 12px;
        display: block;
        border-radius: 4px;
        cursor: pointer;
        break-inside: avoid;
        transition: transform 0.3s ease;
    }

    .gallery-image:hover {
        transform: scale(1.02);
    }

    .lightbox-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .lightbox-backdrop.open {
        opacity: 1;
    }

    .lightbox-content {
        transform: scale(0.9);
        padding-top: 5vh;
        transition: transform 0.3s ease;
    }

    .lightbox-backdrop.open .lightbox-content {
        transform: scale(1);
    }

    .lightbox-content img {
        width: auto;
        height: auto;
        max-width: 90vw;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
</style>
