/**
 * JS handle on P2Poker, compiled to WebAssembly.
 *
 * p2poker.wasm / wasm_exec.js are build output from the p2poker repo (`make wasm`), which
 * compiles the Go engine unchanged plus a thin JS binding (`cmd/web`). The module runs a whole
 * table in this tab: a dispatch server and one node per client, meshed over Go's in-memory
 * loopback network. Every node shuffles, deals, signs, and verifies exactly as it would on its
 * own machine; nothing here decides anything about the game. JS only asks each node what it
 * knows and renders that.
 *
 * Don't edit p2poker.wasm or wasm_exec.js by hand; rebuild them and copy them over.
 */
import wasmUrl from './p2poker.wasm?url';

export { wasmUrl };

/**
 * @typedef {'fold' | 'check' | 'call' | 'raise'} ActionKind
 *
 * @typedef {{
 *   round: number, seat: number, kind: ActionKind, amount: number,
 *   signature: string, coSigners?: number[]
 * }} LogEntry one committed entry of the signed action log
 *
 * @typedef {{ seat: number, nodeId: string, publicKey: string }} RosterSeat one seat in log
 *   entry 0: the node sitting there and the public key its signatures are checked against
 *
 * @typedef {{
 *   nodeId: string, seat: number, order: string[], started: boolean,
 *   hole: string[], community: string[],
 *   round: number, nextSeat: number, street: number, handOver: boolean,
 *   pot: number, currentBet: number,
 *   stacks: number[], contributions: number[], folded: boolean[],
 *   roster: RosterSeat[], logHash: string, entries: LogEntry[]
 * }} View what one client's own node knows about the hand. `roster` is log entry 0, fixed
 *   when the game starts; `entries` are the actions after it, from round 1
 *
 * @typedef {{
 *   client: number, time: number, nodeId: string, kind: string, component: string,
 *   message: string, fields?: Record<string, string>, cards?: Record<string, string>
 * }} TableEvent one event emitted by one node
 *
 * @typedef {{
 *   wire: string, short: string, pretty: string, rank: string, suit: string,
 *   suitName: string, rankName: string
 * }} CardInfo a decoded card; `wire` is the deck-int string the nodes pass around
 *
 * @typedef {{ category: string, description: string, best: CardInfo[] }} Hand
 */

export const STREETS = ['Preflop', 'Flop', 'Turn', 'River', 'Showdown'];

/** @type {Promise<Engine> | null} */
let loading = null;

/**
 * Start the Go module. A page can only run one, so every caller shares it.
 * @returns {Promise<Engine>}
 */
export function loadEngine() {
    loading ??= boot().catch((error) => {
        loading = null;
        throw error;
    });
    return loading;
}

async function boot() {
    const scope = /** @type {any} */ (globalThis);

    await import('./wasm_exec.js');

    // The nodes narrate everything to stdout as well as to their event bus. The page already
    // shows the events, so drop stdout and keep stderr (where a Go panic would land).
    const fs = scope.fs;
    const writeSync = fs.writeSync.bind(fs);
    fs.writeSync = (/** @type {number} */ fd, /** @type {Uint8Array} */ buf) =>
        fd === 1 ? buf.length : writeSync(fd, buf);

    const go = new scope.Go();
    const ready = new Promise((resolve) => (scope.onP2PokerReady = resolve));

    const response = fetch(wasmUrl);
    const { instance } = await WebAssembly.instantiateStreaming(response, go.importObject).catch(
        // Some hosts serve .wasm without the application/wasm type streaming needs.
        async () =>
            WebAssembly.instantiate(await (await fetch(wasmUrl)).arrayBuffer(), go.importObject)
    );

    const engine = new Engine();
    // run() settles only when the Go program exits, which it never should.
    go.run(instance).then(() => {
        engine.alive = false;
        console.error('p2poker: the Go module exited');
    });
    await ready;
    delete scope.onP2PokerReady;

    engine.api = scope.p2poker;
    return engine;
}

export class Engine {
    /** @type {any} the `p2poker` global the Go module installs */
    api = null;
    alive = true;
    /** @type {Map<string, CardInfo>} */
    #cards = new Map();

    /**
     * Seat a fresh table, closing any previous one. Resolves once every node has registered
     * with dispatch, joined the session, and connected to its peers.
     * @param {{
     *   clients?: number, timeoutMs?: number, maxAttempts?: number,
     *   onEvent?: (event: TableEvent) => void
     * }} options
     * @returns {Promise<void>}
     */
    open({ clients = 2, timeoutMs, maxAttempts, onEvent } = {}) {
        return this.api.open({
            clients,
            timeoutMs,
            maxAttempts,
            // A throw in here would unwind into Go and kill the module.
            onEvent: (/** @type {string} */ json) => {
                try {
                    onEvent?.(JSON.parse(json));
                } catch (error) {
                    console.error(error);
                }
            }
        });
    }

    /**
     * Ask dispatch to start the game. The nodes take it from there.
     * @returns {Promise<void>}
     */
    start() {
        return this.api.start();
    }

    /**
     * Submit an action from one client's node, as that client's frontend would.
     * @param {number} client
     * @param {ActionKind} kind
     * @param {number} [amount] raise-to total; ignored for everything but a raise
     * @returns {string | null} why the node refused it, or null if it was accepted
     */
    act(client, kind, amount = 0) {
        return this.api.act(client, kind, amount);
    }

    /**
     * @param {number} client
     * @returns {View | null}
     */
    view(client) {
        const json = this.api.view(client);
        return json ? JSON.parse(json) : null;
    }

    /**
     * Decode deck-int wire strings with the engine's own card code.
     * @param {string[]} wire
     * @returns {CardInfo[]}
     */
    describe(wire) {
        const missing = wire.filter((w) => !this.#cards.has(w));
        if (missing.length > 0) {
            const json = this.api.describe(missing);
            /** @type {CardInfo[]} */
            const decoded = json ? JSON.parse(json) : [];
            decoded.forEach((card, i) => this.#cards.set(missing[i], card));
        }
        return wire.flatMap((w) => this.#cards.get(w) ?? []);
    }

    /**
     * Best five-card hand out of 5 to 7 cards, ranked by the engine's evaluator.
     * @param {string[]} wire
     * @returns {Hand | null}
     */
    evaluate(wire) {
        if (wire.length < 5) return null;
        const json = this.api.evaluate(wire);
        return json ? JSON.parse(json) : null;
    }

    close() {
        this.api.close();
    }
}
