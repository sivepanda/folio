<script>
    import { STREETS } from './engine.js';
    import NodeLog from './NodeLog.svelte';

    /** @typedef {import('./engine.js').Engine} Engine */
    /** @typedef {import('./engine.js').View} View */
    /** @typedef {import('./engine.js').ActionKind} ActionKind */
    /** @typedef {{ winners: number[], hand: string, uncontested: boolean }} Result */

    // Flop, flop, flop, turn, river: empty slots show until each card is revealed.
    const BOARD_SLOTS = [0, 1, 2, 3, 4];
    // How many board cards a street is played with: none before the flop, then 3, 4, 5.
    const BOARD_BY_STREET = [0, 3, 4, 5];

    /**
     * One player's frontend. Everything it shows comes from its own node's view, and its buttons
     * only ever ask that node to act.
     * @type {{
     *   engine: Engine, view: View | null, result: Result | null, dealing: boolean,
     *   confirmed: number, selected: number | null,
     *   onact: (kind: ActionKind, amount?: number) => string | null,
     *   onpick: (round: number) => void
     * }} `confirmed` is the last round this node has committed; `selected` is the round the
     *   timeline is showing
     */
    let { engine, view, result, dealing, confirmed, selected, onact, onpick } = $props();

    let seat = $derived(view?.seat ?? -1);
    let seated = $derived(!!view && seat >= 0 && view.stacks.length > seat);
    let dealt = $derived(view?.hole.length === 2);

    let hole = $derived(view ? engine.describe(view.hole) : []);
    let board = $derived(view ? engine.describe(view.community) : []);
    let hand = $derived(view && dealt ? engine.evaluate([...view.hole, ...view.community]) : null);

    // The log moves to the next street the moment the last bet lands, but the nodes still have
    // to decrypt that street's cards between them. Until this node has them, nobody acts: the
    // engine would accept the move, and it would be made without seeing the board.
    let revealed = $derived(
        !!view && view.community.length >= (BOARD_BY_STREET[view.street] ?? BOARD_SLOTS.length)
    );
    let myTurn = $derived(
        !!view && seated && dealt && revealed && !view.handOver && view.nextSeat === seat
    );
    let stack = $derived(view && seated ? view.stacks[seat] : 0);
    let committed = $derived(view && seated ? view.contributions[seat] : 0);
    let owed = $derived(view ? Math.max(0, view.currentBet - committed) : 0);
    // A raise names the new total bet for the street, not the amount added.
    let minRaise = $derived((view?.currentBet ?? 0) + 1);
    let maxRaise = $derived(committed + stack);
    let canRaise = $derived(myTurn && maxRaise >= minRaise);

    // The raise box follows a suggestion until it's edited, and an edit only lasts the round.
    let edit = $state({ round: -1, value: 0 });
    let suggested = $derived(
        Math.min(maxRaise, Math.max((view?.currentBet ?? 0) * 2, (view?.currentBet ?? 0) + 100))
    );
    let raiseTo = $derived(edit.round === view?.round ? edit.value : suggested);

    // Why the node refused the last action, until the hand moves on.
    let refusal = $state({ round: -1, text: '' });
    let refused = $derived(refusal.round === view?.round ? refusal.text : '');

    // What this node concluded once the hand ended.
    let outcome = $derived.by(() => {
        if (!result) return null;
        const won = result.winners.includes(seat);
        if (result.uncontested) return won ? 'Won, the other seat folded' : 'Folded';
        if (won && result.winners.length > 1) return `Split pot with ${result.hand}`;
        return won ? `Won with ${result.hand}` : `Lost to ${result.hand}`;
    });

    let status = $derived.by(() => {
        if (!view || !dealt) return dealing ? 'Shuffling and dealing' : 'Waiting for the deal';
        if (view.handOver) return outcome ?? 'Settling the hand';
        if (!revealed) return `Revealing the ${STREETS[view.street].toLowerCase()}`;
        return myTurn ? 'Your turn' : `Waiting for seat ${view.nextSeat}`;
    });

    /** @param {ActionKind} kind @param {number} [amount] */
    function act(kind, amount) {
        const error = onact(kind, amount);
        refusal = { round: view?.round ?? -1, text: error ?? '' };
    }
</script>

