<script lang="ts">
    export let title: string;
    export let description: string;
    export let link: string | null = null;
    export let color: string = 'rgba(255, 255, 255, 0.1)';
</script>

<div class="glass-tile" style="--tile-color: {color}">
    {#if link}
        <a class="tile-link" href={link} target="_blank" rel="noopener noreferrer">
            <h2>
                {title}
                <span class="arrow" aria-hidden="true">→</span>
            </h2>
        </a>
    {:else}
        <h2 class="tile-link no-link">
            {title}
        </h2>
    {/if}
    <p>{description}</p>
</div>

<style>
    .glass-tile {
        background: rgba(255, 255, 255, 0.15);
        width: 42%;
        border-radius: 1.5rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }

    .glass-tile::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            135deg,
            var(--tile-color, rgba(255, 255, 255, 0.1)) 0%,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0) 50%
        );
        pointer-events: none;
        z-index: 1;
    }

    .glass-tile::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.05) 0%,
            rgba(0, 0, 0, 0.02) 25%,
            rgba(0, 0, 0, 0) 50%
        );
        pointer-events: none;
        z-index: 1;
    }

    .glass-tile > * {
        position: relative;
        z-index: 2;
    }

    .glass-tile h2 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        line-height: 2;
    }

    .glass-tile p {
        margin: 0;
        font-size: 1.1rem;
        line-height: 2;

    }

    .tile-link {
        text-decoration: none;
        color: inherit;
        display: inline-block;
        position: relative;
    }

    .arrow {
        opacity: 0;
        margin-left: 0.5em;
        transition:
            opacity 0.2s,
            transform 0.2s;
        font-size: 1.2em;
        vertical-align: middle;
    }

    .tile-link:hover .arrow,
    .tile-link:focus .arrow {
        opacity: 1;
        transform: translateX(6px);
    }

    .tile-link h2 {
        display: inline;
        cursor: pointer;
    }

    .tile-link.no-link {
        cursor: default;
    }

    @media (max-width: 768px) {
        .glass-tile {
            width: 100%;
            padding: 1.5rem;
        }

        .glass-tile h2 {
            font-size: 1.5rem;
        }

        .glass-tile p {
            font-size: 1rem;
        }
    }
</style> 