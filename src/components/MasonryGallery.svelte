<script lang="ts">
    import { optimize } from '$lib/image';
    import { createTimeline, utils } from 'animejs';
    import { onDestroy, tick } from 'svelte';

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
    let lightboxOrigin = $state({ x: 0, y: 0, scale: 0.9 });
    let previousBodyOverflow = '';
    let selectedThumbnail: HTMLImageElement | null = null;
    let lightboxBackdrop = $state<HTMLDivElement | null>(null);
    let lightboxContent = $state<HTMLDivElement | null>(null);
    let lightboxAnimation: ReturnType<typeof createTimeline> | null = null;
    let animationVersion = 0;
    const preloadedImages = new Map<string, HTMLImageElement>();

    function preloadFullSize(image: Image) {
        if (!lightbox || preloadedImages.has(image.src)) return;

        const preload = new window.Image();
        preload.src = image.src;
        preloadedImages.set(image.src, preload);
    }

    function getLightboxOrigin(image: Image, thumbnail: HTMLImageElement) {
        const rect = thumbnail.getBoundingClientRect();
        const availableWidth = window.innerWidth - 32;
        const availableHeight = window.innerHeight - 32;
        const fitScale = Math.min(1, availableWidth / image.width, availableHeight / image.height);
        const lightboxWidth = image.width * fitScale;

        return {
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top + rect.height / 2 - window.innerHeight / 2,
            scale: Math.max(0.08, rect.width / lightboxWidth)
        };
    }

    async function openLightbox(image: Image, thumbnail: HTMLImageElement) {
        if (selectedImage) return;

        const version = ++animationVersion;
        selectedThumbnail = thumbnail;
        lightboxOrigin = getLightboxOrigin(image, thumbnail);
        selectedImage = image;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        await tick();
        if (version !== animationVersion || !lightboxBackdrop || !lightboxContent) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            utils.set(lightboxBackdrop, {
                opacity: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.64)',
                backdropFilter: 'blur(12px)'
            });
            utils.set(lightboxContent, { opacity: 1, translateX: 0, translateY: 0, scale: 1 });
            return;
        }

        lightboxAnimation = createTimeline({ autoplay: false })
            .add(
                lightboxBackdrop,
                {
                    opacity: [0, 1],
                    backgroundColor: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.64)'],
                    backdropFilter: ['blur(0px)', 'blur(12px)'],
                    duration: 360,
                    ease: 'outCubic'
                },
                0
            )
            .add(
                lightboxContent,
                {
                    opacity: [0.72, 1],
                    translateX: [lightboxOrigin.x, 0],
                    translateY: [lightboxOrigin.y, 0],
                    scale: [lightboxOrigin.scale, 1],
                    duration: 440,
                    ease: 'outExpo'
                },
                0
            );
        lightboxAnimation.play();
    }

    function closeLightbox() {
        if (!selectedImage) return;

        if (selectedThumbnail?.isConnected) {
            lightboxOrigin = getLightboxOrigin(selectedImage, selectedThumbnail);
        }
        document.body.style.overflow = previousBodyOverflow;
        const version = ++animationVersion;
        const finish = () => {
            if (version !== animationVersion) return;
            selectedImage = null;
            selectedThumbnail = null;
            lightboxBackdrop = null;
            lightboxContent = null;
            lightboxAnimation = null;
        };

        lightboxAnimation?.pause();
        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !lightboxBackdrop ||
            !lightboxContent
        ) {
            finish();
            return;
        }

        lightboxAnimation = createTimeline({ autoplay: false })
            .add(
                lightboxBackdrop,
                {
                    opacity: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    backdropFilter: 'blur(0px)',
                    duration: 300,
                    ease: 'inCubic'
                },
                0
            )
            .add(
                lightboxContent,
                {
                    opacity: 0.72,
                    translateX: lightboxOrigin.x,
                    translateY: lightboxOrigin.y,
                    scale: lightboxOrigin.scale,
                    duration: 380,
                    ease: 'inOutCubic'
                },
                0
            );
        lightboxAnimation.play();
        lightboxAnimation.then(finish);
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) closeLightbox();
    }

    function handlePointerDown(event: PointerEvent) {
        const image = event.currentTarget as HTMLImageElement;
        const rect = image.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        image.style.setProperty('--press-rotate-x', `${y * -2.5}deg`);
        image.style.setProperty('--press-rotate-y', `${x * 2.5}deg`);
    }

    function handleKeydown(event: KeyboardEvent, image: Image) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLightbox(image, event.currentTarget as HTMLImageElement);
        }
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && selectedImage) closeLightbox();
    }

    onDestroy(() => {
        animationVersion += 1;
        lightboxAnimation?.pause();
        if (selectedImage) document.body.style.overflow = previousBodyOverflow;
    });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

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
            onpointerdown={handlePointerDown}
            onclick={(event) => openLightbox(image, event.currentTarget)}
            onkeydown={(event) => handleKeydown(event, image)}
            class="gallery-image"
            class:selected={selectedImage === image}
        />
    {/each}
</div>

{#if selectedImage}
    <div
        bind:this={lightboxBackdrop}
        class="lightbox-backdrop"
        role="presentation"
        onclick={handleBackdropClick}
    >
        <div
            bind:this={lightboxContent}
            class="lightbox-content"
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            aria-label={selectedImage.alt || 'Expanded photograph'}
            style:--from-x={`${lightboxOrigin.x}px`}
            style:--from-y={`${lightboxOrigin.y}px`}
            style:--from-scale={lightboxOrigin.scale}
        >
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
        transform: perspective(900px) translateZ(0) scale(1);
        transform-style: preserve-3d;
        transition:
            transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 220ms ease,
            opacity 120ms ease;
        will-change: transform;
    }

    .gallery-image:hover {
        transform: perspective(900px) translateZ(8px) scale(1.018);
    }

    .gallery-image:active {
        filter: brightness(0.92) saturate(1.05);
        transform: perspective(900px) translateZ(-5px) scale(0.975)
            rotateX(var(--press-rotate-x, 0deg)) rotateY(var(--press-rotate-y, 0deg));
        transition-duration: 85ms;
    }

    .gallery-image.selected {
        opacity: 0;
    }

    .lightbox-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
    }

    .lightbox-content {
        opacity: 0.72;
        transform: translate3d(var(--from-x), var(--from-y), 0) scale(var(--from-scale));
        transform-origin: center;
        will-change: transform, opacity;
    }

    .lightbox-content img {
        width: auto;
        height: auto;
        max-width: calc(100vw - 2rem);
        max-height: calc(100dvh - 2rem);
        border-radius: 8px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.48);
    }

    @media (prefers-reduced-motion: reduce) {
        .gallery-image {
            transition: none;
        }

        .gallery-image:hover,
        .gallery-image:active {
            transform: none;
        }
    }
</style>
