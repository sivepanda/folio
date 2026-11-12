<script>
    /** @typedef {import('./rounds.js').Round} Round */
    /** @typedef {import('./rounds.js').Step} Step */

    /**
     * How one round got from a seat's action to an entry both nodes hold: a sequence diagram
     * with one lifeline per node, read top to bottom. Nodes never push anything to each other.
     * One hosts a file and the other polls for it, so each arrow is a fetch, pointing from the
     * node that hosted the file to the node that pulled it.
     * @type {{
     *   rounds: Round[], names: string[], selected: number | null,
     *   onpick: (round: number) => void
     * }}
     */
    let { rounds, names, selected, onpick } = $props();

    let round = $derived(rounds.find((r) => r.id === selected) ?? null);

    let summary = $derived.by(() => {
        if (!round) return '';
        const who = round.proposer === null ? 'A seat' : `Seat ${round.proposer}`;
        if (!round.action) return `Waiting for ${who.toLowerCase()} to act`;
        const done = round.commits >= names.length;
        return `${who} ${round.action} · ${done ? 'committed by every node' : 'in progress'}`;
    });

    /** @param {Step} step */
    function label(step) {
        const f = step.fields;
        const from = step.from === null ? (f.from ?? 'its peer') : names[step.from];
        const hash = f.log_hash ? f.log_hash.slice(0, 8) : '';
        switch (step.name) {
            case 'poll_proposal':
                return `polls ${from} for the proposal`;
            case 'host_proposal':
                return 'signs the action over its log and hosts the proposal';
            case 'fetch_proposal':
                return 'fetches the proposal';
            case 'verify_proposal':
                return 'checks round, turn, signature, and legality';
            case 'reject_proposal':
                return `finds the proposal invalid (${f.reason}) and stays silent`;
            case 'append':
                return `appends the entry, log now ${hash}`;
            case 'host_receipt':
                return `hosts a receipt signing log ${hash}`;
            case 'fetch_receipt':
                return `fetches ${from}'s receipt`;
            case 'verify_receipt':
                return 'checks its signature and that it signs the same log';
            case 'reject_receipt':
                return `finds ${from}'s receipt invalid (${f.reason}) and waits out the attempt`;
            case 'rollback':
                return `rolls the entry back (${f.reason})`;
            case 'commit':
                return 'commits the round';
            case 'timeout':
                return `gives up on attempt ${step.attempt} (${f.reason})`;
            case 'auto_fold':
                return `appends a fold for seat ${f.target_seat}, co-signed by the other seats`;
            default:
                return step.name;
        }
    }

    /** Time since the proposal went up; blank for whatever happened while waiting on the seat. */
    /** @param {Step} step */
    function when(step) {
        if (!round || round.hostedAt === null || step.time < round.hostedAt) return '';
        return `+${step.time - round.hostedAt} ms`;
    }
</script>

