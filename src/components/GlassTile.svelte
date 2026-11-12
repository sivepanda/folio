<script lang="ts">
    import { onMount } from 'svelte';

    export let title: string;
    export let description: string;
    export let link: string | null = null;
    export let color: string = 'rgba(255, 255, 255, 0.1)';
    export let technologies: Array<{ name: string; icon: string }> = [];
    export let icon: string | null = null;
    // An in-site demo route. Desktop only: touch screens never see a link to it.
    export let demo: string | null = null;
    // The mark on a tile's demo half: an icon class, or 'chip' for a poker chip.
    export let demoIcon: string = 'ri-global-line';

    // Internal routes (e.g. /vecg) open in the same tab.
    $: external = !!link && !link.startsWith('/');
    $: source = link?.includes('github.com')
        ? { name: 'github', label: 'on GitHub', icon: 'ri-github-fill' }
        : { name: 'site', label: 'website', icon: 'ri-external-link-line' };

    let mouseX = 50;
    let mouseY = 50;
    let shimmerAngle = 0;
    let isHovered = false;
    let animationFrame: number;
    let titleEl: HTMLElement;
    let titleOverflows = false;
    // Which half of a two-link tile the pointer is over; the links split it down the middle.
    let side: 'demo' | 'link' | null = null;

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        if (demo) side = link && mouseX >= 50 ? 'link' : 'demo';
    }

    function animateShimmer() {
        shimmerAngle = (shimmerAngle + 0.5) % 360;
        if (isHovered) {
            animationFrame = requestAnimationFrame(animateShimmer);
        }
    }

    function handleMouseEnter() {
        isHovered = true;
        animateShimmer();
    }

    function handleMouseLeave() {
        isHovered = false;
        side = null;
        cancelAnimationFrame(animationFrame);
    }

    function checkTitleOverflow() {
        if (titleEl) {
            titleOverflows = titleEl.scrollWidth > titleEl.clientWidth;
        }
    }

    onMount(() => {
        checkTitleOverflow();
        return () => cancelAnimationFrame(animationFrame);
    });
</script>

