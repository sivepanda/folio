<script>
    import Load from '../../components/Load.svelte';
    import Footer from '../../components/Footer.svelte';
    import SimpleHeader from '../../components/SimpleHeader.svelte';
    import PageMeta from '../../components/PageMeta.svelte';
    import DesktopNotice from '../../components/DesktopNotice.svelte';
    import Client from '$lib/p2poker/Client.svelte';
    import Console from '$lib/p2poker/Console.svelte';
    import Timeline from '$lib/p2poker/Timeline.svelte';
    import { STREETS, loadEngine } from '$lib/p2poker/engine.js';
    import { buildRounds } from '$lib/p2poker/rounds.js';
    import { getContext, onMount } from 'svelte';
    import { cubicOut } from 'svelte/easing';
    import { MediaQuery } from 'svelte/reactivity';

    /** @typedef {import('$lib/p2poker/engine.js').Engine} Engine */
    /** @typedef {import('$lib/p2poker/engine.js').View} View */
    /** @typedef {import('$lib/p2poker/engine.js').TableEvent} TableEvent */
    /** @typedef {import('$lib/p2poker/engine.js').ActionKind} ActionKind */
    /** @typedef {{ winners: number[], hand: string, uncontested: boolean }} Result */

    const CLIENTS = [0, 1];
    // How long a node waits on the seat to act before the attempt counts as missed. One person
    // is playing both seats here, so this is far more patient than a real table would be.
    const TIMEOUT_MS = 120_000;
    const MAX_ATTEMPTS = 3;
    const MAX_LOG_LINES = 1500;

    const viewMode = getContext('view-mode');
    let simpleMode = $derived(viewMode.simpleMode);

    /** @type {Engine | null} */
    let engine = $state.raw(null);
    /** @type {'loading' | 'ready' | 'playing' | 'over' | 'failed'} */
    let phase = $state('loading');
    let failure = $state('');
    /** @type {(View | null)[]} */
    let views = $state.raw([null, null]);
    /** @type {(Result | null)[]} */
    let results = $state.raw([null, null]);
    /** @type {TableEvent[]} */
    let events = $state.raw([]);
    let dealtAt = $state(0);

    let names = $derived(views.map((view, i) => view?.nodeId || `node-${i + 1}`));

    // The round timeline and each log's committed marks are read back out of the event stream.
    let table = $derived(buildRounds(events, names));
    /** @type {number | null} a round the reader chose to look at; null follows the play */
    let picked = $state(null);
    // Following the play means the latest round with a proposal up. The round after it is only
    // a node waiting on a seat, and jumping there would hide the exchange that just happened.
    let selected = $derived.by(() => {
        if (picked !== null) return picked;
        const rounds = table.rounds;
        const live = rounds.findLast((r) => r.steps.some((s) => s.name !== 'poll_proposal'));
        return (live ?? rounds.at(-1))?.id ?? null;
    });

    let label = $derived.by(() => {
        if (phase === 'failed') return 'Engine unavailable';
        if (!engine) return 'Loading engine';
        if (phase === 'loading') return 'Seating the table';
        if (phase === 'playing') return 'Hand in progress';
        return phase === 'over' ? 'Deal another hand' : 'Deal a hand';
    });

    // The dealer button: a "D" puck that deals when it can and otherwise shows where the hand
    // is, by street. It stays one real button the whole time, so focus never jumps.
    let street = $derived(STREETS[Math.max(0, ...views.map((v) => v?.street ?? 0))] ?? STREETS[0]);
    let canDeal = $derived.by(() => phase === 'ready' || phase === 'over');
    let puckWord = $derived.by(() => {
        if (phase === 'failed') return 'error';
        if (phase === 'ready') return 'deal';
        if (phase === 'over') return 'again';
        if (phase === 'playing') return street.toLowerCase();
        return engine ? 'seating' : 'loading';
    });
    let puckLabel = $derived.by(() =>
        phase === 'playing' ? `${label}, ${street.toLowerCase()}` : label
    );

    // Motion is for the full view only; the simple view and reduced-motion systems get none.
    const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

    /**
     * Spins the puck over like a tossed coin, landing on its new word.
     * @param {Element} _node
     * @param {{ turns: number }} params how many full turns the coin makes
     */
    function coin(_node, { turns }) {
        if (simpleMode || reducedMotion.current) return { duration: 0 };
        return {
            duration: 560,
            easing: cubicOut,
            css: (/** @type {number} */ _t, /** @type {number} */ u) =>
                `transform: perspective(320px) rotateY(${u * turns * 360}deg)`
        };
    }

    // Events arrive synchronously from inside the Go module. Calling back into it from there
    // would re-enter it, so they're only queued and the page catches up on the next tick.
    /** @type {TableEvent[]} */
    let inbox = [];
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let flushing;
    let mounted = false;

    /** @param {TableEvent} event */
    function receive(event) {
        inbox.push(event);
        flushing ??= setTimeout(flush, 0);
    }

    function flush() {
        flushing = undefined;
        if (!mounted || !engine) return;
        const arrived = inbox;
        inbox = [];

        for (const event of arrived) {
            const f = event.fields;
            if (event.kind !== 'showdown' || !(f?.winners || f?.winner)) continue;
            const next = [...results];
            next[event.client] = {
                winners: (f.winners ?? f.winner).match(/\d+/g)?.map(Number) ?? [],
                hand: f.best_hand ?? '',
                uncontested: f.reason === 'uncontested'
            };
            results = next;
        }

        events = [...events, ...arrived].slice(-MAX_LOG_LINES);
        refresh();
    }

    function refresh() {
        if (!engine) return;
        const e = engine;
        views = CLIENTS.map((client) => e.view(client));
        if (phase === 'playing' && results.every(Boolean) && views.every((v) => v?.handOver)) {
            phase = 'over';
        }
    }

    async function seat() {
        if (!engine) return;
        results = [null, null];
        await engine.open({
            clients: CLIENTS.length,
            timeoutMs: TIMEOUT_MS,
            maxAttempts: MAX_ATTEMPTS,
            onEvent: receive
        });
        refresh();
    }

    async function deal() {
        if (!engine || phase === 'loading' || phase === 'playing') return;
        const again = phase === 'over';
        try {
            phase = 'loading';
            // The engine plays one hand per table, so another hand means a fresh table: new
            // nodes, new keys, a new shuffle.
            if (again) {
                events = [];
                picked = null;
                await seat();
            }
            dealtAt = Date.now();
            phase = 'playing';
            await engine.start();
        } catch (error) {
            fail(error);
        }
    }

    /** @param {number} client @param {ActionKind} kind @param {number} [amount] */
    function act(client, kind, amount) {
        if (!engine) return 'The engine is not running';
        const refused = engine.act(client, kind, amount);
        // A new move is the thing to watch, whatever round was being inspected.
        if (!refused) picked = null;
        refresh();
        return refused;
    }

    /** @param {unknown} error */
    function fail(error) {
        console.error(error);
        failure = error instanceof Error ? error.message : String(error);
        phase = 'failed';
    }

    onMount(() => {
        mounted = true;
        loadEngine()
            .then(async (loaded) => {
                if (!mounted) return;
                engine = loaded;
                await seat();
                phase = 'ready';
            })
            .catch(fail);

        return () => {
            mounted = false;
            clearTimeout(flushing);
            engine?.close();
        };
    });
