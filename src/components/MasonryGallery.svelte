<script>
    let { images = [], columns = 3, lightbox = false } = $props();

    let selectedImage = $state(null);

    function openLightbox(image) {
        if (lightbox) {
            selectedImage = image;
        }
    }

    function closeLightbox() {
        selectedImage = null;
    }
</script>

<div class="masonry" style="--columns: {columns};">
    {#each images as image}
        <img src={image.src} alt={image.alt} loading="lazy" onclick={() => openLightbox(image)} />
    {/each}
</div>

{#if selectedImage}
    <div class="lightbox-backdrop" onclick={closeLightbox}>
        <img src={selectedImage.src} alt={selectedImage.alt} />
    </div>
{/if}

<style>
    .masonry {
        column-count: var(--columns);
        column-gap: 12px;
    }

    .masonry img {
        width: 100%;
        height: auto;
        margin-bottom: 12px;
        display: block;
        border-radius: 4px;
        cursor: pointer;
        break-inside: avoid;
    }

    /* Lightbox styles */
    .lightbox-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
    }

    .lightbox-backdrop img {
        max-width: 90vw;
        max-height: 90vh;
        border-radius: 8px;
    }
</style>
