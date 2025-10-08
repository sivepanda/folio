import { dev } from '$app/environment';

export function optimize(src, widths = [640, 828, 1200, 1920], quality = 90) {
    if (dev) return src;

    return widths
        .slice()
        .sort((a, b) => a - b)
        .map((width) => {
            const url = `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
            return `${url} ${width}w`;
        })
        .join(', ');
}
