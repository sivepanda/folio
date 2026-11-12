import ogCards from '$lib/og-cards.json';

/**
 * Fills the link-preview placeholders in app.html. Each page render picks a random
 * gallery card, so every shared link gets a different photo. Crawlers (iMessage,
 * Slack, Discord, X) only read server-rendered HTML and need absolute URLs.
 *
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
    const card = ogCards[Math.floor(Math.random() * ogCards.length)];
    const image = `${event.url.origin}/og/${card}`;
    const url = `${event.url.origin}${event.url.pathname}`;

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            html.replaceAll('%og.image%', image).replaceAll('%og.url%', url)
    });
}
