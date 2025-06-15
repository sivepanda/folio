<script lang="ts">
    interface Image {
        src: string;
        alt: string;
    }

    let { images = [], columns = 3, lightbox = true } = $props<{
        images?: Image[];
        columns?: number;
        lightbox?: boolean;
    }>();

    let selectedImage = $state<Image | null>(null);
    let isLightboxOpen = $state(false);

    function openLightbox(image: Image) {
        selectedImage = image;
        isLightboxOpen = true;
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        isLightboxOpen = false;
        document.body.style.overflow = '';
        setTimeout(() => {
            selectedImage = null;
        }, 300); // Wait for fade out animation
    }

    function handleContentClick(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

<div class="masonry" style="--columns: {columns};">
    {#each images as image}
        <img 
            src={image.src} 
            alt={image.alt} 
            loading="lazy" 
            on:click={() => openLightbox(image)}
            class="gallery-image"
        />
    {/each}
</div>

{#if selectedImage}
    <div class="lightbox-backdrop" class:open={isLightboxOpen} on:click={closeLightbox}>
        <div class="lightbox-content" on:click={handleContentClick}>
            <img src={selectedImage.src} alt={selectedImage.alt} />
        </div>
    </div>
{/if}

<style>
    .masonry {
        column-count: var(--columns);
        column-gap: 12px;
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

    /* Lightbox styles */
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
        transition: transform 0.3s ease;
    }

    .lightbox-backdrop.open .lightbox-content {
        transform: scale(1);
    }

    .lightbox-content img {
        max-width: 90vw;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
</style>
