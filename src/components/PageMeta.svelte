<script>
    /** @type {{ title: string, description: string }} */
    let { title, description } = $props();
</script>

<!-- The preview image and site-wide tags live in app.html (filled by hooks.server.js). -->
<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
</svelte:head>
