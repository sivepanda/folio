<script>
    import { resumeContent } from '$lib/resume-content.js';

    let { experiences = [], projects = [], skillGroups = [] } = $props();
    let emailCopied = $state(false);
    let projectsExpanded = $state(false);

    /** @param {Array<{ name: string }>} technologies */
    function technologyNames(technologies) {
        return technologies.map((technology) => technology.name).join(', ');
    }

    async function copyEmail() {
        await navigator.clipboard.writeText(resumeContent.contact.email);
        emailCopied = true;
    }
</script>

<svelte:head>
    <meta
        name="description"
        content={`A simple, text-first overview of ${resumeContent.name}'s experience, skills, and projects.`}
    />
</svelte:head>

<div class="simple-page">
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="site-header">
        <a class="wordmark" href="#main" aria-label="Home TL;DR">{resumeContent.name}</a>
        <nav aria-label="Resume sections">
            <a href="#about">{resumeContent.sections.about}</a>
            <a href="#skills">{resumeContent.sections.skills}</a>
            <a href="#experience">{resumeContent.sections.experience}</a>
            <a href="#projects">{resumeContent.sections.projects}</a>
            <a href="#contact">{resumeContent.sections.contact}</a>
        </nav>
    </header>

    <main id="main">
        <section class="intro" id="about" aria-labelledby="intro-title">
            <h1 id="intro-title">{resumeContent.heading}</h1>
            <p class="summary">{resumeContent.summary}</p>
            <div class="contact-row" aria-label="Contact links">
                <span class="email-link">
                    <a href={`mailto:${resumeContent.contact.email}`}>
                        {resumeContent.contact.email}
                    </a>
                    <button
                        type="button"
                        onclick={copyEmail}
                        aria-label={emailCopied ? 'Email copied' : 'Copy email address'}
                        title={emailCopied ? 'Copied' : 'Copy email'}
                    >
                        <i
                            class={emailCopied ? 'ri-check-line' : 'ri-file-copy-line'}
                            aria-hidden="true"
                        ></i>
                    </button>
                </span>
                <a href={resumeContent.contact.github}>GitHub</a>
                <a href={resumeContent.contact.linkedin}>LinkedIn</a>
                <a href={resumeContent.contact.photography}>Photography</a>
            </div>
        </section>

        <section id="skills" aria-labelledby="skills-title">
            <h2 id="skills-title">{resumeContent.sections.skills}</h2>
            <p>{resumeContent.skills.description}</p>
            <h3>{resumeContent.skills.listHeading}</h3>
            <dl class="skills-list">
                {#each skillGroups as group}
                    <div>
                        <dt>{group.name}</dt>
                        <dd>
                            {#each group.items as item, index}
                                {item.name}{index < group.items.length - 1 ? ', ' : ''}
                            {/each}
                        </dd>
                    </div>
                {/each}
            </dl>
        </section>

        <section id="experience" aria-labelledby="experience-title">
            <h2 id="experience-title">{resumeContent.sections.experience}</h2>
            <div class="entry-list">
                {#each experiences as experience}
                    <article>
                        <h3>
                            <a href={experience.link}>{experience.title}</a>
                        </h3>
                        <p>{experience.description}</p>
                        <p class="tools">
                            <span>Tools:</span>
                            {technologyNames(experience.technologies)}
                        </p>
                    </article>
                {/each}
            </div>
        </section>

        <section id="projects" aria-labelledby="projects-title">
            <h2 id="projects-title">{resumeContent.sections.projects}</h2>
            <div class="entry-list">
                {#each projects.slice(0, projectsExpanded ? projects.length : 3) as project}
                    <article>
                        <h3>
                            {#if project.link}
                                <a href={project.link}>{project.title}</a>
                            {:else}
                                {project.title}
                            {/if}
                        </h3>
                        <p>{project.description}</p>
                        <p class="tools">
                            <span>Tools:</span>
                            {technologyNames(project.technologies)}
                        </p>
                    </article>
                {/each}
            </div>
            {#if projects.length > 3}
                <button
                    class="projects-toggle"
                    type="button"
                    aria-expanded={projectsExpanded}
                    onclick={() => (projectsExpanded = !projectsExpanded)}
                >
                    {projectsExpanded ? 'Show less' : 'Show more'}
                </button>
            {/if}
        </section>

        <section id="contact" aria-labelledby="contact-title">
            <h2 id="contact-title">{resumeContent.sections.contact}</h2>
            <p>
                The easiest way to reach me is at
                <a href={`mailto:${resumeContent.contact.email}`}>{resumeContent.contact.email}</a>.
            </p>
        </section>
    </main>

    <footer>
        <p>{resumeContent.name}</p>
        <a href="#main">Back to top</a>
    </footer>
</div>

<style>
    :global(html:has(.simple-page)) {
        scroll-behavior: auto;
        background: #f5f3ed;
    }

    :global(body:has(.simple-page)) {
        background: #f5f3ed;
        color: #171511;
    }

    :global(.simple-page),
    :global(.simple-page *) {
        animation: none !important;
        transition: none !important;
    }

    .simple-page {
        --border: #cbc8be;
        --muted: #626158;
        min-height: 100vh;
        background: #f5f3ed;
        color: #171511;
        font-family: 'Mozilla Text', sans-serif;
        font-size: 1rem;
        line-height: 1.65;
    }

    .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        padding: 0.45rem 0.7rem;
        background: #181816;
        color: #fff;
        transform: translateY(-200%);
        z-index: 2;
    }

    .skip-link:focus {
        transform: none;
    }

    .site-header {
        width: min(70rem, calc(100% - 3rem));
        margin: 0 auto;
        padding: 1.2rem 0;
        border-bottom: 1px solid var(--border);
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 2rem;
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
        color: var(--muted);
    }

    main,
    footer {
        width: min(52rem, calc(100% - 3rem));
        margin: 0 auto;
    }

    section {
        padding: 3.5rem 0;
        border-bottom: 1px solid var(--border);
        scroll-margin-top: 1rem;
    }

    .intro {
        padding-top: 5.5rem;
    }

    h1,
    h2,
    h3 {
        font-family: 'Mozilla Headline', serif;
    }

    p {
        font-family: 'Mozilla Text', sans-serif;
    }

    h1 {
        margin: 0;
        font-size: clamp(2.8rem, 9vw, 5.5rem);
        line-height: 1;
        letter-spacing: 0.025em;
    }

    h2 {
        margin: 0 0 1.5rem;
        font-size: 1.65rem;
        line-height: 1.2;
    }

    h3 {
        margin: 0;
        font-size: 1.08rem;
        line-height: 1.4;
    }

    p {
        font-size: inherit;
        font-weight: 400;
    }

    a {
        color: #171511;
        text-underline-offset: 0.18em;
    }

    a:focus-visible {
        outline: 2px solid #171511;
        outline-offset: 3px;
    }

    .summary {
        max-width: 46rem;
        margin: 1.75rem 0;
        font-size: clamp(1.15rem, 2.4vw, 1.45rem);
        line-height: 1.55;
    }

    .contact-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 1.25rem;
        align-items: center;
    }

    .email-link {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
    }

    .email-link button {
        width: 2.5rem;
        height: 2.5rem;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 0.9rem;
    }

    .email-link button:focus-visible {
        outline: 2px solid #171511;
        outline-offset: 3px;
    }

    .skills-list {
        margin: 2rem 0 0;
    }

    .skills-list div {
        display: grid;
        grid-template-columns: minmax(9rem, 0.35fr) 1fr;
        gap: 1rem;
        padding: 0.85rem 0;
        border-top: 1px solid var(--border);
    }

    dt,
    .tools span {
        font-weight: 700;
    }

    dd {
        margin: 0;
    }

    .entry-list article {
        padding: 1.75rem 0;
        border-top: 1px solid var(--border);
    }

    .entry-list article > p {
        margin: 0.65rem 0 0;
    }

    .projects-toggle {
        margin-top: 1.25rem;
        padding: 0.55rem 0.9rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
    }

    .projects-toggle:focus-visible {
        outline: 2px solid #171511;
        outline-offset: 3px;
    }

    .tools {
        color: var(--muted);
        font-size: 0.88rem;
    }

    footer {
        padding: 2rem 0 3rem;
        display: flex;
        justify-content: space-between;
        color: var(--muted);
    }

    footer p {
        margin: 0;
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

        main,
        footer {
            width: min(100% - 2rem, 52rem);
        }

        section {
            padding: 2.75rem 0;
        }

        .intro {
            padding-top: 4rem;
        }

        .skills-list div {
            grid-template-columns: 1fr;
            gap: 0.2rem;
        }
    }

    @media print {
        .site-header,
        .skip-link,
        footer {
            display: none;
        }

        .simple-page {
            background: #fff;
            color: #000;
            font-size: 10pt;
        }

        main {
            width: 100%;
        }

        section,
        .intro {
            padding: 1.5rem 0;
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        article {
            break-inside: avoid;
        }
    }
</style>
