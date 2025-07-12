<script lang="ts">
    import { onMount } from 'svelte';
    
    export let title: string;
    export let description: string;
    export let link: string | null = null;
    export let color: string = 'rgba(255, 255, 255, 0.1)';
    export let technologies: Array<{name: string, icon: string}> = [];

    let mounted = false;

    onMount(() => {
        mounted = true;
    });
</script>

<div class="glass-tile" style="--tile-color: {color}">
    {#if link}
        <a class="tile-link" href={link} target="_blank" rel="noopener noreferrer">
            <h2>
                <span class="visit-text">&dollar;&nbsp;cd</span>
                <span class="title-text">{title}</span>
            </h2>
        </a>
    {:else}
        <h2 class="tile-link no-link">
            {title}
        </h2>
    {/if}
    <p>{description}</p>
    
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

<style>
    .glass-tile {
        background: rgba(255, 255, 255, 0.15);
        width: calc(100% - 5rem);
        border-radius: 1.5rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        min-height: 250px;
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
        flex-grow: 1;
    }

    .tech-footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
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
        transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
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

    .tile-link {
        color: rgb(219, 219, 219);
        text-decoration: none;
        display: inline-block;
        position: relative;
    }

    .visit-text {
        opacity: 0;
        max-width: 0em;
        max-height: 0em;
        display: inline-block;
        padding: 0;
        white-space: nowrap;
        transition: 0.8s ease-in;
        margin-right: 0;
    }

    .title-text {
        transition: transform 0.8s ease;
        color: inherit;
        display: inline-block;
    }

    .tile-link:hover .visit-text,
    .tile-link:focus .visit-text {
        color: rgba(255,255,255,1);
        opacity: 1;
        max-height: 10em;
        max-width: 20em;
        transition: 0.8s ease-in-out;
    }

    .tile-link:hover .title-text,
    .tile-link:focus .title-text {
        color: rgba(255,255,255,1);
        transition: 0.8s ease-in-out;
        transform: translateX(0);
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
            padding: 1.5rem;
            min-height: 220px;
        }

        .glass-tile h2 {
            font-size: 1.5rem;
        }

        .glass-tile p {
            font-size: 1rem;
        }

        .tech-icons {
            gap: 0.5rem;
        }

        .tech-icon-container i {
            font-size: 1.25rem;
        }
    }
</style> 