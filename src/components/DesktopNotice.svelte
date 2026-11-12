<!--
    A note for anyone who reaches a demo on a phone or tablet. The demos aren't linked on mobile,
    but their URLs still work. CSS alone decides when it shows, so desktop never renders it and no
    script runs. It reads the page's own colour tokens, so it fits both the full and simple views.
-->
<p class="desktop-notice" role="note">
    <i class="ri-computer-line" aria-hidden="true"></i>
    <span>
        <b>Best on desktop.</b> This demo runs here, but it's built for a big screen and a mouse.
    </span>
</p>

<style>
    .desktop-notice {
        display: none;
        align-items: flex-start;
        gap: 0.6rem;
        margin: 0 0 1.5rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid var(--line, rgba(255, 255, 255, 0.18));
        border-radius: 0.6rem;
        background: var(--panel, var(--glass, rgba(255, 255, 255, 0.05)));
        color: var(--muted, rgba(255, 255, 255, 0.7));
        font-size: 0.9rem;
        line-height: 1.45;
    }

    .desktop-notice b {
        color: var(--fg, #fff);
        font-weight: 600;
    }

    .desktop-notice i {
        color: var(--accent, currentColor);
        font-size: 1.1rem;
        line-height: 1.3;
    }

    /* Phones, and touch-only tablets. */
    @media (max-width: 760px), (hover: none) and (pointer: coarse) {
        .desktop-notice {
            display: flex;
        }
    }
</style>
