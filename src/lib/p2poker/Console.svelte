<script>
    import { tick } from 'svelte';

    /** @typedef {import('./engine.js').Engine} Engine */
    /** @typedef {import('./engine.js').TableEvent} TableEvent */

    /**
     * Everything the nodes report while they play, in the order it happened.
     * @type {{ engine: Engine | null, events: TableEvent[], names: string[], since: number }}
     */
    let { engine, events, names, since } = $props();

    /** @type {number | null} null shows every node */
    let only = $state(null);
    let shown = $derived(only === null ? events : events.filter((e) => e.client === only));

    /** @type {HTMLElement | undefined} */
    let list = $state();
    // Follow new lines unless the reader has scrolled up to look at something.
    let following = true;

    $effect(() => {
        shown.length;
        if (!following || !list) return;
        const el = list;
        tick().then(() => {
            el.scrollTop = el.scrollHeight;
        });
    });

    function onscroll() {
        if (!list) return;
        following = list.scrollHeight - list.scrollTop - list.clientHeight < 24;
    }

    /** @param {string[]} wire */
    const pretty = (wire) =>
        (engine?.describe(wire) ?? []).map((c) => c.pretty).join(' ') || wire.join(' ');

    /**
     * The nodes name cards by deck index. Swap those for the card they stand for, and fold the
     * multi-line card summaries onto one line.
     * @param {TableEvent} event
     */
    function text(event) {
        const lines = event.message
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !/^-+$/.test(line));

        if (lines.length > 1 && event.cards) {
            const wire = Object.entries(event.cards)
                .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map(([, value]) => value);
            return `${lines[0]}: ${pretty(wire)}`;
        }

        let line = lines
            .join(' ')
            .replace(/card revealed: (\d+)/, (_, wire) => `card revealed: ${pretty([wire])}`);
        const f = event.fields;
        if (event.kind === 'attempt' && f?.action_kind) {
            const amount = Number(f.action_amount) > 0 ? ` ${f.action_amount}` : '';
            line += ` (seat ${f.seat} ${f.action_kind}${amount})`;
        }
        return line;
    }

    /** @param {number} ms */
    const clock = (ms) => `+${(Math.max(0, ms - since) / 1000).toFixed(2)}s`;
</script>

<section class="console" aria-label="Node event log">
    <header>
        <h2>Node log</h2>
        <div class="filter" role="group" aria-label="Show events from">
            <button type="button" aria-pressed={only === null} onclick={() => (only = null)}>
                all
            </button>
            {#each names as name, client}
                <button
                    type="button"
                    class="c{client}"
                    aria-pressed={only === client}
                    onclick={() => (only = client)}
                >
                    {name}
                </button>
            {/each}
        </div>
    </header>

    <div class="scroll">
        <ol bind:this={list} {onscroll}>
            {#each shown as event}
                <li class="c{event.client}">
                    <span class="time">{clock(event.time)}</span>
                    <span class="kind">{event.kind}</span>
                    <span class="message">{text(event)}</span>
                </li>
            {:else}
                <li class="empty">Deal a hand to see what each node does.</li>
            {/each}
        </ol>
    </div>
</section>

<style>
    .console {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 1rem;
        background: var(--well);
        color: var(--fg);
        overflow: hidden;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.9rem 1.1rem;
        border-bottom: 1px solid var(--line);
    }

    h2 {
        margin: 0;
        font-size: 1.05rem;
    }

    .filter {
        display: flex;
        gap: 0.3rem;
    }

    button {
        padding: 0.2rem 0.6rem;
        border: 1px solid transparent;
        border-radius: 999px;
        background: transparent;
        color: var(--muted);
        font-family: var(--mono);
        font-size: 0.75rem;
        cursor: pointer;
    }

    button[aria-pressed='true'] {
        border-color: var(--line);
        color: var(--fg);
    }

    button.c0[aria-pressed='true'] {
        color: var(--node-0);
    }

    button.c1[aria-pressed='true'] {
        color: var(--node-1);
    }

    /* The list is taken out of flow so a long log scrolls instead of stretching the row the
       console shares with the clients. */
    .scroll {
        position: relative;
        flex: 1;
        min-height: 18rem;
    }

    ol {
        position: absolute;
        inset: 0;
        margin: 0;
        padding: 0.6rem 0;
        overflow-y: auto;
        list-style: none;
        font-family: var(--mono);
        font-size: 0.75rem;
        line-height: 1.5;
    }

    li {
        display: grid;
        grid-template-columns: 4.2em 5.8em minmax(0, 1fr);
        gap: 0.6em;
        padding: 0.1rem 1.1rem 0.1rem calc(1.1rem - 2px);
        border-left: 2px solid transparent;
    }

    li.c0 {
        border-left-color: var(--node-0);
    }

    li.c1 {
        border-left-color: var(--node-1);
    }

    .time,
    .kind {
        color: var(--muted);
        white-space: nowrap;
    }

    .message {
        overflow-wrap: anywhere;
    }

    li.empty {
        display: block;
        color: var(--muted);
        font-family: 'Mozilla Text', sans-serif;
        font-size: 0.9rem;
    }
</style>
