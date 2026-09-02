<script>
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let { simpleMode = false, onmodechange, onmusicchange } = $props();
    let musicHidden = $state(false);

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
</script>

<details class:simple={simpleMode} class="settings">
    <summary aria-label="Open settings">
        <i class="ri-settings-3-line" aria-hidden="true"></i>
    </summary>
    <div class="settings-panel">
        <p>Settings</p>
        <button type="button" onclick={onmodechange}>
            <i class={simpleMode ? 'ri-brush-4-line' : 'ri-file-text-line'} aria-hidden="true"></i>
            {simpleMode ? 'full view' : 'simple view'}
        </button>
        <button type="button" onclick={toggleMusic}>
            <i class={musicHidden ? 'ri-music-2-line' : 'ri-volume-mute-line'} aria-hidden="true"
            ></i>
            {musicHidden ? 'show music widget' : 'hide music widget'}
        </button>
    </div>
</details>

<style>
    .settings {
        --settings-bg: rgba(11, 11, 26, 0.58);
        --settings-border: rgba(255, 255, 255, 0.2);
        --settings-color: white;
        position: fixed;
        top: calc(6vh + 16px);
        right: 20px;
        z-index: 9999;
        color: var(--settings-color);
        font-family: 'Mozilla Text', sans-serif;
    }

    .settings.simple {
        --settings-bg: #f5f3ed;
        --settings-border: #b9b1a6;
        --settings-color: #171511;
        top: 16px;
    }

    summary {
        width: 44px;
        height: 44px;
        border: 1px solid var(--settings-border);
        border-radius: 8px;
        background: var(--settings-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: grid;
        place-items: center;
        margin-left: auto;
        cursor: pointer;
        list-style: none;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
        font-size: 1.15rem;
    }

    summary::-webkit-details-marker {
        display: none;
    }

    summary:focus-visible,
    button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 3px;
    }

    .settings-panel {
        width: 13rem;
        margin-top: 0.5rem;
        padding: 0.75rem;
        border: 1px solid var(--settings-border);
        border-radius: 10px;
        background: var(--settings-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
    }

    .simple summary,
    .simple .settings-panel {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        box-shadow: 0 6px 18px rgba(52, 38, 29, 0.08);
    }

    p {
        margin: 0 0 0.5rem;
        padding: 0 0.35rem 0.55rem;
        border-bottom: 1px solid var(--settings-border);
        font-family: 'Mozilla Headline', serif;
        font-size: 0.85rem;
        font-weight: 650;
    }

    button {
        box-sizing: border-box;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.55rem 0.35rem;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 0.8rem;
        line-height: 1.2;
        text-align: left;
        text-decoration: none;
    }

    button:hover {
        background: rgba(127, 127, 127, 0.12);
    }

    .simple,
    .simple * {
        animation: none !important;
        transition: none !important;
    }

    @media (max-aspect-ratio: 1) {
        .settings:not(.simple) {
            top: 72px;
            right: 12px;
        }
    }
</style>
