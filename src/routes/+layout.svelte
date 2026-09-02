<script>
    import Header from '../components/Header.svelte';
    import NowPlayingWidget from '../components/NowPlayingWidget.svelte';
    import SettingsMenu from '../components/SettingsMenu.svelte';
    import { setContext } from 'svelte';
    import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

    injectSpeedInsights();

    const { children } = $props();
    let scrY = $state(0);
    let simpleMode = $state(false);
    let musicVersion = $state(0);

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

<SettingsMenu
    {simpleMode}
    onmodechange={() => (simpleMode = !simpleMode)}
    onmusicchange={() => (musicVersion += 1)}
/>

{#if !simpleMode}
    {#key musicVersion}
        <NowPlayingWidget />
    {/key}
{/if}
