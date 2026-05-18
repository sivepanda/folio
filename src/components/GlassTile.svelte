<script lang="ts">
    import { onMount } from 'svelte';
    import { perfTier, animationsEnabled } from '$lib/performance';

    export let title: string;
    export let description: string;
    export let link: string | null = null;
    export let color: string = 'rgba(255, 255, 255, 0.1)';
    export let technologies: Array<{ name: string; icon: string }> = [];
    export let icon: string | null = null;
    export let loadIndex: number = 0;
    export let tileSize: string = 'medium';

    let loaded = false;
    let mouseX = 50;
    let mouseY = 50;
    let isHovered = false;
    let shimmerActive = false;
    let tileEl: HTMLElement;
    let titleEl: HTMLElement;
    let titleOverflows = false;

    $: activated = isHovered;
    $: tier = $perfTier;
    $: anims = $animationsEnabled;

    $: currentScale = !loaded
        ? (anims ? 0.8 : 1.0)
        : activated && anims
            ? (tier === 'high' ? 1.055 : 1.035)
            : 1.0;

    $: currentOpacity = !loaded && anims ? 0 : 1;

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    }

    function handleMouseEnter() { isHovered = true; }
    function handleMouseLeave() {
        isHovered = false;
        mouseX = 50;
        mouseY = 50;
    }

    function appear() {
        loaded = true;
        if (anims && tier === 'high') {
            shimmerActive = true;
            setTimeout(() => { shimmerActive = false; }, 950);
        }
    }

    function checkTitleOverflow() {
        if (titleEl) titleOverflows = titleEl.scrollWidth > titleEl.clientWidth;
    }

    onMount(() => {
        checkTitleOverflow();

        if (!anims) {
            loaded = true;
            return;
        }

        const rect = tileEl.getBoundingClientRect();
        const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (alreadyVisible) {
            const delay = Math.min(loadIndex * 70, 350);
            const t = setTimeout(appear, delay);
            return () => clearTimeout(t);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    observer.disconnect();
                    appear();
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(tileEl);
        return () => observer.disconnect();
    });
</script>

{#if link}
    <a
        bind:this={tileEl}
        class="glass-tile tile-{tileSize}"
        class:activated
        class:loaded
        class:no-anim={!anims}
        class:perf-high={tier === 'high'}
        class:perf-medium={tier === 'medium'}
        class:perf-low={tier === 'low'}
        style="--tile-color: {color}; --mouse-x: {mouseX}%; --mouse-y: {mouseY}%; transform: scale({currentScale}); opacity: {currentOpacity};"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        on:mousemove={handleMouseMove}
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
    >
        {#if shimmerActive}
            <div class="shimmer-sweep" aria-hidden="true"></div>
        {/if}
        <h2 class="title-marquee" class:title-overflows={titleOverflows} bind:this={titleEl}>
            <span>{title}</span>
        </h2>
        <p>{description}</p>
        {#if icon}
            <img class="tile-icon" src={icon} alt="" aria-hidden="true" />
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
    </a>
{:else}
    <div
        bind:this={tileEl}
        class="glass-tile tile-{tileSize}"
        class:activated
        class:loaded
        class:no-anim={!anims}
        class:perf-high={tier === 'high'}
        class:perf-medium={tier === 'medium'}
        class:perf-low={tier === 'low'}
        style="--tile-color: {color}; transform: scale({currentScale}); opacity: {currentOpacity};"
    >
        {#if shimmerActive}
            <div class="shimmer-sweep" aria-hidden="true"></div>
        {/if}
        <h2 class="title-marquee" class:title-overflows={titleOverflows} bind:this={titleEl}>
            <span>{title}</span>
        </h2>
        <p>{description}</p>
        {#if icon}
            <img class="tile-icon" src={icon} alt="" aria-hidden="true" />
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
    </div>
{/if}

<style>
    /* ── Base (all tiers, resting) ────────────────────── */
    .glass-tile {
        border-radius: 1rem;
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: rgb(219, 219, 219);
        cursor: default;
        width: 100%;
        box-sizing: border-box;
        backdrop-filter: blur(14px) saturate(160%);
        -webkit-backdrop-filter: blur(14px) saturate(160%);

        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.2);
        /* No neon at rest — only structural depth shadows */
        box-shadow:
            0 4px 8px rgba(0, 0, 30, 0.3),
            0 12px 32px rgba(0, 0, 30, 0.2);

        transition:
            transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.4s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease,
            background 0.35s ease;
    }

    .glass-tile.no-anim { transition: none !important; }
    a.glass-tile { cursor: pointer; }

    /* ── Medium glass (resting) ───────────────────────── */
    .glass-tile.perf-medium {
        backdrop-filter: blur(20px) saturate(185%) brightness(1.04);
        -webkit-backdrop-filter: blur(20px) saturate(185%) brightness(1.04);
        background: linear-gradient(
            140deg,
            rgba(255, 255, 255, 0.07) 0%,
            rgba(180, 200, 255, 0.03) 60%,
            rgba(0, 0, 30, 0.03) 100%
        );
        border-top: 1px solid rgba(255, 255, 255, 0.38);
        border-left: 1px solid rgba(255, 255, 255, 0.26);
        border-bottom: 1px solid rgba(0, 0, 30, 0.28);
        border-right: 1px solid rgba(0, 0, 30, 0.18);
        box-shadow:
            0 2px 4px rgba(0, 0, 30, 0.3),
            0 8px 24px rgba(0, 0, 30, 0.22),
            0 20px 56px rgba(0, 0, 30, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }

    /* ── High glass (resting) — no neon, just depth + glass surface ── */
    .glass-tile.perf-high {
        backdrop-filter: blur(32px) saturate(240%) brightness(1.08);
        -webkit-backdrop-filter: blur(32px) saturate(240%) brightness(1.08);
        background: linear-gradient(
            140deg,
            rgba(255, 255, 255, 0.09) 0%,
            rgba(180, 200, 255, 0.04) 50%,
            rgba(0, 0, 30, 0.04) 100%
        );
        border-top: 1px solid rgba(255, 255, 255, 0.55);
        border-left: 1px solid rgba(255, 255, 255, 0.38);
        border-bottom: 1px solid rgba(0, 0, 30, 0.35);
        border-right: 1px solid rgba(0, 0, 30, 0.22);
        box-shadow:
            0 1px 2px rgba(0, 0, 30, 0.3),
            0 4px 12px rgba(0, 0, 30, 0.28),
            0 12px 36px rgba(0, 0, 30, 0.18),
            0 32px 80px rgba(0, 0, 30, 0.1),
            inset 0 1.5px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 30, 0.18);
    }

    /* ── Glass surface layer (perf-high, always present) ─ */
    /* Overhead catch light + Fresnel sheen + noise texture */
    .glass-tile.perf-high::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 3;
        mix-blend-mode: screen;

        background:
            radial-gradient(ellipse 70% 40% at 50% -5%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.05) 55%, transparent 75%),
            linear-gradient(93deg, rgba(255, 255, 255, 0.09) 0%, transparent 18%),
            linear-gradient(267deg, rgba(0, 0, 40, 0.07) 0%, transparent 16%),
            linear-gradient(180deg, transparent 65%, rgba(255, 255, 255, 0.04) 100%);

        opacity: 1;
    }

    /* ── Mouse-tracked specular (perf-high, hover only) ── */
    /* Sits above ::before — CSS doesn't allow ::before-after stacking with content,
       so we repurpose ::before on hover to add the dynamic specular on top */
    a.glass-tile.perf-high:hover::before {
        background:
            radial-gradient(ellipse 45% 35% at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 55%, transparent 80%),
            radial-gradient(ellipse 70% 40% at 50% -5%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.05) 55%, transparent 75%),
            linear-gradient(93deg, rgba(255, 255, 255, 0.09) 0%, transparent 18%),
            linear-gradient(267deg, rgba(0, 0, 40, 0.07) 0%, transparent 16%),
            linear-gradient(180deg, transparent 65%, rgba(255, 255, 255, 0.04) 100%);

        opacity: 1;
    }

    /* ── Simple catch light for medium ───────────────────── */
    .glass-tile.perf-medium::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 3;
        mix-blend-mode: screen;
        background:
            radial-gradient(
                ellipse 65% 35% at 50% -5%,
                rgba(255, 255, 255, 0.22) 0%,
                rgba(255, 255, 255, 0.04) 55%,
                transparent 75%
            ),
            linear-gradient(93deg, rgba(255,255,255,0.07) 0%, transparent 18%);
        opacity: 0.8;
    }

    /* ── Activated (hover only) — neon fires externally AND internally ── */
    .glass-tile.activated { z-index: 10; }

    .glass-tile.perf-low.activated {
        border-color: rgba(255, 255, 255, 0.35);
        box-shadow:
            0 4px 8px rgba(0, 0, 30, 0.3),
            0 12px 32px rgba(0, 0, 30, 0.2),
            0 0 18px 3px color-mix(in srgb, var(--tile-color) 80%, transparent),
            0 0 50px 10px color-mix(in srgb, var(--tile-color) 35%, transparent),
            inset 0 0 20px 4px color-mix(in srgb, var(--tile-color) 25%, transparent);
    }

    .glass-tile.perf-medium.activated {
        background: linear-gradient(
            140deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(180, 200, 255, 0.05) 60%,
            rgba(0, 0, 30, 0.04) 100%
        );
        border-top-color: rgba(255, 255, 255, 0.5);
        box-shadow:
            0 2px 4px rgba(0, 0, 30, 0.3),
            0 8px 24px rgba(0, 0, 30, 0.25),
            0 20px 56px rgba(0, 0, 30, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 0 20px 3px color-mix(in srgb, var(--tile-color) 85%, transparent),
            0 0 60px 14px color-mix(in srgb, var(--tile-color) 45%, transparent),
            0 0 120px 30px color-mix(in srgb, var(--tile-color) 18%, transparent),
            inset 0 0 30px 6px color-mix(in srgb, var(--tile-color) 22%, transparent),
            inset 0 0 80px 20px color-mix(in srgb, var(--tile-color) 10%, transparent);
    }

    .glass-tile.perf-high.activated {
        background: linear-gradient(
            140deg,
            rgba(255, 255, 255, 0.13) 0%,
            rgba(180, 200, 255, 0.06) 50%,
            rgba(0, 0, 30, 0.05) 100%
        );
        border-top-color: rgba(255, 255, 255, 0.68);
        border-left-color: rgba(255, 255, 255, 0.48);
        box-shadow:
            0 1px 2px rgba(0, 0, 30, 0.3),
            0 4px 12px rgba(0, 0, 30, 0.3),
            0 12px 36px rgba(0, 0, 30, 0.2),
            0 32px 80px rgba(0, 0, 30, 0.12),
            inset 0 1.5px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 30, 0.18),
            0 0 22px 3px color-mix(in srgb, var(--tile-color) 90%, transparent),
            0 0 65px 14px color-mix(in srgb, var(--tile-color) 55%, transparent),
            0 0 130px 35px color-mix(in srgb, var(--tile-color) 22%, transparent),
            inset 0 0 40px 8px color-mix(in srgb, var(--tile-color) 28%, transparent),
            inset 0 0 100px 30px color-mix(in srgb, var(--tile-color) 12%, transparent);
    }

    /* ── Tile size grid spans ─────────────────────────── */
    .tile-wide  { grid-column: span 2; }
    .tile-large { grid-column: span 2; grid-row: span 2; }
    .tile-tall  { grid-row: span 2; }

    /* ── Shimmer sweep ────────────────────────────────── */
    .shimmer-sweep {
        position: absolute;
        top: 0;
        left: 0;
        width: 55%;
        height: 100%;
        pointer-events: none;
        z-index: 4;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 100%
        );
        animation: shimmer-sweep 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes shimmer-sweep {
        from { transform: translateX(-130%); }
        to   { transform: translateX(310%); }
    }

    /* ── Content ──────────────────────────────────────── */
    .glass-tile > * { position: relative; z-index: 2; }

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

    .title-marquee span { display: inline-block; }

    .glass-tile:hover .title-marquee.title-overflows span {
        animation: marquee 4s linear infinite;
    }

    @keyframes marquee {
        0%   { transform: translateX(0); }
        10%  { transform: translateX(0); }
        45%  { transform: translateX(calc(-100% + 100cqw)); }
        55%  { transform: translateX(calc(-100% + 100cqw)); }
        90%  { transform: translateX(0); }
        100% { transform: translateX(0); }
    }

    .glass-tile p {
        margin: 0;
        font-size: var(--p-size);
        line-height: 2;
        flex-grow: 1;
    }

    /* ── Icon watermark ───────────────────────────────── */
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

    /* ── Tech footer ──────────────────────────────────── */
    .tech-footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .tech-icons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
    }

    .tech-icon-container { position: relative; display: inline-block; }

    .tech-icon-container i {
        font-size: 1.5rem;
        color: rgba(255, 255, 255, 0.75);
        transition: color 0.2s ease;
        line-height: 1;
    }

    .tech-icon-container:hover i { color: white; }

    .tech-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-5px);
        background: rgba(0, 0, 20, 0.92);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
        pointer-events: none;
        z-index: 1000;
        margin-bottom: 8px;
        font-family: 'Mozilla Headline';
    }

    .tech-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(0, 0, 20, 0.92);
    }

    .tech-icon-container:hover .tech-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }

    /* ── Mobile ───────────────────────────────────────── */
    @media (max-width: 768px) {
        .glass-tile { width: 100%; padding: 1.25rem; }
        .glass-tile h2 { font-size: 1.2rem; margin-bottom: 0.4rem; }
        .glass-tile p  { font-size: 0.9rem; line-height: 1.5; }
        .tech-icons    { gap: 0.5rem; }
        .tech-icon-container i { font-size: 1.1rem; }
        .tech-footer   { margin-top: 1rem; padding-top: 0.75rem; }

        .tile-wide,
        .tile-large { grid-column: span 1; }
        .tile-large,
        .tile-tall  { grid-row: span 1; }
    }

    /* ── Hard reduce-motion override ─────────────────── */
    @media (prefers-reduced-motion: reduce) {
        .glass-tile { transition: none !important; }
        .shimmer-sweep { display: none !important; }
    }
</style>
