<script>
    import Header from '../components/Header.svelte';
    import NowPlayingWidget from '../components/NowPlayingWidget.svelte';
    import SettingsMenu from '../components/SettingsMenu.svelte';
    import { page } from '$app/state';
    import { browser } from '$app/environment';
    import { onMount, setContext } from 'svelte';
    import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

    injectSpeedInsights();

    const { children } = $props();
    let scrY = $state(0);
    let simpleMode = $state(page.url.searchParams.get('simple') === 'true');
    let musicVersion = $state(0);
    let musicHidden = $state(false);

    onMount(() => {
        musicHidden = localStorage.getItem('nowPlayingDismissed') === 'true';
    });

    function toggleMode() {
        simpleMode = !simpleMode;
    }

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
        musicVersion += 1;
    }

    $effect(() => {
        if (page.url.searchParams.get('simple') === 'true') simpleMode = true;
    });

    setContext('view-mode', {
        get simpleMode() {
            return simpleMode;
        }
    });
</script>

<svelte:window bind:scrollY={scrY} />

{#if !simpleMode}
    <Header {scrY} />
{/if}

{@render children?.()}

<SettingsMenu {simpleMode} {musicHidden} onmodechange={toggleMode} onmusicchange={toggleMusic} />

{#if !simpleMode}
    {#key musicVersion}
        <NowPlayingWidget ondismiss={() => (musicHidden = true)} />
    {/key}
{/if}
