<script lang="js">
    import { optimize } from '$lib/image';

    export let photo;
</script>

<img
    class="absolute left-0 top-0 w-full h-full"
    srcset={optimize(photo.url)}
    alt={photo.description}
/>
