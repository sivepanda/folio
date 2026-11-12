<script>
    import Load from '../../components/Load.svelte';
    import Footer from '../../components/Footer.svelte';
    import SimpleHeader from '../../components/SimpleHeader.svelte';
    import Client from '$lib/p2poker/Client.svelte';
    import Console from '$lib/p2poker/Console.svelte';
    import Timeline from '$lib/p2poker/Timeline.svelte';
    import { loadEngine } from '$lib/p2poker/engine.js';
    import { buildRounds } from '$lib/p2poker/rounds.js';
    import { getContext, onMount } from 'svelte';

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

<svelte:head>
    <title>P2Poker | Siven Panda</title>
    <meta
        name="description"
        content="Play both seats of a peer-to-peer poker hand. Two real nodes run in this tab and shuffle, deal, and sign every move with no server in between."
    />
</svelte:head>

{#snippet demo()}
    <div class="controls">
        <button
            type="button"
            class="deal"
            disabled={phase === 'loading' || phase === 'playing' || phase === 'failed'}
            onclick={deal}
        >
            {label}
        </button>
        {#if phase === 'failed'}
            <p class="failure" role="alert">The poker engine didn't start: {failure}</p>
        {/if}
    </div>

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
            <h1>P2Poker</h1>
            {@render demo()}
        </main>
    </div>
{:else}
    <Load />
    <div class="top sect p2p">
        <h1>P2Poker</h1>
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
        --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
    }

    .top {
        width: 100%;
        min-height: 100vh;
        margin-top: 60px;
        padding: clamp(1.5rem, 5vw, 4rem) clamp(1rem, 5vw, 5rem) 5vh;
    }

    .top h1 {
        font-size: 5vh;
        text-align: center;
    }

    .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        margin: 3vh 0 4vh;
    }

    .deal {
        padding: 0.7rem 1.6rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--panel);
        color: var(--fg);
        font: inherit;
        cursor: pointer;
        transition: border-color 180ms ease;
    }

    .deal:hover:not(:disabled),
    .deal:focus-visible {
        border-color: var(--fg);
    }

    .deal:disabled {
        color: var(--muted);
        cursor: default;
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
        .top h1 {
            margin: 0;
            font-size: clamp(2rem, 10vw, 2.75rem);
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
        min-height: 100vh;
        background: #f5f3ed;
        color: var(--fg);
        font-family: 'Mozilla Text', sans-serif;
        font-size: 1rem;
        line-height: 1.65;
    }

    .simple-page main {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
        padding: 3.5rem 0 5rem;
    }

    .simple-page .controls {
        align-items: flex-start;
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