{#snippet card(/** @type {import('./engine.js').CardInfo | undefined} */ c)}
    {#if c}
        <span
            class="card"
            class:red={c.suit === '♥' || c.suit === '♦'}
            title={`${c.rankName} of ${c.suitName}`}
        >
            {c.rank}<span class="suit">{c.suit}</span>
        </span>
    {:else}
        <span class="card back" aria-label="Hidden card"></span>
    {/if}
{/snippet}

<section class="client" class:turn={myTurn} aria-label={view ? `Client ${view.nodeId}` : 'Client'}>
    <header>
        <h2>{view?.nodeId ?? 'node'}</h2>
        {#if seat >= 0}<span class="seat">seat {seat}</span>{/if}
        <span class="status" class:live={myTurn} aria-live="polite">{status}</span>
    </header>

    <div class="cards">
        <div>
            <span class="label">Hand</span>
            <div class="row">{@render card(hole[0])}{@render card(hole[1])}</div>
        </div>
        <div>
            <span class="label">Board</span>
            <div class="row">
                {#each BOARD_SLOTS as slot}{@render card(board[slot])}{/each}
            </div>
        </div>
    </div>

    <p class="made">{hand?.description ?? (dealt ? STREETS[view?.street ?? 0] : ' ')}</p>

    <dl>
        <div>
            <dt>Stack</dt>
            <dd>{seated ? stack : '–'}</dd>
        </div>
        <div>
            <dt>Bet</dt>
            <dd>{seated ? committed : '–'}</dd>
        </div>
        <div>
            <dt>To call</dt>
            <dd>{seated ? owed : '–'}</dd>
        </div>
        <div>
            <dt>Pot</dt>
            <dd>{seated ? view?.pot : '–'}</dd>
        </div>
    </dl>

    <div class="actions">
        <button type="button" disabled={!myTurn} onclick={() => act('fold')}>Fold</button>
        {#if owed > 0}
            <button type="button" disabled={!myTurn} onclick={() => act('call')}>
                Call {Math.min(owed, stack)}
            </button>
        {:else}
            <button type="button" disabled={!myTurn} onclick={() => act('check')}>Check</button>
        {/if}
        <span class="raise">
            <button type="button" disabled={!canRaise} onclick={() => act('raise', raiseTo)}>
                Raise to
            </button>
            <input
                type="number"
                aria-label="Raise to"
                min={minRaise}
                max={maxRaise}
                step="50"
                disabled={!canRaise}
                value={raiseTo}
                oninput={(e) =>
                    (edit = { round: view?.round ?? -1, value: Number(e.currentTarget.value) })}
            />
        </span>
    </div>

    <p class="refused" role="alert">{refused || ' '}</p>

    <NodeLog
        roster={view?.roster ?? []}
        entries={view?.entries ?? []}
        hash={view?.logHash ?? ''}
        {confirmed}
        {selected}
        {onpick}
    />
</section>

<style>
    .client {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        min-width: 0;
        padding: 1.25rem 1.4rem;
        border: 1px solid var(--line);
        border-radius: 1rem;
        background: var(--panel);
        color: var(--fg);
        transition: border-color 200ms ease;
    }

    .client.turn {
        border-color: var(--accent);
    }

    header {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
        flex-wrap: wrap;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .seat,
    .label,
    dt {
        color: var(--muted);
        font-size: 0.8rem;
    }

    .status {
        margin-left: auto;
        color: var(--muted);
        font-size: 0.9rem;
        text-align: right;
    }

    .status.live {
        color: var(--accent);
    }

    .cards {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem 1.4rem;
    }

    .row {
        display: flex;
        gap: 0.3rem;
        margin-top: 0.3rem;
    }

    .card {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.3rem;
        height: 3.1rem;
        border: 1px solid var(--line);
        border-radius: 0.35rem;
        background: #fff;
        color: #171511;
        font-family: 'Mozilla Headline', serif;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1;
    }

    .card.red {
        color: #b3261e;
    }

    .suit {
        margin-left: 0.05em;
        font-size: 0.9em;
    }

    .card.back {
        border-style: dashed;
        background: transparent;
    }

    .made {
        min-height: 1.5em;
        margin: 0;
        font-weight: 400;
    }

    dl {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5rem;
        margin: 0;
    }

    dt {
        white-space: nowrap;
    }

    dd {
        margin: 0.1rem 0 0;
        font-variant-numeric: tabular-nums;
    }

    /* Fold and check/call share a row and the raise gets its own, so the pane keeps its
       height whichever buttons a turn offers. */
    .actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
    }

    .raise {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
    }

    button,
    input {
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--fg);
        font: inherit;
        font-size: 0.9rem;
    }

    button {
        padding: 0.45rem 0.85rem;
        cursor: pointer;
    }

    button:hover:not(:disabled),
    button:focus-visible {
        border-color: var(--fg);
    }

    input {
        width: 100%;
        padding: 0.45rem 0.6rem;
        font-variant-numeric: tabular-nums;
    }

    button:disabled,
    input:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .refused {
        min-height: 1.4em;
        margin: 0;
        color: var(--bad);
        font-size: 0.85rem;
    }
</style>
