/**
 * Turns the nodes' event stream into one record per round, for the round timeline.
 *
 * A round is one seat's action travelling from proposal to commit. The engine has no messages
 * for this: a node "sends" by hosting a file in its own store, and the other node polls for it.
 * So every arrow in the timeline is a fetch, drawn from the node hosting the file to the node
 * that pulled it.
 */

/** @typedef {import('./engine.js').TableEvent} TableEvent */

/**
 * @typedef {{
 *   client: number, name: string, time: number, attempt: number,
 *   from: number | null, fields: Record<string, string>
 * }} Step one thing one node did; `from` is the client whose hosted file it fetched
 *
 * @typedef {{
 *   id: number, proposer: number | null, action: string | null,
 *   steps: Step[], hostedAt: number | null, commits: number
 * }} Round `proposer` is a seat; `commits` counts the nodes that have committed the round
 */

/** What each fetch pulls, by the step that hosted it. */
const SOURCE = { fetch_proposal: 'host_proposal', fetch_receipt: 'host_receipt' };

/** @param {Record<string, string>} f */
function describe(f) {
    if (!f.action_kind) return null;
    const verbs = { fold: 'folds', check: 'checks', call: 'calls', raise: 'raises to' };
    const verb = verbs[/** @type {keyof typeof verbs} */ (f.action_kind)] ?? f.action_kind;
    return f.action_kind === 'raise' ? `${verb} ${f.action_amount}` : verb;
}

/**
 * @param {TableEvent[]} events
 * @param {string[]} names node id per client, to resolve who a file was fetched from
 * @returns {{ rounds: Round[], confirmed: number[] }} `confirmed[client]` is the last round that
 *   client has committed, or -1
 */
export function buildRounds(events, names) {
    /** @type {Map<number, Round>} */
    const byId = new Map();
    const confirmed = names.map(() => -1);

    /** @param {string} id */
    const round = (id) => {
        const n = Number(id);
        let r = byId.get(n);
        if (!r) {
            r = { id: n, proposer: null, action: null, steps: [], hostedAt: null, commits: 0 };
            byId.set(n, r);
        }
        return r;
    };

    for (const event of events) {
        const f = event.fields;
        if (!f?.round_id) continue;

        /** @type {string | null} */
        let name = null;
        if (event.kind === 'round' && f.proposer_seat) {
            round(f.round_id).proposer = Number(f.proposer_seat);
        } else if (event.kind === 'step') {
            name = f.step;
        } else if (event.kind === 'attempt' && f.outcome === 'committed') {
            name = 'commit';
        } else if (event.kind === 'attempt' && f.outcome === 'timeout') {
            name = 'timeout';
        } else if (event.kind === 'auto_fold' && f.target_seat) {
            name = 'auto_fold';
        }
        if (!name) continue;

        const r = round(f.round_id);
        // Only a fetch moves a file. A poll names its target too, but nothing has changed hands.
        const from = name in SOURCE && f.from ? names.indexOf(f.from) : -1;
        r.steps.push({
            client: event.client,
            name,
            time: event.time,
            attempt: Number(f.attempt ?? 0),
            from: from >= 0 ? from : null,
            fields: f
        });

        if (name === 'host_proposal') r.hostedAt = event.time;
        if (name === 'auto_fold') r.action = 'is folded for stalling';
        r.action ??= describe(f);
        if (name === 'commit' || name === 'auto_fold') {
            r.commits += 1;
            confirmed[event.client] = Math.max(confirmed[event.client], r.id);
        }
    }

    const rounds = [...byId.values()].sort((a, b) => a.id - b.id);
    for (const r of rounds) r.steps = inCausalOrder(r.steps);
    return { rounds, confirmed };
}

/**
 * Events from different nodes carry millisecond timestamps and can tie or arrive slightly out
 * of step. A file can't be fetched before it was hosted, so pull any fetch that sorted ahead of
 * its source back to just after it.
 * @param {Step[]} steps
 */
function inCausalOrder(steps) {
    const sorted = steps
        .map((step, i) => ({ step, i }))
        .sort((a, b) => a.step.time - b.step.time || a.i - b.i);
    const ordered = sorted.map(({ step }) => step);

    for (let i = 0; i < ordered.length; i++) {
        const fetch = ordered[i];
        const source = SOURCE[/** @type {keyof typeof SOURCE} */ (fetch.name)];
        if (!source || fetch.from === null) continue;
        const hostedAt = ordered.findIndex(
            (s) => s.name === source && s.client === fetch.from && s.attempt === fetch.attempt
        );
        if (hostedAt > i) {
            ordered.splice(hostedAt + 1, 0, fetch);
            ordered.splice(i, 1);
            i--;
        }
    }
    return ordered;
}
