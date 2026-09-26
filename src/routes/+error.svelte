<script>
    import { page } from '$app/state';
    import { getContext } from 'svelte';
    import { onMount } from 'svelte';
    import galleryImages from '$lib/gallery-images.json';
    import { optimize } from '$lib/image';

    const viewMode = getContext('view-mode');
    let simpleMode = $derived(viewMode.simpleMode);
    let isNotFound = $derived(page.status === 404);
    /** @type {(typeof galleryImages)[number] | null} */
    let backgroundImage = $state(null);

    onMount(() => {
        let currentShape = '';

        function chooseBackground() {
            if (!isNotFound) return;

            const viewportRatio = window.innerWidth / window.innerHeight;
            const shape = viewportRatio >= 1 ? 'wide' : 'tall';
            if (shape === currentShape && backgroundImage) return;

            currentShape = shape;
            const matchingImages = galleryImages
                .filter((image) =>
                    shape === 'wide' ? image.width >= image.height : image.height > image.width
                )
                .sort(
                    (a, b) =>
                        Math.abs(Math.log(a.width / a.height / viewportRatio)) -
                        Math.abs(Math.log(b.width / b.height / viewportRatio))
                );
            const closestMatches = matchingImages.slice(
                0,
                Math.max(3, Math.ceil(matchingImages.length * 0.25))
            );

            backgroundImage =
                closestMatches[Math.floor(Math.random() * closestMatches.length)] ?? null;
        }

        chooseBackground();
        window.addEventListener('resize', chooseBackground, { passive: true });

        return () => window.removeEventListener('resize', chooseBackground);
    });
</script>

<svelte:head>
    <title>{isNotFound ? 'You seem lost' : 'Something went wrong'} | Siven Panda</title>
    <meta
        name="description"
        content={isNotFound
            ? 'The page you were looking for could not be found.'
            : 'Something went wrong while loading this page.'}
    />
</svelte:head>

<main class:simple={simpleMode} class="error-page">
    {#if isNotFound && backgroundImage && !simpleMode}
        <img
            class="background-image"
            src={backgroundImage.src}
            srcset={optimize(backgroundImage.src)}
            sizes="100vw"
            width={backgroundImage.width}
            height={backgroundImage.height}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchpriority="high"
            decoding="async"
        />
    {/if}
    <div class="content">
        <h1>{isNotFound ? 'You seem lost.' : 'Something went wrong.'}</h1>
        <p>
            {isNotFound
                ? "That page isn't here, but there's plenty to find back home."
                : 'This page could not be loaded. Try heading back home.'}
        </p>
        <nav aria-label="Helpful links">
            <a href="/">Go home <span aria-hidden="true">↗</span></a>
            <a href="/photography">Browse photography <span aria-hidden="true">↗</span></a>
        </nav>
    </div>
    <p class="status" aria-hidden="true">{page.status}</p>
</main>

<style>
    :global(html:has(.error-page.simple)),
    :global(body:has(.error-page.simple)) {
        background: #f5f3ed;
    }

    .error-page {
        position: relative;
        isolation: isolate;
        min-height: 100vh;
        min-height: 100svh;
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 7rem clamp(1rem, 10vw, 10rem) 5rem;
        background: rgb(11, 11, 18);
        color: white;
    }

    .error-page::after {
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(90deg, rgba(8, 8, 14, 0.78), rgba(8, 8, 14, 0.28));
        content: '';
    }

    .background-image {
        position: absolute;
        inset: 0;
        z-index: -2;
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        filter: grayscale(1) saturate(0.25) brightness(0.48) contrast(1.08);
        animation: reveal-background 500ms ease-out both;
    }

    .content {
        position: relative;
        z-index: 1;
        width: min(52rem, 100%);
    }

    h1 {
        max-width: 9ch;
        margin: 0;
        font-size: clamp(4rem, 11vw, 9rem);
        font-weight: 700;
        letter-spacing: -0.05em;
        line-height: 0.86;
        text-wrap: balance;
    }

    .content > p {
        max-width: 34rem;
        margin: 2rem 0 2.4rem;
        font-size: clamp(1rem, 1.8vw, 1.25rem);
        font-weight: 300;
        line-height: 1.55;
    }

    nav {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 2rem;
    }

    a {
        color: inherit;
        font-weight: 550;
        text-decoration-line: underline;
        text-decoration-color: rgba(255, 255, 255, 0.45);
        text-decoration-thickness: 1px;
        text-underline-offset: 0.35em;
        transition:
            color 180ms ease,
            text-decoration-color 180ms ease;
    }

    a:hover {
        color: rgba(255, 255, 255, 0.72);
        text-decoration-color: currentColor;
    }

    a:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 5px;
    }

    a span {
        display: inline-block;
        margin-left: 0.2em;
        transition: transform 180ms ease;
    }

    a:hover span {
        transform: translate(0.15em, -0.15em);
    }

    .status {
        position: absolute;
        right: -0.04em;
        bottom: -0.25em;
        z-index: 0;
        margin: 0;
        color: rgba(255, 255, 255, 0.08);
        font-family: 'Mozilla Headline', serif;
        font-size: clamp(14rem, 38vw, 34rem);
        font-weight: 800;
        letter-spacing: -0.08em;
        line-height: 0.75;
        pointer-events: none;
        user-select: none;
    }

    .error-page.simple {
        align-items: flex-start;
        padding-top: clamp(7rem, 18vh, 12rem);
        background: #f5f3ed;
        color: #171511;
        animation: none;
    }

    .error-page.simple::after {
        display: none;
    }

    .simple .content {
        width: min(52rem, 100%);
        margin: 0 auto;
    }

    .simple h1 {
        font-size: clamp(3.5rem, 10vw, 7rem);
    }

    .simple a {
        text-decoration-color: rgba(23, 21, 17, 0.4);
    }

    .simple a:hover {
        color: #626158;
    }

    .simple .status {
        color: rgba(23, 21, 17, 0.055);
    }

    @keyframes reveal-background {
        from {
            opacity: 0;
            transform: scale(1.015);
        }

        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (max-width: 600px) {
        .error-page {
            align-items: flex-start;
            padding-top: 28vh;
        }

        .content > p {
            margin-block: 1.5rem 2rem;
        }

        nav {
            flex-direction: column;
            align-items: flex-start;
        }

        .status {
            right: -0.02em;
            bottom: -0.12em;
            font-size: 52vw;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .error-page {
            animation: none;
        }

        .background-image {
            animation: none;
        }

        a,
        a span {
            transition: none;
        }
    }
</style>