</script>

<PageMeta
    title="P2Poker | Siven Panda"
    description="Play both seats of a peer-to-peer poker hand. Two real nodes run in this tab and shuffle, deal, and sign every move with no server in between."
/>

{#snippet lead()}
    <DesktopNotice />
    <header class="lead">
        <div class="title">
            <h1>P2Poker</h1>
            <p class="intro">
                Peer-to-Peer trustless Texas Hold'em poker game that includes implementations of key
                distributed systems architectures and models. Read more about the implementation
                <a
                    href="https://github.com/sivepanda/p2poker"
                    target="_blank"
                    rel="noopener noreferrer">here</a
                >.
            </p>
            <p class="intro">
                Here's a demonstration of the game, running the dispatch and player servers compiled
                to WebAssembly, alongside the logs for both players. You can play against yourself
                here, or test the game over the internet by
                <a
                    href="https://github.com/sivepanda/p2poker"
                    target="_blank"
                    rel="noopener noreferrer">building it from source</a
                >.
            </p>
        </div>
        <div class="controls">
            <button
                type="button"
                class="dealer"
                class:live={canDeal}
                aria-disabled={!canDeal}
                aria-label={puckLabel}
                onclick={deal}
            >
                {#key puckWord}
                    <span class="puck" in:coin={{ turns: 1 }}>
                        <svg class="chip" viewBox="0 0 100 100" aria-hidden="true">
                            <circle class="face" cx="50" cy="50" r="49" />
                            <circle class="rim" cx="50" cy="50" r="48.5" />
                            <!-- The striped edge: eight blocks around the rim. -->
                            <circle class="edge" cx="50" cy="50" r="41" />
                            <circle class="ring" cx="50" cy="50" r="35" />
                        </svg>
                        <span class="word" class:long={puckWord.length > 7} aria-hidden="true"
                            >{puckWord}</span
                        >
                    </span>
                {/key}
            </button>
            <span class="sr-only" aria-live="polite">{phase === 'playing' ? street : label}</span>
            {#if phase === 'failed'}
                <p class="failure" role="alert">The poker engine didn't start: {failure}</p>
            {/if}
        </div>
    </header>
{/snippet}

{#snippet demo()}
    <div class="table">
        {#each CLIENTS as client}
            {#if engine}
                <Client
                    {engine}
                    view={views[client]}
                    result={results[client]}
                    dealing={phase === 'playing'}
                    confirmed={table.confirmed[client]}
                    {selected}
                    onact={(kind, amount) => act(client, kind, amount)}
                    onpick={(round) => (picked = round)}
                />
            {:else}
                <div class="placeholder" aria-hidden="true"></div>
            {/if}
        {/each}
        <Timeline rounds={table.rounds} {names} {selected} onpick={(round) => (picked = round)} />
        <Console {engine} {events} {names} since={dealtAt} />
    </div>
{/snippet}

{#if simpleMode}
    <div class="simple-page p2p">
        <SimpleHeader />
        <main id="main">
            {@render lead()}
            {@render demo()}
        </main>
    </div>
{:else}
    <Load />
    <div class="top sect p2p">
        {@render lead()}
        {@render demo()}
    </div>
    <Footer />
{/if}

<style>
    .p2p {
        --fg: #fff;
        --muted: rgba(255, 255, 255, 0.6);
        --line: rgba(255, 255, 255, 0.18);
        --panel: rgba(255, 255, 255, 0.05);
        --well: rgba(0, 0, 0, 0.3);
        --accent: rgb(232, 121, 232);
        --bad: rgb(255, 138, 128);
        --node-0: rgb(110, 200, 255);
        --node-1: rgb(232, 121, 232);
        /* One hue per move, and how strongly the player UI glows with them. */
        --check: rgb(108, 232, 184);
        --fold: rgb(255, 128, 112);
        --raise: rgb(255, 196, 92);
        --glow-a: 70%;
        --lift: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
        /* How far the settled hand lifts the winner's panel and dims the loser's. */
        --win-bright: 1.15;
        --lose-dim: 0.72;
        --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
    }

    .top {
        width: 100%;
        min-height: 100vh;
        margin-top: 60px;
        padding: clamp(1.5rem, 5vw, 4rem) clamp(1rem, 5vw, 5rem) 5vh;
    }

    .top h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(3rem, 9vh, 5.5rem);
        line-height: 1.05;
    }

    .intro {
        max-width: 46rem;
        margin: 0;
        color: color-mix(in srgb, var(--fg) 85%, transparent);
        line-height: 1.55;
    }

    .intro + .intro {
        margin-top: 0.6rem;
    }

    .intro a {
        color: var(--fg);
        text-decoration: underline;
        text-decoration-color: var(--accent);
        text-underline-offset: 0.2em;
        transition: color 180ms ease;
    }

    .intro a:hover,
    .intro a:focus-visible {
        color: var(--accent);
    }

    /* The heading and intro on the left, the deal button on the right, centred on that pair. */
    .lead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem 3rem;
        margin-bottom: 4vh;
    }

    .title {
        min-width: 0;
    }

    .controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex-shrink: 0;
        gap: 0.75rem;
        max-width: 20rem;
        text-align: right;
    }

    /* The dealer button. A fixed-size circle whatever it says, so nothing around it moves. */
    .dealer {
        --size: 5rem;
        position: relative;
        width: var(--size);
        height: var(--size);
        flex-shrink: 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--fg);
        font: inherit;
        cursor: default;
        transition: transform 140ms ease;
        -webkit-tap-highlight-color: transparent;
    }

    .dealer.live {
        cursor: pointer;
    }

    .dealer.live:active {
        transform: scale(0.94);
    }

    .dealer:focus-visible {
        outline: none;
    }

    /* The chip that flips. Its back is hidden, so a spin shows edge, nothing, then the face. */
    .puck {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        border-radius: 50%;
        box-shadow: var(--lift);
        backface-visibility: hidden;
        transition: box-shadow 260ms ease;
    }

    /* A poker chip: outer rim, eight striped edge blocks, and an inner ring around the word.
       Drawn like the homepage chip, with a wider face so a street name fits inside. */
    .chip {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    .chip circle {
        fill: none;
        transition: stroke 200ms ease;
    }

    .chip .face {
        fill: var(--panel);
    }

    .chip .rim {
        stroke: color-mix(in srgb, var(--fg) 35%, transparent);
        stroke-width: 1.5;
    }

    .chip .edge {
        stroke: color-mix(in srgb, var(--fg) 40%, transparent);
        stroke-width: 9;
        /* 2πr / 16: eight blocks and eight gaps of equal length. */
        stroke-dasharray: 16.1 16.1;
    }

    .chip .ring {
        stroke: color-mix(in srgb, var(--fg) 30%, transparent);
        stroke-width: 1.5;
    }

    .dealer.live .chip .edge {
        stroke: color-mix(in srgb, var(--accent) 80%, transparent);
    }

    .word {
        position: relative;
        max-width: 3.4rem;
        color: var(--fg);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1;
        transition: text-shadow 220ms ease;
    }

    /* "showdown" needs a touch less to stay inside the ring. */
    .word.long {
        font-size: 0.6rem;
        letter-spacing: 0;
    }

    .dealer.live .word {
        color: var(--accent);
    }

    .dealer.live:hover .puck,
    .dealer:focus-visible .puck {
        box-shadow:
            var(--lift),
            0 0 24px -4px color-mix(in srgb, var(--accent) var(--glow-a), transparent);
    }

    .dealer.live:hover .chip .rim,
    .dealer:focus-visible .chip .rim {
        stroke: color-mix(in srgb, var(--accent) 80%, transparent);
    }

    .dealer.live:hover .word,
    .dealer:focus-visible .word {
        text-shadow: 0 0 10px color-mix(in srgb, var(--accent) var(--glow-a), transparent);
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }

    .failure {
        margin: 0;
        color: var(--bad);
    }

    /* Two clients side by side, the round timeline under them with a lifeline below each, and
       the node log running the full height beside both. The log drops underneath before the
       clients get too narrow to play, and the clients stack last. */
    .table {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(0, 1.25fr);
        gap: 20px;
        align-items: stretch;
    }

    .table > :global(.timeline) {
        grid-column: 1 / 3;
    }

    .table > :global(.console) {
        grid-column: 3;
        grid-row: 1 / 3;
    }

    .placeholder {
        min-height: 24rem;
        border: 1px solid var(--line);
        border-radius: 1rem;
        background: var(--panel);
    }

    @media (max-width: 1250px) {
        .table {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .table > :global(.timeline),
        .table > :global(.console) {
            grid-column: 1 / -1;
            grid-row: auto;
        }

        .table > :global(.console) {
            height: 24rem;
        }
    }

    @media (max-width: 700px) {
        .lead {
            flex-direction: column;
            align-items: flex-start;
        }

        .controls {
            align-items: flex-start;
            text-align: left;
        }

        .top h1 {
            margin: 0 0 0.5rem;
            font-size: clamp(2.5rem, 13vw, 3.5rem);
        }

        .table {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    :global(html:has(.simple-page)),
    :global(body:has(.simple-page)) {
        background: #f5f3ed;
    }

    :global(body:has(.simple-page)) {
        color: #171511;
    }

    .simple-page {
        --fg: #171511;
        --muted: #626158;
        --line: #cbc8be;
        --panel: #fbfaf6;
        --well: #efece3;
        --accent: #8a1a8a;
        --bad: #a3261b;
        --node-0: #1a5fa3;
        --node-1: #8a1a8a;
        --check: #11805d;
        --fold: #b8381f;
        --raise: #a36400;
        --glow-a: 35%;
        /* A shadow that draws nothing, so the glow can still be listed after it. */
        --lift: 0 0 #0000;
        --win-bright: 1.03;
        --lose-dim: 0.88;
        min-height: 100vh;
        background: #f5f3ed;
        color: var(--fg);
        font-family: 'Mozilla Text', sans-serif;
        font-size: 1rem;
        line-height: 1.65;
    }

    .simple-page h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(2.75rem, 7vw, 4.5rem);
        line-height: 1.05;
    }

    /* Simple: a plain chip. No glow or motion; focus gets a plain outline. */
    .simple-page .dealer,
    .simple-page .puck,
    .simple-page .chip circle,
    .simple-page .word {
        transition: none;
    }

    .simple-page .dealer.live:active {
        transform: none;
    }

    .simple-page .puck,
    .simple-page .dealer.live:hover .puck,
    .simple-page .dealer:focus-visible .puck {
        box-shadow: none;
    }

    .simple-page .dealer.live:hover .word,
    .simple-page .dealer:focus-visible .word {
        text-shadow: none;
    }

    .simple-page .dealer:focus-visible .puck {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .simple-page main {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
        padding: 3.5rem 0 5rem;
    }

    .simple-page .table {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .simple-page .table > :global(.timeline),
    .simple-page .table > :global(.console) {
        grid-column: 1 / -1;
        grid-row: auto;
    }

    .simple-page .table > :global(.console) {
        height: 24rem;
    }

    @media (max-width: 700px) {
        .simple-page .table {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
