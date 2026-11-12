<script>
    import { getContext, tick } from 'svelte';
    import { cubicOut } from 'svelte/easing';
    import { Tween } from 'svelte/motion';
    import { MediaQuery } from 'svelte/reactivity';
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

    // The simple (light) view is the fast, quiet one, and so is any system that asks for less
    // motion: everything lands in its end state without animating there.
    const viewMode = getContext('view-mode');
    const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
    let simple = $derived(!!viewMode?.simpleMode);
    let calm = $derived(simple || reducedMotion.current);

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

    // Raising takes two clicks: the first picks Raise and brings down the box for the amount, the
    // second sends it. A pick only lasts the round, so it clears once any move lands.
    let pick = $state({ round: -1 });
    let picking = $derived(canRaise && pick.round === view?.round);
    /** @type {HTMLInputElement | undefined} */
    let raiseBox = $state();

    // Check turns into Call the moment this seat owes chips, and the tray under the moves shows
    // what that costs where the raise box goes. The tray only comes out on this seat's turn, and
    // only when it has an amount to show: a call owed, or a raise being picked.
    let mustCall = $derived(owed > 0);
    let callAmount = $derived(Math.min(owed, stack));
    let tray = $derived(myTurn && (mustCall || picking));

    // Chip counts run up or down to each new value instead of jumping, once a hand is under way.
    // Seating a table just shows its numbers.
    /** @param {() => number} get */
    function counter(get) {
        const tween = new Tween(get(), { easing: cubicOut });
        $effect.pre(() => {
            tween.set(get(), { duration: dealt && !calm ? 520 : 0 });
        });
        return {
            get value() {
                return Math.round(tween.current);
            }
        };
    }
    const shown = {
        stack: counter(() => stack),
        bet: counter(() => committed),
        owed: counter(() => owed),
        pot: counter(() => view?.pot ?? 0),
        call: counter(() => callAmount)
    };

    // Why the node refused the last action, until the hand moves on.
    let refusal = $state({ round: -1, text: '' });
    let refused = $derived(refusal.round === view?.round ? refusal.text : '');

    // Once the hand is settled, the winning seat's panel steps forward and the losing one falls
    // back. A split pot has two winners.
    let settled = $derived(!!result && !!view?.handOver);
    let won = $derived(settled && !!result?.winners.includes(seat));
    let lost = $derived(settled && !won);

    // What this node concluded once the hand ended.
    let outcome = $derived.by(() => {
        if (!result) return null;
        const won = result.winners.includes(seat);
        if (result.uncontested) return won ? 'Won, the other seat folded' : 'Folded';
        if (won && result.winners.length > 1) return `Split pot with ${result.hand}`;
        return won ? `Won with ${result.hand}` : `Lost to ${result.hand}`;
    });

    // What this seat holds so far, or the street until five cards make a hand.
    let made = $derived(hand?.description ?? (dealt ? STREETS[view?.street ?? 0] : ' '));

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

    async function raise() {
        if (picking) return act('raise', raiseTo);
        pick = { round: view?.round ?? -1 };
        await tick();
        raiseBox?.focus();
        raiseBox?.select();
    }

    /**
     * Turns a card face-up: it swings in from edge-on, the way a card flips over on the felt.
     * @param {Element} _node
     * @param {{ delay?: number }} params
     */
    function turnUp(_node, { delay = 0 }) {
        if (calm) return { duration: 0 };
        return {
            delay,
            duration: 460,
            easing: cubicOut,
            css: (/** @type {number} */ t, /** @type {number} */ u) =>
                `transform: perspective(480px) rotateY(${u * 90}deg) scale(${0.9 + 0.1 * t}); opacity: ${Math.min(1, t * 4)}`
        };
    }

    /**
     * Rolls a move's label through its slot: the new word comes up from below as the old one
     * leaves through the top.
     * @param {Element} _node
     * @param {{ dir: 1 | -1 }} params 1 enters from below, -1 leaves upward
     */
    function roll(_node, { dir }) {
        if (calm) return { duration: 0 };
        return {
            duration: 260,
            easing: cubicOut,
            css: (/** @type {number} */ t, /** @type {number} */ u) =>
                `transform: translateY(${dir * u * 75}%); opacity: ${t}; filter: blur(${u * 1.5}px)`
        };
    }
