<script>
    import { optimize } from '$lib/image';
    import { resumeContent } from '$lib/resume-content.js';

    let { images = [] } = $props();
</script>

<svelte:head>
    <meta
        name="description"
        content={`A simple collection of photographs by ${resumeContent.name}.`}
    />
</svelte:head>

<div class="simple-page">
    <a class="skip-link" href="#photographs">Skip to photographs</a>

    <header class="site-header">
        <a class="wordmark" href="/">{resumeContent.name}</a>
        <nav aria-label="Primary navigation">
            <a href="/">Home</a>
            <a href="#photographs" aria-current="page">Photography</a>
        </nav>
    </header>

    <main>
        <section class="intro" aria-labelledby="page-title">
            <h1 id="page-title">Photography</h1>
            <p class="summary">{images.length} photographs</p>
        </section>

        <section class="photographs" id="photographs" aria-label="Photographs">
            {#each images as image, index}
                <figure>
                    <img
                        src={image.src}
                        srcset={optimize(image.src)}
                        sizes="(max-width: 700px) calc(100vw - 2rem), 34rem"
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchpriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                    />
                    <figcaption>
                        {#if image.camera !== 'Unknown'}
                            <span>{image.camera}</span>
                        {/if}
                    </figcaption>
                </figure>
            {/each}
        </section>
    </main>

    <footer>
        <p>{resumeContent.name}</p>
        <a href="#photographs">Back to top</a>
    </footer>
</div>

<style>
    :global(html:has(.simple-page)) {
        scroll-behavior: auto;
        background: #f5f3ed;
    }

    :global(body:has(.simple-page)) {
        background: #f5f3ed;
        color: #171511;
    }

    :global(.simple-page),
    :global(.simple-page *) {
        animation: none !important;
        transition: none !important;
    }

    .simple-page {
        --border: #cbc8be;
        --muted: #626158;
        min-height: 100vh;
        background: #f5f3ed;
        color: #171511;
        font-family: 'Mozilla Text', sans-serif;
        font-size: 1rem;
        line-height: 1.65;
    }

    .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 2;
        padding: 0.45rem 0.7rem;
        background: #181816;
        color: #fff;
        transform: translateY(-200%);
    }

    .skip-link:focus {
        transform: none;
    }

    .site-header {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
        padding: 1.2rem 0;
        border-bottom: 1px solid var(--border);
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 2rem;
    }

    .wordmark {
        color: inherit;
        font-weight: 700;
        text-decoration: none;
    }

    nav {
        display: flex;
        gap: 1.25rem;
    }

    nav a {
        color: var(--muted);
    }

    nav a[aria-current='page'] {
        color: inherit;
        text-decoration-thickness: 2px;
    }

    main,
    footer {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
    }

    .intro {
        padding: 5.5rem 0 3.5rem;
        border-bottom: 1px solid var(--border);
    }

    .eyebrow {
        margin: 0 0 0.75rem;
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    h1 {
        margin: 0;
        font-family: 'Mozilla Headline', serif;
        font-size: clamp(2.8rem, 9vw, 5.5rem);
        line-height: 1;
        letter-spacing: 0.025em;
    }

    .summary {
        margin: 1.5rem 0 0;
        color: var(--muted);
        font-size: clamp(1.05rem, 2vw, 1.25rem);
    }

    .photographs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3.5rem 1.5rem;
        padding: 3.5rem 0;
        border-bottom: 1px solid var(--border);
        scroll-margin-top: 1rem;
    }

    figure {
        margin: 0;
    }

    img {
        display: block;
        width: 100%;
        height: auto;
        background: #e8e5dd;
    }

    figcaption {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 0.65rem;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    a {
        color: #171511;
        text-underline-offset: 0.18em;
    }

    a:focus-visible {
        outline: 2px solid #171511;
        outline-offset: 3px;
    }

    footer {
        padding: 2rem 0 3rem;
        display: flex;
        justify-content: space-between;
        color: var(--muted);
    }

    footer p {
        margin: 0;
    }

    @media (max-width: 700px) {
        .site-header,
        main,
        footer {
            width: min(100% - 2rem, 52rem);
        }

        .site-header {
            grid-template-columns: 1fr auto;
            gap: 1rem;
        }

        .intro {
            padding: 4rem 0 2.75rem;
        }

        .photographs {
            grid-template-columns: 1fr;
            gap: 2.75rem;
            padding: 2.75rem 0;
        }
    }
</style>
