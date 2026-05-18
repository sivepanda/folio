import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type PerfTier = 'high' | 'medium' | 'low';

function detectTier(): PerfTier {
    if (!browser) return 'high';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as any).deviceMemory ?? 8;
    if (cores <= 2 || mem <= 2) return 'low';
    if (cores <= 4 || mem <= 4) return 'medium';
    return 'high';
}

function getAnimPref(): boolean {
    if (!browser) return true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const v = localStorage.getItem('animationsEnabled');
    return v === null ? true : v === 'true';
}

export const perfTier = writable<PerfTier>(detectTier());
export const animationsEnabled = writable<boolean>(getAnimPref());

export function toggleAnimations(): void {
    animationsEnabled.update(v => {
        const next = !v;
        if (browser) localStorage.setItem('animationsEnabled', String(next));
        return next;
    });
}