{#snippet body()}
    <h2 class="title-marquee" class:title-overflows={titleOverflows} bind:this={titleEl}>
        <span>{title}</span>
    </h2>
    <p>{description}</p>

    {#if icon}
        <img
            class="tile-icon"
            src={icon}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden="true"
        />
    {/if}

    {#if technologies.length > 0}
        <div class="tech-footer">
            <div class="tech-icons">
                {#each technologies as tech}
                    <div class="tech-icon-container">
                        <i class={tech.icon} aria-label={tech.name}></i>
                        <div class="tech-tooltip">{tech.name}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

{#if demo}
    <!-- The tile itself isn't a link here: each half is its own link laid under the text,
         the demo on the left and the source on the right. Demos are desktop only, so on
         touch screens the demo half is dropped and the source takes the whole tile. -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="glass-tile split"
        class:dual={!!link}
        data-side={side}
        style="--tile-color: {color}; --mouse-x: {mouseX}%; --mouse-y: {mouseY}%; --shimmer-angle: {shimmerAngle}deg;"
        on:mousemove={handleMouseMove}
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
    >
        {@render body()}

        <a
            class="hit to-demo"
            href={demo}
            aria-label={`${title} demo`}
            style="--lit-x: {link ? mouseX * 2 : mouseX}%;"
        >
            <span class="lit" aria-hidden="true"></span>
        </a>
        {#if link}
            <a
                class="hit to-link"
                href={link}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                aria-label={`${title} ${source.label}`}
                style="--lit-x: {(mouseX - 50) * 2}%;"
            >
                <span class="lit" aria-hidden="true"></span>
            </a>

            <!-- What each half opens, drawn over the text while the tile is hovered. -->
            <span class="hint hint-demo" aria-hidden="true">
                {#if demoIcon === 'chip'}
                    <svg class="chip" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10.25" stroke-width="1.5" />
                        <!-- The striped edge: eight blocks around the rim. -->
                        <circle
                            cx="12"
                            cy="12"
                            r="8.25"
                            stroke-width="2.5"
                            stroke-dasharray="3.24 3.24"
                        />
                        <circle cx="12" cy="12" r="5.25" stroke-width="1.5" />
                    </svg>
                {:else}
                    <i class={demoIcon}></i>
                {/if}
                <span>demo</span>
            </span>
            <span class="hint hint-link" aria-hidden="true">
                <i class={source.icon}></i>
                <span>{source.name}</span>
            </span>
        {/if}
    </div>
{:else if link}
    <a
        class="glass-tile"
        style="--tile-color: {color}; --mouse-x: {mouseX}%; --mouse-y: {mouseY}%; --shimmer-angle: {shimmerAngle}deg;"
        href={link}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        on:mousemove={handleMouseMove}
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
    >
        {@render body()}
    </a>
{:else}
    <div class="glass-tile" style="--tile-color: {color}">
        {@render body()}
    </div>
{/if}

<style>
    .glass-tile {
        background: rgba(255, 255, 255, 0.05);
        width: 100%;
        border-radius: 1rem;
        box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.18),
            0 20px 60px -40px var(--tile-color, rgba(255, 255, 255, 0.2));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: rgb(219, 219, 219);
        transition:
            box-shadow 0.3s ease,
            border-color 0.3s ease,
            background 0.3s ease;
        cursor: default;
    }

    a.glass-tile {
        cursor: pointer;
    }

    /* a.glass-tile:hover, */
    /* a.glass-tile:focus { */
    /*     box-shadow: */
    /*         0 10px 40px rgba(31, 38, 135, 0.35), */
    /*         0 30px 80px -10px var(--tile-color, rgba(255, 255, 255, 0.35)), */
    /*         0 0 0 3px rgba(255, 255, 255, 0.2), */
    /*         0 0 24px rgba(255, 255, 255, 0.25); */
    /* } */
    /**/
    @supports (color: hsl(from white h s l / 1)) {
        a.glass-tile:hover,
        a.glass-tile:focus,
        .glass-tile.split:hover,
        .glass-tile.split:focus-within {
            background: rgba(255, 255, 255, 0.09);
            box-shadow:
                0 10px 40px rgba(31, 38, 135, 0.25),
                0 0 60px 10px hsl(from var(--tile-color) h s 60% / 0.45),
                0 0 0 2px rgba(255, 255, 255, 0.2),
                0 0 100px 20px hsl(from var(--tile-color) h s 70% / 0.25),
                calc(cos(var(--shimmer-angle, 0deg)) * 30px)
                    calc(sin(var(--shimmer-angle, 0deg)) * 30px) 60px 10px
                    hsl(from var(--tile-color) h s 75% / 0.35);
        }
    }

    .glass-tile::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    a.glass-tile:hover::before {
        opacity: 1;
        background: radial-gradient(
            circle 900px at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 40%,
            transparent 80%
        );
    }

    .glass-tile > * {
        position: relative;
        z-index: 2;
    }

    /* Split tiles: the two links sit under the text, so the text lets the pointer through to
       them. The tech icons keep it so their tooltips still work. */
    .split > :not(.hit) {
        pointer-events: none;
    }

    .split .tech-icon-container {
        pointer-events: auto;
    }

    .glass-tile > .hit {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 1;
        width: 50%;
        border-radius: inherit;
        color: inherit;
        cursor: pointer;
    }

    .to-demo {
        left: 0;
    }

    .to-link {
        right: 0;
    }

    .split:not(.dual) > .to-demo {
        width: 100%;
    }

    .hit:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.55);
        outline-offset: -6px;
    }

    /* A two-link tile only lifts a little as a whole, so the half being pointed at still
       stands out against it. */
    .glass-tile.dual:hover,
    .glass-tile.dual:focus-within {
        background: rgba(255, 255, 255, 0.065);
    }

    /* The hover light. On a two-link tile it covers the half being pointed at and reaches a
       little past the middle, which is what marks that half as the one a click opens. */
    .lit {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0;
        background:
            radial-gradient(
                circle 900px at var(--lit-x, 50%) var(--mouse-y, 50%),
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.05) 40%,
                transparent 80%
            ),
            rgba(255, 255, 255, 0.02);
        transition:
            opacity 0.3s ease,
            transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .split:not(.dual):hover .lit,
    .split:not(.dual) .hit:focus-visible .lit {
        opacity: 1;
    }

    /* Dimmer than a one-link tile's light, and faded out toward the middle, so the half reads
       as lit rather than as a grey panel. */
    .dual .lit {
        transform: scaleX(0.94);
        background: radial-gradient(
            circle 520px at var(--lit-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.11) 0%,
            rgba(255, 255, 255, 0.04) 45%,
            transparent 85%
        );
    }

    .dual .to-demo .lit {
        transform-origin: left center;
        mask-image: linear-gradient(to right, #000 72%, transparent);
    }

    .dual .to-link .lit {
        transform-origin: right center;
        mask-image: linear-gradient(to left, #000 72%, transparent);
    }

    .dual[data-side='demo'] .to-demo .lit,
    .dual[data-side='link'] .to-link .lit,
    .dual .hit:focus-visible .lit {
        opacity: 1;
        transform: scaleX(1.12);
    }

    /* While a two-link tile is hovered its text blurs and dims a little, so the marks saying
       what each half opens can sit on top of it and still read. */
    .dual > h2,
    .dual > p {
        transition:
            filter 0.35s ease,
            opacity 0.35s ease;
    }

    .dual:hover > h2,
    .dual:hover > p,
    .dual:focus-within > h2,
    .dual:focus-within > p {
        filter: blur(2px);
        opacity: 0.45;
    }

    .glass-tile > .hint {
        position: absolute;
        top: 50%;
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        color: #fff;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.94);
        transition:
            opacity 0.3s ease,
            transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Mozilla Headline', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1;
        text-shadow: 0 0 16px rgba(255, 255, 255, 0.35);
        pointer-events: none;
    }

    .hint-demo {
        left: 25%;
    }

    .hint-link {
        left: 75%;
    }

    .hint .chip {
        width: 3.25rem;
        height: 3.25rem;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }

    .hint i {
        font-size: 3.25rem;
        font-weight: 400;
        line-height: 1;
    }

    .dual:hover > .hint,
    .dual:focus-within > .hint {
        opacity: 0.35;
    }

    .dual[data-side='demo'] > .hint-demo,
    .dual[data-side='link'] > .hint-link,
    .dual:has(.to-demo:focus-visible) > .hint-demo,
    .dual:has(.to-link:focus-visible) > .hint-link {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.04);
    }

    /* Demos are desktop only. Without a mouse the demo link goes, and a tile with a source
       link opens that from anywhere on it. */
    @media not all and (hover: hover) and (pointer: fine) {
        .glass-tile > .to-demo {
            display: none;
        }

        .glass-tile > .to-link {
            width: 100%;
        }

        .lit,
        .glass-tile > .hint {
            display: none;
        }
    }

    .tile-icon {
        position: absolute;
        bottom: 0;
        right: 0;
        max-height: 50%;
        opacity: 0.07;
        pointer-events: none;
        z-index: 0;
        filter: brightness(0) invert(1);
        transform: translate(5%, 10%);
    }

    .glass-tile h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.7rem;
        line-height: 1.3;
    }

    .title-marquee {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        container-type: inline-size;
    }

    .title-marquee span {
        display: inline-block;
    }

    .glass-tile:hover .title-marquee.title-overflows span {
        animation: marquee 4s linear infinite;
    }

    @keyframes marquee {
        0% {
            transform: translateX(0);
        }
        10% {
            transform: translateX(0);
        }
        45% {
            transform: translateX(calc(-100% + 100cqw));
        }
        55% {
            transform: translateX(calc(-100% + 100cqw));
        }
        90% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(0);
        }
    }

    .glass-tile p {
        margin: 0;
        font-size: var(--p-size);
        line-height: 2;
        flex-grow: 1;
    }

    .tech-footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .tech-icons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
    }

    .tech-icon-container {
        position: relative;
        display: inline-block;
    }

    .tech-icon-container i {
        font-size: 1.5rem;
        color: rgba(255, 255, 255, 0.8);
        transition: color 0.2s ease;
        line-height: 1;
    }

    .tech-icon-container:hover i {
        color: rgba(255, 255, 255, 1);
    }

    .tech-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition:
            opacity 0.3s,
            visibility 0.3s,
            transform 0.3s;
        pointer-events: none;
        z-index: 1000;
        margin-bottom: 8px;
        transform: translateX(-50%) translateY(-5px);
        font-family: 'Mozilla Headline';
    }

    .tech-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
    }

    .tech-icon-container:hover .tech-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 768px) {
        .glass-tile {
            width: 100%;
            max-width: none;
            padding: 1.25rem;
        }

        .glass-tile h2 {
            font-size: 1.2rem;
            margin-bottom: 0.4rem;
        }

        /* No hover on phones to trigger the marquee, so let long titles wrap. */
        .title-marquee {
            white-space: normal;
        }

        .glass-tile:hover .title-marquee.title-overflows span {
            animation: none;
        }

        .glass-tile p {
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .tech-icons {
            gap: 0.5rem;
        }

        .tech-icon-container i {
            font-size: 1.1rem;
        }

        .tech-footer {
            margin-top: 1rem;
            padding-top: 0.75rem;
        }
    }
</style>
