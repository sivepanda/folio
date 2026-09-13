<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';
    import galleryImages from '$lib/gallery-images.json';

    let background = $state('');

    onMount(() => {
        const image = galleryImages[Math.floor(Math.random() * galleryImages.length)];
        background = dev
            ? image.src
            : `/_vercel/image?url=${encodeURIComponent(image.src)}&w=640&q=35`;
    });
</script>

<svelte:head>
    <title>404 | Page not found</title>
</svelte:head>

<main class="not-found">
    {#if background}
        <img src={background} alt="" aria-hidden="true" />
    {/if}

    <div class="message">
        <h1>404</h1>
        <p>you look a little lost...</p>
        <nav aria-label="Continue browsing">
            <a href="/">home</a>
            <a href="/photography">photography</a>
        </nav>
    </div>
</main>

<style>
    :global(html:has(.not-found)),
    :global(body:has(.not-found)) {
        margin: 0;
        overflow: hidden;
        background: #111;
    }

    .not-found {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        min-height: 100svh;
        isolation: isolate;
        color: white;
        background: #111;
    }

    .not-found::after {
        position: absolute;
        inset: 0;
        z-index: -1;
        content: '';
        background: rgb(0 0 0 / 32%);
    }

    img {
        position: absolute;
        inset: -24px;
        z-index: -2;
        width: calc(100% + 48px);
        height: calc(100% + 48px);
        object-fit: cover;
        filter: blur(18px);
        transform: scale(1.03);
    }

    .message {
        text-align: center;
        text-shadow: 0 2px 24px rgb(0 0 0 / 55%);
    }

    h1,
    p {
        margin: 0;
        font-family: 'Mozilla Headline', sans-serif;
        line-height: 1;
    }

    h1 {
        font-size: clamp(6rem, 20vw, 13rem);
        font-weight: 700;
        letter-spacing: -0.06em;
    }

    p {
        margin-top: 0.75rem;
        font-size: clamp(1rem, 2.5vw, 1.4rem);
        font-weight: 400;
    }

    nav {
        display: flex;
        justify-content: center;
        gap: 1.25rem;
        margin-top: 1.75rem;
    }

    a {
        color: inherit;
        font-family: 'Mozilla Text', sans-serif;
        font-size: 0.9rem;
        text-decoration-color: rgb(255 255 255 / 55%);
        text-underline-offset: 0.3em;
        transition: text-decoration-color 150ms ease;
    }

    a:hover,
    a:focus-visible {
        text-decoration-color: currentColor;
    }
</style>
