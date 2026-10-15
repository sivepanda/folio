<script>
    import { page } from '$app/state';
    import { resumeContent } from '$lib/resume-content.js';

    const links = [
        { href: '/#about', label: resumeContent.sections.about },
        { href: '/#skills', label: resumeContent.sections.skills },
        { href: '/#experience', label: resumeContent.sections.experience },
        { href: '/#projects', label: resumeContent.sections.projects },
        { href: '/#contact', label: resumeContent.sections.contact },
        { href: resumeContent.contact.photography, label: 'Photography' }
    ];
</script>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
    <a class="wordmark" href="/">{resumeContent.name}</a>
    <nav aria-label="Primary navigation">
        {#each links as link}
            <a
                href={link.href}
                aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
            >
                {link.label}
            </a>
        {/each}
    </nav>
</header>

<style>
    .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 2;
        padding: 0.45rem 0.7rem;
        background: #181816;
        color: #fff;
        transform: translateY(-200%);
    }

    .skip-link:focus {
        transform: none;
    }

    .site-header {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
        padding: 1.2rem 0;
        border-bottom: 1px solid var(--border, #cbc8be);
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 2rem;
        color: #171511;
        font-family: 'Mozilla Text', sans-serif;
        font-size: 1rem;
        line-height: 1.65;
    }

    .wordmark {
        color: inherit;
        font-weight: 700;
        text-decoration: none;
    }

    nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 1.25rem;
    }

    nav a {
        color: var(--muted, #626158);
        text-underline-offset: 0.18em;
    }

    nav a[aria-current='page'] {
        color: inherit;
        text-decoration-thickness: 2px;
    }

    a:focus-visible {
        outline: 2px solid #171511;
        outline-offset: 3px;
    }

    @media (max-width: 700px) {
        .site-header {
            width: min(100% - 2rem, 52rem);
            grid-template-columns: 1fr auto;
            gap: 0.75rem 1rem;
        }

        nav {
            grid-column: 1 / -1;
            grid-row: 2;
        }
    }

    @media print {
        .site-header,
        .skip-link {
            display: none;
        }
    }
</style>