<section class="timeline" aria-label="Round timeline">
    <header>
        <div class="title">
            <h2>{round ? `Round ${round.id}` : 'Rounds'}</h2>
            <p>{summary}</p>
        </div>
        {#if rounds.length > 0}
            <div class="picker" role="group" aria-label="Round">
                {#each rounds as r (r.id)}
                    <button
                        type="button"
                        aria-pressed={r.id === selected}
                        aria-label="Round {r.id}"
                        onclick={() => onpick(r.id)}
                    >
                        {r.id}
                    </button>
                {/each}
            </div>
        {/if}
    </header>

    {#if round}
        <div class="row names" aria-hidden="true">
            <span class="c0">{names[0]}</span>
            <span></span>
            <span class="c1">{names[1]}</span>
        </div>
        <ol>
            {#each round.steps as step}
                <li class="row c{step.client}" class:fetch={step.from !== null}>
                    <div class="say">
                        {#if step.client === 0}
                            <span class="sr">{names[0]}</span>
                            {label(step)}
                            <span class="when">{when(step)}</span>
                        {/if}
                    </div>
                    <div class="track" aria-hidden="true">
                        {#if step.from !== null}<span class="arrow"></span>{/if}
                        <span class="dot"></span>
                    </div>
                    <div class="say">
                        {#if step.client === 1}
                            <span class="sr">{names[1]}</span>
                            {label(step)}
                            <span class="when">{when(step)}</span>
                        {/if}
                    </div>
                </li>
            {/each}
        </ol>
    {:else}
        <p class="empty">
            Once a hand is dealt, this shows how the two nodes agree on each move: who hosts what,
            who fetches it, and when each one commits.
        </p>
    {/if}
</section>

<style>
    .timeline {
        min-width: 0;
        padding: 1.25rem 1.4rem;
        border: 1px solid var(--line);
        border-radius: 1rem;
        background: var(--panel);
        color: var(--fg);
    }

    header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem 1.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .title p {
        min-height: 1.5em;
        margin: 0.2rem 0 0;
        color: var(--muted);
        font-size: 0.9rem;
        font-weight: 300;
    }

    .picker {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
    }

    button {
        min-width: 1.9rem;
        padding: 0.2rem 0.45rem;
        border: 1px solid var(--line);
        border-radius: 0.4rem;
        background: transparent;
        color: var(--muted);
        font-family: var(--mono);
        font-size: 0.75rem;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible,
    button[aria-pressed='true'] {
        border-color: var(--fg);
        color: var(--fg);
    }

    /* Tall enough for a whole round, so the page doesn't jump while a round fills in. */
    ol {
        min-height: 22rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* Left: what the first node did. Middle: the two lifelines. Right: the second node. */
    .row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(4rem, 26%, 13rem) minmax(0, 1fr);
        column-gap: 0.9rem;
    }

    .names {
        font-family: var(--mono);
        font-size: 0.8rem;
        padding-bottom: 0.4rem;
    }

    .names .c0 {
        color: var(--node-0);
        text-align: right;
    }

    .names .c1 {
        color: var(--node-1);
    }

    .say {
        padding: 0.3rem 0 0.55rem;
        font-size: 0.85rem;
        line-height: 1.35;
    }

    .say:first-child {
        text-align: right;
    }

    .when {
        margin-left: 0.3em;
        color: var(--muted);
        font-family: var(--mono);
        font-size: 0.7rem;
    }

    /* The lifelines are the track's side borders, so they join up from one row to the next. */
    .track {
        position: relative;
        border-left: 2px solid var(--node-0);
        border-right: 2px solid var(--node-1);
    }

    .dot,
    .arrow,
    .arrow::after {
        position: absolute;
    }

    .dot {
        top: 0.5rem;
        width: 0.6rem;
        height: 0.6rem;
        border-radius: 50%;
    }

    .c0 .dot {
        left: calc(-0.3rem - 1px);
        background: var(--node-0);
    }

    .c1 .dot {
        right: calc(-0.3rem - 1px);
        background: var(--node-1);
    }

    /* A fetch: a line from the lifeline that hosted the file to the node that pulled it. */
    .arrow {
        top: calc(0.8rem - 1px);
        left: 0;
        right: 0;
        height: 2px;
    }

    .arrow::after {
        top: -0.25rem;
        border: 0.3rem solid transparent;
        content: '';
    }

    .c1 .arrow {
        right: 0.55rem;
        background: var(--node-0);
    }

    .c1 .arrow::after {
        right: -0.3rem;
        border-left-color: var(--node-0);
        border-right-width: 0;
    }

    .c0 .arrow {
        left: 0.55rem;
        background: var(--node-1);
    }

    .c0 .arrow::after {
        left: -0.3rem;
        border-right-color: var(--node-1);
        border-left-width: 0;
    }

    @media (max-width: 700px) {
        .row {
            grid-template-columns: minmax(0, 1fr) 3rem minmax(0, 1fr);
            column-gap: 0.6rem;
        }

        .say {
            font-size: 0.78rem;
        }
    }

    .empty {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
    }

    .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
</style>
