<script lang="ts">
    import { onMount } from 'svelte';

    export let title: string;
    export let description: string;
    export let link: string | null = null;
    export let color: string = 'rgba(255, 255, 255, 0.1)';
    export let technologies: Array<{ name: string; icon: string }> = [];

    let mounted = false;
    let mouseX = 50;
    let mouseY = 50;

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    }

    onMount(() => {
        mounted = true;
    });
</script>

{#if link}
    <a
        class="glass-tile"
        style="--tile-color: {color}; --mouse-x: {mouseX}%; --mouse-y: {mouseY}%;"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        on:mousemove={handleMouseMove}
    >
        <h2>{title}</h2>
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
    </a>
{:else}
    <div class="glass-tile" style="--tile-color: {color}">
        <h2>{title}</h2>
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
{/if}

<style>
    .glass-tile {
        background: rgba(255, 255, 255, 0.05);
        width: calc(100% - 5rem);
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
        a.glass-tile:focus {
            background: rgba(255, 255, 255, 0.09);
            box-shadow:
                0 10px 40px rgba(31, 38, 135, 0.25),
                0 0 60px 10px hsl(from var(--tile-color) h s 60% / 0.45),
                0 0 0 2px rgba(255, 255, 255, 0.2),
                0 0 100px 20px hsl(from var(--tile-color) h s 70% / 0.25);
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

    .glass-tile h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.7rem;
        line-height: 1.3;
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
            width: 85%;
            max-width: 280px;
            padding: 1.25rem;
            margin: 0 auto;
        }

        .glass-tile h2 {
            font-size: 1.2rem;
            margin-bottom: 0.4rem;
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
