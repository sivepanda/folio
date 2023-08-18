<script>
    const cursor = document.getElementsByClassName(".cursor")[0];
    document.addEventListener("mousemove", (event) => {
        // we set the coordinates to match the cursor
        // @ts-ignore
        let left = `${event.clientX - 10}px`;
        // @ts-ignore
        let right = `${event.clientY - 10}px`;
    });

</script>

<div class="cursor" style="left:"></div>

<style>
    .cursor {
        height: 2vw;
        width: 2vw;
        border-radius: 2vw;
        color: white;
        backdrop-filter: invert;
    }
</style>