<script>
    import { browser } from '$app/environment';
    import { animate, stagger } from 'animejs';
    import { onMount } from 'svelte';

    let { simpleMode = false, onmodechange, onmusicchange } = $props();
    let musicHidden = $state(false);
    /** @type {HTMLElement | null} */
    let settingsElement = null;

    onMount(() => {
        if (browser) {
            musicHidden = localStorage.getItem('nowPlayingDismissed') === 'true';
        }
    });

    function toggleMusic() {
        if (!browser) return;

        if (musicHidden) {
            localStorage.removeItem('nowPlayingDismissed');
            localStorage.removeItem('nowPlayingDismissedTime');
        } else {
            localStorage.setItem('nowPlayingDismissed', 'true');
            localStorage.setItem('nowPlayingDismissedTime', Date.now().toString());
        }

        musicHidden = !musicHidden;
        onmusicchange?.();
    }

    function showLabels() {
        if (!settingsElement || simpleMode) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        animate(settingsElement.querySelectorAll('.label'), {
            opacity: [0, 1],
            translateX: ['0.8rem', 0],
            duration: reducedMotion ? 1 : 320,
            delay: reducedMotion ? 0 : stagger(45),
            ease: 'outCubic'
        });
    }

    function hideLabels() {
        if (!settingsElement || simpleMode) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        animate(settingsElement.querySelectorAll('.label'), {
            opacity: 0,
            translateX: '0.8rem',
            duration: reducedMotion ? 1 : 180,
            ease: 'inCubic'
        });
    }

    function handleMouseLeave() {
        if (!settingsElement?.matches(':focus-within')) hideLabels();
    }

    /** @param {FocusEvent} event */
    function handleFocusOut(event) {
        if (!settingsElement?.contains(/** @type {Node | null} */ (event.relatedTarget))) {
            hideLabels();
        }
    }
</script>

<svg class="clip-defs" aria-hidden="true">
    <defs>
        <clipPath id="settings-tab-clip" clipPathUnits="objectBoundingBox">
            <path
                d="M 1 0 C .96 .06 .83 .1 .67 .15 L .18 .23 C .07 .26 .02 .3 .02 .34 L .02 .66 C .02 .7 .07 .74 .18 .77 L .67 .85 C .83 .9 .96 .94 1 1 Z"
            />
        </clipPath>
    </defs>
</svg>

<aside
    bind:this={settingsElement}
    class:simple={simpleMode}
    class="settings"
    aria-label="Settings"
    onmouseenter={showLabels}
    onmouseleave={handleMouseLeave}
    onfocusin={showLabels}
    onfocusout={handleFocusOut}
>
    <button type="button" onclick={onmodechange}>
        <i class={simpleMode ? 'ri-brush-4-line' : 'ri-file-text-line'} aria-hidden="true"></i>
        <span class="label">{simpleMode ? 'Full view' : 'Simple view'}</span>
    </button>
    {#if !simpleMode}
        <button type="button" onclick={toggleMusic}>
            <i class={musicHidden ? 'ri-music-2-line' : 'ri-volume-mute-line'} aria-hidden="true"
            ></i>
            <span class="label">{musicHidden ? 'Show music' : 'Hide music'}</span>
        </button>
    {/if}
</aside>

<style>
    .settings {
        --settings-bg: rgba(11, 11, 26, 0.38);
        --settings-highlight: rgba(116, 78, 210, 0.16);
        --settings-border: rgba(255, 255, 255, 0.18);
        --settings-color: white;
        position: fixed;
        top: 22vh;
        right: 0;
        z-index: 9999;
        box-sizing: border-box;
        width: 2.25rem;
        height: 9.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        clip-path: url('#settings-tab-clip');
        background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent 42%),
            radial-gradient(circle at 15% 45%, var(--settings-highlight), transparent 70%),
            var(--settings-bg);
        backdrop-filter: blur(8px) saturate(140%);
        -webkit-backdrop-filter: blur(8px) saturate(140%);
        box-shadow: inset 1px 0 rgba(255, 255, 255, 0.18);
        filter: drop-shadow(-8px 10px 18px rgba(31, 38, 135, 0.2));
        color: var(--settings-color);
        font-family: 'Mozilla Text', sans-serif;
        overflow: hidden;
        transition:
            width 420ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 250ms ease;
    }

    .settings.simple {
        --settings-bg: rgba(245, 243, 237, 0.82);
        --settings-highlight: rgba(255, 255, 255, 0.35);
        --settings-border: #b9b1a6;
        --settings-color: #171511;
        height: 5rem;
    }

    .clip-defs {
        position: absolute;
        width: 0;
        height: 0;
    }

    .settings:hover,
    .settings:focus-within {
        width: 7.5rem;
    }

    .settings.simple:hover,
    .settings.simple:focus-within {
        width: 2.25rem;
    }

    .settings.simple .label {
        display: none;
    }

    button {
        box-sizing: border-box;
        width: 100%;
        height: 2.1rem;
        flex: 0 0 2.1rem;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.4rem;
        padding: 0 0.55rem;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 0.66rem;
        line-height: 1.2;
    }

    button + button {
        border-top: 1px solid var(--settings-border);
    }

    button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: -4px;
    }

    i {
        flex: 0 0 0.95rem;
        width: 0.95rem;
        font-size: 0.95rem;
        text-align: center;
    }

    .label {
        min-width: 0;
        overflow: hidden;
        opacity: 0;
        transform: translateX(0.8rem);
        white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
        .settings,
        .label {
            transition-duration: 0.01ms;
        }
    }

    @media (max-aspect-ratio: 1) {
        .settings:not(.simple) {
            top: 22vh;
        }
    }
</style>
