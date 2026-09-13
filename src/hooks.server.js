const AI_CRAWLER =
    /(?:Amazonbot|anthropic-ai|Applebot-Extended|Bytespider|CCBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|cohere-ai|Diffbot|DuckAssistBot|FacebookBot|Google-Extended|GPTBot|ImagesiftBot|meta-externalagent|meta-externalfetcher|OAI-SearchBot|omgili|PanguBot|PerplexityBot|Perplexity-User|PetalBot|Timpibot|YouBot)/i;

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const userAgent = event.request.headers.get('user-agent') ?? '';

    if (AI_CRAWLER.test(userAgent)) {
        return new Response('Forbidden', {
            status: 403,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex, noai, noimageai'
            }
        });
    }

    const response = await resolve(event);
    response.headers.set('Content-Signal', 'search=yes, ai-input=no, ai-train=no');
    response.headers.set('X-Robots-Tag', 'noimageindex, noai, noimageai');
    return response;
}
