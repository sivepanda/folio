<script lang='ts'>
    import Header from "../components/Header.svelte";
    import CursorDiv from "../components/CursorDiv.svelte";
    import Perspective from "../components/Perspective.svelte";
    import IntersectionObserved, { useScrollAction } from "../components/IntersectionObserved.svelte";
    import { Cursor, Interactive } from 'svelte-cursor';
    import { browser } from '$app/environment';
    import Carousel from 'svelte-carousel';
</script>


<CursorDiv/>
<Header />

<div class="herocontainer first">
    {#if browser}
        <Carousel
            autoplay
            autoplayDuration={5}
            duration={5500}
            timingFunction="linear"
            dots={false}
            arrows={false}
            swiping={false}>
            <h1 class="hero" id="her0">Create<i>&</i><b>Imagine</b></h1>

        </Carousel>
    {/if}
    <h1 id="her1">Think<i>&</i><b>Dream</b></h1>
    <h2>ask what's next?</h2>
</div>
<div class="fullheight">
    <h2 class="idea">development</h2>
    <Perspective>
        <img slot="headerim" src="/images/retrograde_wh.png" alt="">
    </Perspective>
</div>


<style>
    :root {
        left: 0px;
        /* --dblue: #020036; */
        --dperblue: #07052b;
        --blurple: #2e00b8;
        --lblue: #5255eb;
        --purple: #7100b3;
        --pin: #ff00c8;
        --red: #ff0000;
        --almostblack: #181818;
    }  
    .fullheight {
        height: 100vh;
        width: 100vw;
    }
    .herocontainer {
        padding-left: 0px;
        left:0px;
        margin-top: -5vh;
        padding-top:0vh;
        height: 100vh;
        background:  linear-gradient(rgba(0, 0, 0, 0), var(--almostblack)), url("/images/photos/DSC_3076.JPG");
        background-size:fill;  
        background-position: center;      
    }
    .herocontainer h1 {
        font-size: 30vh;
        color: white;
        padding: 0px;
        margin: 0px;
    }
    .herocontainer h2 {
        font-size: 10vh;
        padding: 0px;
        padding-left: 2vw;
        margin: 0px;
    }
    .hero {
        margin: 0;
        margin-top: -15vh;
        margin-bottom: -15vh;
        padding: 0;
    }
    #her0 {
        background: url("/images/photos/DSC_6492.JPG");
        z-index: 2;
        margin-top: 10vh;
        margin-left: 10vw;
        background-position: center;
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        filter: brightness(1000%) invert(100) grayscale(90%) hue-rotate(20deg);
        transition: ease 200ms;
    }
    #her1 {
        background: url("/images/photos/DSC_6492.JPG");
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        filter: brightness(10000%) grayscale(50%) hue-rotate(90deg);
        transition: ease 200ms;
    }
    .idea {
        font-size: 15vh;
        padding-left: 5vw;
        padding-bottom: 0vh;
        margin-bottom: 0vh;
    }
    p {
        font-size: 2vh;
        margin-top: 0vh;
        padding-top: 0vh;
        padding-left: 5vw;
    }
</style>