</script>

{#snippet card(
    /** @type {import('./engine.js').CardInfo | undefined} */ c,
    /** @type {number} */ delay = 0
)}
    {#if c}
        <span
            class="card"
            class:red={c.suit === '♥' || c.suit === '♦'}
            title={`${c.rankName} of ${c.suitName}`}
            in:turnUp={{ delay }}
        >
            {c.rank}<span class="suit">{c.suit}</span>
        </span>
    {:else}
        <span class="card back" aria-label="Hidden card"></span>
    {/if}
{/snippet}

<section
    class="client"
    class:turn={myTurn}
    class:won
    class:lost
    class:calm
    class:simple
    aria-label={view ? `Client ${view.nodeId}` : 'Client'}
>
    <header>
        <h2>{view?.nodeId ?? 'node'}</h2>
        {#if seat >= 0}<span class="seat">seat {seat}</span>{/if}
        <span class="status swap" class:live={myTurn} aria-live="polite">
            {#key status}
                <span in:roll={{ dir: 1 }} out:roll={{ dir: -1 }}>{status}</span>
            {/key}
        </span>
    </header>

    <div class="cards">
        <div>
            <span class="label">Hand</span>
            <div class="row">{@render card(hole[0])}{@render card(hole[1], 120)}</div>
        </div>
        <div>
            <span class="label">Board</span>
            <div class="row">
                <!-- The flop's three cards turn one after another; the turn and river alone. -->
                {#each BOARD_SLOTS as slot}{@render card(
                        board[slot],
                        slot < 3 ? slot * 120 : 0
                    )}{/each}
            </div>
        </div>
    </div>

    <p class="made swap">
        {#key made}
            <span in:roll={{ dir: 1 }} out:roll={{ dir: -1 }}>{made}</span>
        {/key}
    </p>

    <dl>
        <div>
            <dt>Stack</dt>
            <dd>{seated ? shown.stack.value : '–'}</dd>
        </div>
        <div>
            <dt>Bet</dt>
            <dd>{seated ? shown.bet.value : '–'}</dd>
        </div>
        <div>
            <dt>To call</dt>
            <dd>{seated ? shown.owed.value : '–'}</dd>
        </div>
        <div>
            <dt>Pot</dt>
            <dd>{seated ? shown.pot.value : '–'}</dd>
        </div>
    </dl>

    <div class="moves" class:open={tray}>
        <div class="bar" class:live={myTurn} class:picking role="group" aria-label="Moves">
            <span class="thumb" aria-hidden="true"></span>
            <button
                type="button"
                class="move check"
                disabled={!myTurn}
                aria-label={mustCall ? `Call ${callAmount}` : 'Check'}
                onclick={() => act(mustCall ? 'call' : 'check')}
            >
                <span class="word" aria-hidden="true">
                    <span class="sizer">Check</span>
                    {#key mustCall}
                        <span in:roll={{ dir: 1 }} out:roll={{ dir: -1 }}>
                            {mustCall ? 'Call' : 'Check'}
                        </span>
                    {/key}
                </span>
            </button>
            <button type="button" class="move fold" disabled={!myTurn} onclick={() => act('fold')}>
                Fold
            </button>
            <button
                type="button"
                class="move raise"
                disabled={!canRaise}
                aria-expanded={picking}
                aria-label={picking ? `Send raise to ${raiseTo}` : 'Raise'}
                onclick={raise}
            >
                <!-- Once the amount box is out, the same button sends it. -->
                <span class="word" aria-hidden="true">
                    <span class="sizer">Send raise</span>
                    {#key picking}
                        <span in:roll={{ dir: 1 }} out:roll={{ dir: -1 }}>
                            {picking ? 'Send raise' : 'Raise'}
                        </span>
                    {/key}
                </span>
            </button>
        </div>

        <!-- Always takes its height, so opening the tray never moves anything around it. -->
        <div class="tray-well" inert={!tray}>
            <div class="tray" class:open={tray}>
                <label class="amount check" class:shown={tray && mustCall}>
                    <span>To call</span>
                    <input class="chips" type="number" readonly value={shown.call.value} />
                </label>
                <label class="amount raise" class:shown={tray && picking}>
                    <span>Raise to</span>
                    <input
                        bind:this={raiseBox}
                        class="chips"
                        type="number"
                        min={minRaise}
                        max={maxRaise}
                        step="50"
                        disabled={!canRaise}
                        value={raiseTo}
                        oninput={(e) =>
                            (edit = {
                                round: view?.round ?? -1,
                                value: Number(e.currentTarget.value)
                            })}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' && picking) act('raise', raiseTo);
                            if (e.key === 'Escape') pick = { round: -1 };
                        }}
                    />
                </label>
            </div>
        </div>
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
        transition:
            border-color 200ms ease,
            box-shadow 320ms ease,
            transform 600ms ease,
            filter 600ms ease;
    }

    /* The winner eases out into a slightly larger, brighter panel; the loser eases in to a
       slightly smaller, dimmer one. Each transition takes its timing from the state it enters. */
    .client.won {
        transform: scale(1.025);
        filter: brightness(var(--win-bright));
        transition-timing-function:
            ease, ease, cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1);
    }

    .client.lost {
        transform: scale(0.97);
        filter: brightness(var(--lose-dim));
        transition-duration: 200ms, 320ms, 450ms, 450ms;
        transition-timing-function:
            ease, ease, cubic-bezier(0.5, 0, 0.75, 0), cubic-bezier(0.5, 0, 0.75, 0);
    }

    /* Calm: no motion at all, only end states. The winner and loser still read by brightness. */
    .client.calm,
    .client.calm :global(*),
    .client.calm :global(*::before),
    .client.calm :global(*::after) {
        transition: none !important;
    }

    .client.calm.won,
    .client.calm.lost {
        transform: none;
    }

    /* Simple: easy to read and fast, so no glow and no filters. Coloured borders still mark the
       seat to act, the move picked and the winner; the status line says who won. */
    .client.simple,
    .client.simple :global(*) {
        box-shadow: none !important;
        text-shadow: none !important;
    }

    .client.simple.won,
    .client.simple.lost {
        filter: none;
    }

    .client.simple.won {
        border-color: color-mix(in srgb, var(--accent) 70%, transparent);
    }

    .client.turn {
        border-color: color-mix(in srgb, var(--accent) 70%, transparent);
        box-shadow:
            0 0 32px -10px color-mix(in srgb, var(--accent) var(--glow-a), transparent),
            inset 0 0 28px -18px color-mix(in srgb, var(--accent) var(--glow-a), transparent);
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

    /* Text that rolls to its next value: the old and new lines share one cell while they pass. */
    .swap {
        display: inline-grid;
    }

    .swap > span {
        grid-area: 1 / 1;
    }

    .status.swap {
        justify-items: end;
    }

    .status.live {
        color: var(--accent);
        text-shadow: 0 0 10px color-mix(in srgb, var(--accent) var(--glow-a), transparent);
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

    /* The moves: one bar, Check/Call · Fold · Raise, with the tray of amounts tucked under it.
       Bar and tray share a three-column grid, gap and padding, so each amount sits right under
       the move it belongs to. */
    .moves {
        --pad: 0.3rem;
        /* How far the bar rises as the tray opens, so the two part from a midpoint. */
        --rise: 0.35rem;
        --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .bar,
    .tray {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--pad);
        padding-inline: var(--pad);
    }

    /* Glass like the rest of the site: faint fill, hairline border, soft lift. */
    .bar {
        position: relative;
        z-index: 1;
        padding-block: var(--pad);
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: var(--panel);
        box-shadow: var(--lift);
        /* Lets the labels size to the bar, so "Send raise" fits when two seats share a row. */
        container-type: inline-size;
        transition:
            transform 340ms var(--ease-out),
            border-color 200ms ease,
            box-shadow 260ms ease;
    }

    /* A faint sheen along the top edge. */
    .bar::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 8%;
        right: 8%;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--fg) 45%, transparent),
            transparent
        );
        pointer-events: none;
    }

    /* Only the bar's border glows, in the hue of the move in play: Raise while its amount is
       being picked, or whichever move is under the pointer or keyboard, which wins so the bar
       always previews what a click would do. */
    .bar.picking {
        --sel: var(--raise);
    }

    .bar:has(.check:is(:hover, :active):not(:disabled), .check:focus-visible) {
        --sel: var(--check);
    }

    .bar:has(.fold:is(:hover, :active):not(:disabled), .fold:focus-visible) {
        --sel: var(--fold);
    }

    .bar:has(.raise:is(:hover, :active):not(:disabled), .raise:focus-visible) {
        --sel: var(--raise);
    }

    .bar.picking,
    .bar:has(.move:is(:hover, :active):not(:disabled), .move:focus-visible) {
        border-color: color-mix(in srgb, var(--sel) 80%, transparent);
        box-shadow:
            var(--lift),
            0 0 22px -6px color-mix(in srgb, var(--sel) var(--glow-a), transparent),
            inset 0 0 14px -8px color-mix(in srgb, var(--sel) var(--glow-a), transparent);
    }

    /* A press flares the border brighter, fast in and easing back out as the move lands. */
    .bar:has(.move:active:not(:disabled)) {
        border-color: var(--sel);
        box-shadow:
            var(--lift),
            0 0 36px -4px color-mix(in srgb, var(--sel) var(--glow-a), transparent),
            0 0 10px -1px color-mix(in srgb, var(--sel) var(--glow-a), transparent),
            inset 0 0 20px -6px color-mix(in srgb, var(--sel) var(--glow-a), transparent);
        transition:
            transform 340ms var(--ease-out),
            border-color 60ms ease,
            box-shadow 80ms ease;
    }

    .move {
        --hue: var(--fg);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.3rem;
        border: 1px solid transparent;
        border-radius: 0.35rem;
        background: transparent;
        color: var(--fg);
        font: inherit;
        font-size: min(1rem, 4.8cqi);
        white-space: nowrap;
        cursor: pointer;
        transition:
            text-shadow 220ms ease,
            color 180ms ease,
            opacity 180ms ease;
    }

    .move.check {
        --hue: var(--check);
    }

    .move.fold {
        --hue: var(--fold);
    }

    /* The selector: a box that rests on Fold, the middle, and slides to whichever move is in play
       (hovered, focused, or Raise while its amount is picked). */
    .thumb {
        --at: 1;
        position: absolute;
        top: var(--pad);
        bottom: var(--pad);
        left: var(--pad);
        width: calc((100% - 4 * var(--pad)) / 3);
        border: 1px solid var(--line);
        border-radius: 0.35rem;
        background: var(--well);
        transform: translateX(calc(var(--at) * (100% + var(--pad))));
        transition:
            transform 300ms var(--ease-out),
            border-color 200ms ease,
            opacity 180ms ease;
        pointer-events: none;
    }

    .bar:not(.live) .thumb {
        opacity: 0.4;
    }

    .bar:has(.check:is(:hover, :active):not(:disabled), .check:focus-visible) .thumb {
        --at: 0;
    }

    .bar:has(.fold:is(:hover, :active):not(:disabled), .fold:focus-visible) .thumb {
        --at: 1;
    }

    .bar.picking .thumb,
    .bar:has(.raise:is(:hover, :active):not(:disabled), .raise:focus-visible) .thumb {
        --at: 2;
    }

    .bar.picking .thumb,
    .bar:has(.move:is(:hover, :active):not(:disabled), .move:focus-visible) .thumb {
        border-color: color-mix(in srgb, var(--sel) 50%, var(--line));
    }

    .move.raise {
        --hue: var(--raise);
    }

    .bar.live .move:not(:disabled) {
        text-shadow: 0 0 12px color-mix(in srgb, var(--hue) var(--glow-a), transparent);
    }

    .bar .move:hover:not(:disabled),
    .bar .move:focus-visible,
    .bar.picking .move.raise {
        text-shadow:
            0 0 10px color-mix(in srgb, var(--hue) var(--glow-a), transparent),
            0 0 2px color-mix(in srgb, var(--hue) var(--glow-a), transparent);
        color: color-mix(in srgb, var(--hue) 35%, var(--fg));
        outline: none;
    }

    .bar .move:active:not(:disabled) {
        text-shadow:
            0 0 16px var(--hue),
            0 0 4px var(--hue);
        transition-duration: 60ms;
    }

    .move:disabled {
        opacity: 0.4;
        cursor: default;
    }

    /* Both words share one cell, sized to the wider of the two, so the swap never shifts the
       label. */
    .word {
        display: inline-grid;
        overflow: hidden;
        /* Room for the text glow, which the slot would otherwise cut off. */
        padding: 0.45em 0.6em;
        margin: -0.45em -0.6em;
    }

    .word > span {
        grid-area: 1 / 1;
        text-align: center;
    }

    .word > .sizer {
        visibility: hidden;
    }

    /* The tray always holds its height and only its contents slide, so the panels on either side
       never change size mid-hand. */
    .tray-well {
        overflow: hidden;
        transition: transform 340ms var(--ease-out);
    }

    /* The bar and the tray's clip edge rise together, so the tray always comes out from right
       under the bar while it drops. */
    .moves.open .bar,
    .moves.open .tray-well {
        transform: translateY(calc(-1 * var(--rise)));
    }

    .tray {
        position: relative;
        isolation: isolate;
        padding-block: 0.5rem 0.65rem;
        /* Matches the bar's border so the columns line up to the pixel. */
        border-inline: 1px solid transparent;
        transform: translateY(-100%);
        opacity: 0;
        transition:
            transform 340ms var(--ease-out),
            opacity 240ms ease;
    }

    .tray.open {
        transform: none;
        opacity: 1;
    }

    /* The drawer itself, a little narrower than the bar so it reads as tucked under it. */
    .tray::before {
        content: '';
        position: absolute;
        inset: 0 0.5rem;
        z-index: -1;
        border: 1px solid var(--line);
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        background: var(--well);
    }

    /* Once the tray is down, each amount slides in from its own side: the call from the left,
       the raise from the right. Leaving, they go at once with the tray. */
    .amount {
        --hue: var(--fg);
        --from: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        justify-self: center;
        width: min(100% - 1.8rem, 7.5rem);
        opacity: 0;
        transform: translateX(var(--from));
        visibility: hidden;
        transition:
            opacity 160ms ease,
            transform 200ms var(--ease-out),
            visibility 0s 200ms;
    }

    .amount.shown {
        opacity: 1;
        transform: none;
        visibility: visible;
        transition:
            opacity 240ms ease 260ms,
            transform 360ms var(--ease-out) 260ms,
            visibility 0s;
    }

    .amount.check {
        --hue: var(--check);
        --from: -1.25rem;
        grid-column: 1;
    }

    .amount.raise {
        --hue: var(--raise);
        --from: 1.25rem;
        grid-column: 3;
    }

    .amount > span {
        color: var(--muted);
        font-size: 0.72rem;
        white-space: nowrap;
    }

    .chips {
        width: 100%;
        padding: 0.35rem 0.55rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--fg);
        font: inherit;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
        transition:
            border-color 180ms ease,
            box-shadow 220ms ease;
    }

    .chips:focus {
        border-color: color-mix(in srgb, var(--hue) 70%, transparent);
        box-shadow: 0 0 14px -4px color-mix(in srgb, var(--hue) var(--glow-a), transparent);
        outline: none;
    }

    /* The call box is the raise box, locked: same shape, dashed, no spinners. */
    .chips[readonly] {
        border-style: dashed;
        border-color: color-mix(in srgb, var(--hue) 45%, var(--line));
        color: color-mix(in srgb, var(--hue) 40%, var(--fg));
        cursor: default;
        appearance: textfield;
        -moz-appearance: textfield;
    }

    .chips[readonly]::-webkit-inner-spin-button,
    .chips[readonly]::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
    }

    .chips:disabled {
        opacity: 0.4;
    }

    .refused {
        min-height: 1.4em;
        margin: 0;
        color: var(--bad);
        font-size: 0.85rem;
    }
</style>
