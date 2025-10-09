<script>
    import HomePage from '../+page.svelte';
    import { page } from '$app/stores';
    import { afterNavigate } from '$app/navigation';

    afterNavigate(() => {
        const section = $page.params.section;
        if (section) {
            const target = document.getElementById(section);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
</script>

<HomePage />
