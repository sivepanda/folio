<script lang="ts">
    import { Cursor, Interactive } from 'svelte-cursor';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='cu'>
    <Cursor let:state>
        <div class="cursor" class:hover={state === 'hover'} aria-label="cursor"></div>
    </Cursor>
</div>


<style>
    .cu {
        width: 20px;
        height: 20px;
        margin-top: 0px;
        /* display: none; */
    }
    .cursor {
        content: '';
        /* position:relative; */
        height: 40px;
        width: 40px;
        padding: 0;
        margin: 0;
        border-radius: 20px;
        border-width: 0px;
        background-color: rgba(255, 255, 255, 0.295);
        backdrop-filter: invert(100%) blur(3px) saturate(100%);
        box-shadow: 0px 0px 10px white;
        transition: 200ms all ease-in-out;
        z-index: 10000;
    }

    .hover {
        content: '';
        /* position:relative; */
        height: 90px;
        width: 90px;
        left:0;
        top: 0;
        margin: 0;
        border: 1px solid white;
        /* margin-top: -160%; */
        box-shadow: 0px 0px 50px white;
        border-radius: 90px;
        background-color: rgba(255, 255, 255, 0.295);
        backdrop-filter: invert(0%) blur(0px) saturate(150%);
        z-index: 10000;
        transition: 200ms all ease-in-out;
        /* word */
    }
</style>