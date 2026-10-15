<script>
    import { animate, stagger } from 'animejs';

    let { simpleMode = false, musicHidden = false, onmodechange, onmusicchange } = $props();
    /** @type {HTMLElement | null} */
    let settingsElement = null;
    // Touch screens have no hover, so the first tap opens the tab instead.
    let touchOpen = $state(false);

    function isTouch() {
        return window.matchMedia('(hover: none)').matches;
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

    // Only keyboard focus (:focus-visible) holds the tab open. A mouse click
    // also focuses the button, but the tab should still collapse on mouse-out.
    function hasKeyboardFocus() {
        return !!settingsElement?.querySelector(':focus-visible');
    }

    /** @param {FocusEvent} event */
    function handleFocusIn(event) {
        const target = /** @type {HTMLElement} */ (event.target);
        const fromOutside = !settingsElement?.contains(
            /** @type {Node | null} */ (event.relatedTarget)
        );
        if (
            fromOutside &&
            target.matches(':focus-visible') &&
            !settingsElement?.matches(':hover')
        ) {
            showLabels();
        }
    }

    // Mobile browsers fire mouse events on tap, so ignore them on touch.
    function handleMouseEnter() {
        if (!isTouch()) showLabels();
    }

    function handleMouseLeave() {
        if (!isTouch() && !hasKeyboardFocus()) hideLabels();
    }

    function closeTouch() {
        if (!touchOpen) return;
        touchOpen = false;
        hideLabels();
    }

    /**
     * On touch, a tap on the collapsed tab opens it; the next tap runs the option.
     * @param {MouseEvent} event
     * @param {() => void} action
     */
    function handleAction(event, action) {
        if (isTouch() && !simpleMode && !touchOpen) {
            event.preventDefault();
            touchOpen = true;
            showLabels();
            return;
        }
        closeTouch();
        action?.();
    }

    $effect(() => {
        if (!touchOpen) return;

        /** @param {Event} event */
        const closeIfOutside = (event) => {
            if (!settingsElement?.contains(/** @type {Node} */ (event.target))) closeTouch();
        };
        // Capture so scrolls of any element (e.g. body as scroller) close it too.
        document.addEventListener('pointerdown', closeIfOutside, true);
        document.addEventListener('scroll', closeTouch, { capture: true, passive: true });
        return () => {
            document.removeEventListener('pointerdown', closeIfOutside, true);
            document.removeEventListener('scroll', closeTouch, { capture: true });
        };
    });

    /** @param {FocusEvent} event */
    function handleFocusOut(event) {
        const leavingTab = !settingsElement?.contains(
            /** @type {Node | null} */ (event.relatedTarget)
        );
        if (leavingTab && !settingsElement?.matches(':hover')) hideLabels();
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
    class:touch-open={touchOpen}
    class="settings"
    aria-label="Settings"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
>
    <button type="button" onclick={(event) => handleAction(event, onmodechange)}>
        <i class={simpleMode ? 'ri-brush-4-line' : 'ri-file-text-line'} aria-hidden="true"></i>
        <span class="label">{simpleMode ? 'full view' : 'simple view'}</span>
    </button>
    {#if !simpleMode}
        <button type="button" onclick={(event) => handleAction(event, onmusicchange)}>
            <i class={musicHidden ? 'ri-music-2-line' : 'ri-volume-mute-line'} aria-hidden="true"
            ></i>
            <span class="label">{musicHidden ? 'show music' : 'hide music'}</span>
        </button>
    {/if}
</aside>

<style>
    .settings {
        --settings-bg: rgba(11, 11, 26, 0.38);
        --settings-highlight: rgba(116, 78, 210, 0.16);
        --settings-border: rgba(255, 255, 255, 0.18);
        --settings-outline: rgba(255, 255, 255, 0.28);
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
        filter:
            drop-shadow(-2px 0 var(--settings-outline))
            drop-shadow(0 -2px var(--settings-outline))
            drop-shadow(0 2px var(--settings-outline))
            drop-shadow(-8px 10px 18px rgba(31, 38, 135, 0.2));
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
        --settings-outline: rgba(23, 21, 17, 0.45);
        --settings-color: #171511;
        height: 5rem;
    }

    .clip-defs {
        position: absolute;
        width: 0;
        height: 0;
    }

    @media (hover: hover) {
        .settings:hover,
        .settings:has(:focus-visible) {
            width: 7.5rem;
        }

        .settings.simple:hover,
        .settings.simple:has(:focus-visible) {
            width: 2.25rem;
        }

        button:hover {
            background: rgba(255, 255, 255, 0.1);
        }
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

    /* Touch: icon-only, but with ~44px tap targets. The tab grows taller so
       the buttons stay inside the clip shape's straight middle section. */
    @media (pointer: coarse) {
        .settings {
            width: 2.75rem;
            height: 12.5rem;
        }

        .settings.simple {
            width: 2.75rem;
            height: 6.5rem;
        }

        .settings.touch-open {
            width: 8.75rem;
        }

        button {
            height: 2.75rem;
            flex-basis: 2.75rem;
            padding: 0 0.8rem;
            font-size: 0.8rem;
        }

        i {
            flex-basis: 1.15rem;
            width: 1.15rem;
            font-size: 1.15rem;
        }
    }
</style>
