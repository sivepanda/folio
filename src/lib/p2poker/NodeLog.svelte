<script>
    import { tick } from 'svelte';

    /** @typedef {import('./engine.js').LogEntry} LogEntry */
    /** @typedef {import('./engine.js').RosterSeat} RosterSeat */

    /**
     * One node's own copy of the signed action log. Entry 0 is the roster: each seat's node and
     * public key, fixed when the game starts and covered by every signature after it. An action
     * entry is listed as soon as this node appends it, and stays marked unconfirmed until the
     * node has collected the other seats' receipts and committed the round; until then it can
     * still be rolled back.
     * @type {{
     *   roster: RosterSeat[], entries: LogEntry[], hash: string, confirmed: number,
     *   selected: number | null, onpick: (round: number) => void
     * }}
     */
    let { roster, entries, hash, confirmed, selected, onpick } = $props();

    /** @type {HTMLElement | undefined} */
    let list = $state();

    $effect(() => {
        entries.length;
        const el = list;
        if (!el) return;
        tick().then(() => {
            el.scrollTop = el.scrollHeight;
        });
    });

    /** @param {LogEntry} entry */
    const action = (entry) => (entry.kind === 'raise' ? `raise to ${entry.amount}` : entry.kind);
</script>

<div class="log">
    <div class="head">
        <span>Signed log</span>
        <span
            class="hash"
            title="SHA-256 over this node's whole log. Two nodes showing the same hash hold the same log."
        >
            {hash ? hash.slice(0, 12) : ''}
        </span>
    </div>

    <ol bind:this={list}>
        {#each roster as seat (seat.seat)}
            <li>
                <div
                    class="roster"
                    title="Entry 0, set at game start: seat {seat.seat} is {seat.nodeId}, and its signatures are checked against public key {seat.publicKey}. Every signature after this entry covers it, so it can't change."
                >
                    <span class="round">{seat.seat === 0 ? '#0' : ''}</span>
                    <span>seat {seat.seat}</span>
                    <span class="action">{seat.nodeId}</span>
                    <span class="sig">key {seat.publicKey.slice(0, 8)}</span>
                    <span class="state">fixed</span>
                </div>
            </li>
        {/each}
        {#each entries as entry (entry.round)}
            <li>
                <button
                    type="button"
                    class:pending={entry.round > confirmed}
                    aria-pressed={selected === entry.round}
                    title="Show how round {entry.round} was agreed"
                    onclick={() => onpick(entry.round)}
                >
                    <span class="round">#{entry.round}</span>
                    <span>seat {entry.seat}</span>
                    <span class="action">{action(entry)}</span>
                    {#if entry.coSigners?.length}
                        <span class="sig">co-signed by seat {entry.coSigners.join(', ')}</span>
                    {:else}
                        <span
                            class="sig"
                            title="Ed25519 signature over the log so far plus this action: {entry.signature}"
                        >
                            sig {entry.signature.slice(0, 8)}
                        </span>
                    {/if}
                    <span class="state"
                        >{entry.round > confirmed ? 'unconfirmed' : 'committed'}</span
                    >
                </button>
            </li>
        {/each}
        {#if roster.length === 0 && entries.length === 0}
            <li class="empty">No entries yet</li>
        {/if}
    </ol>
</div>

<style>
    .log {
        margin-top: auto;
        padding-top: 0.8rem;
        border-top: 1px solid var(--line);
        font-family: var(--mono);
        font-size: 0.72rem;
    }

    .head {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        color: var(--muted);
    }

    ol {
        height: 7.4rem;
        margin: 0.4rem 0 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
    }

    button,
    .roster {
        display: grid;
        grid-template-columns: 2.2em 3.6em minmax(0, 1fr) auto auto;
        gap: 0.6em;
        width: 100%;
        padding: 0.2rem 0.35rem;
    }

    button {
        border: 0;
        border-radius: 0.3rem;
        background: transparent;
        color: var(--fg);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible,
    button[aria-pressed='true'] {
        background: var(--line);
    }

    .round,
    .sig,
    .state {
        color: var(--muted);
    }

    .action {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    button.pending .state {
        color: var(--accent);
    }

    .empty {
        padding: 0.2rem 0.35rem;
        color: var(--muted);
    }
</style>
