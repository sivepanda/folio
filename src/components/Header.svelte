<script>
    // import {Interactive} from 'svelte-cursor'
</script>

<div class="whole">
    <h1 class="left">
        Siven Panda
    </h1>
    <div class='right tall'>
        <!-- <Interactive><a href="/">home</a></Interactive> -->
        <!-- <Interactive><a href="/photography">photography</a></Interactive> -->
        <!-- <Interactive><a href="/webdev">webdev</a></Interactive> -->
        <a href="/">home</a>
        <a href="/photography">photography</a>
        <a href="/webdev">webdev</a>
    </div>
</div>


<style>
    :root {
        --blue: #0004ff;
        --dblue: #030064;
        --dperblue: #07052b;
        --blurple: #2e00b8;
        --lblue: #5255eb;
        --purple: #7100b3;
        --pin: #ff00c8;
        --red: #ff0000;
    }
    .whole {
        padding-left: 0px;
        z-index: 999;
        backdrop-filter: invert(10%) blur(9px);
        position: fixed;
        background-color: rgba(3, 0, 30, 0.4);
        width: 100vw;
        display: grid;
        grid-template-columns: 60vw 40vw;
        align-items: center;
        justify-content: center;
        height: 10vh;
        top: 0;
        margin-top: 0;
        margin-bottom: 0;
        padding-top: 0;    
        padding-bottom: 0;    
    }
    .left {
        align-self: center;
        color: white;
        margin-top: 0vh;
        margin-bottom: 0vh;
        padding-left: 2vw;
        font-size: 5vh;
        width: 60vw;
        font-weight: 600;
        
    }
    .right {
        display: flex;
        flex-direction: row;
    }
    .right a {
        display: block;
        align-self: center;
        font-size: 8vh;
        text-decoration: none;
        color: var(--purple);
        margin: 0;
        padding: 0;
        padding-left: 2vw;
        transition: ease .7s;
    }
    .right span a:hover {
        margin-top: 0vh;
        /* margin-bottom: 2vh; */
        color: var(--pin);
        transition: cubic-bezier(.57,-0.01,0,.72) 200ms;
    }
</style>