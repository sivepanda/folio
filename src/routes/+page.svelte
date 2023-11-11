<script lang='ts'>
    import Header from "../components/Header.svelte";
    import CursorDiv from "../components/CursorDiv.svelte";
    import Perspective from "../components/Perspective.svelte";
    import Gallery from "../components/Gallery.svelte";
    // import IntersectionObserved, { useScrollAction } from "../components/IntersectionObserved.svelte";
    import { browser } from '$app/environment';
    import Carousel from 'svelte-carousel';
	import IntersectionObserved from "../components/IntersectionObserved.svelte";
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
            <h1 class="hero" id="her0">Create<i>&</i>Imagine</h1>

        </Carousel>
    {/if}
    <h1 id="her1">Think&<b>Dream</b></h1>
    <h2>&gt;&gt; hi. i'm siven panda.</h2>
</div>
<div class="fullheight showcasedeck">
    <h2 class="idea">&gt;&gt; development</h2>
    <div>
        <Perspective displayImage="/images/retroim.png" url="https://flyretrograde.com" >
            <img slot="headerim" src="/images/retrograde_wh.png" alt="">
        </Perspective>
    </div>
    <div>
        <Perspective displayImage="/images/sbim.png" url="https://github.com/sivepanda/soundbits" >
            <img slot="headerim" src="/images/bits.svg" alt="">
        </Perspective>
    </div>
    <div>
        <Perspective displayImage="/images/nuwrldim.png" url="https://sivepanda.github.io/tsawebmaster22/public_html/" >
            <img slot="headerim" src="/images/nw22.png" alt="">
        </Perspective>
    </div>
    <div>
        <Perspective displayImage="/images/ghim.png" url="https://github.com/sivepanda" >
            <img slot="headerim" src="/images/github-mark-white.png" alt="">
        </Perspective>
    </div>
    

</div>
<div class="fullheight gallery">
    <IntersectionObserved><h2 class="idea">&gt;&gt; photography</h2></IntersectionObserved>
    <div class="images">
        <img src="../images/photos/DSC_2913.JPG" alt="">
        <img src="../images/photos/_MG_9697.JPG" alt="">
        <img src="../images/photos/DSC_6566.JPG" alt="">
        <img src="../images/photos/DSC_6117.png" alt="">
        <img src="../images/photos/DSC_5527_Edit.jpg" alt="">
        <img src="../images/photos/DSC_5347.png" alt="">
    </div>
        
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
        --light: #d3d3d3;
        --almostblack: #181818;
    }  
    .herocontainer {
        padding-left: 0px;
        left:0px;
        margin-top: -5vh;
        padding-top:0vh;
        height: 110vh;
        background:  linear-gradient(rgba(0, 0, 0, 0), var(--almostblack)), url("/images/photos/DSC_3076.JPG");
        background-size:fill;  
        background-position: center;      
    }
    .herocontainer h1 {
        font-size: 23vh;
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
        margin-top: 20vh;
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
    .fullheight {
        height: 90vh;
        width: 100vw;
    }
    
    .showcasedeck {
        display: grid;
        grid-template-columns: 50vw 50vw;
        grid-template-rows: 10vh 40vh 40vh;
        align-items: center;
        justify-content: center;
        padding-bottom: 15vh;
    }
    
    .showcasedeck div {
        align-self: center;
        justify-self: center;
        margin: 0px;
        padding: 0px;
    }

    .idea {
        /* grid-row: 2; */
        grid-column: 1 / span 2;
        font-size: 10vh;
        padding: 0vw;
        padding-left: 5vw;
        margin: 0vh;
    }

    .gallery {
        background: var(--light);
        padding-top: 15vh;
        padding-bottom: 10vh;
        width: 99svw;
        display: grid !important;
        align-items: center !important;
        justify-items: center !important;
        border-radius: 20px 20px 20px 20px;
        box-shadow: black 0px -10px 10px;
    }

    .gallery h2 {
        color: var(--almostblack);
        padding-left: 5vw;
        grid-row: 1;
        grid-column: 1 !important;
        align-self: left;
        justify-self: left;
    }

    .gallery .images {
        padding-left: 5vw;
        padding-right: 5vw;
    }

    .gallery img {
        height: 40vh;
        width: auto;
        border-radius: 20px;
        transition: 200ms all ease-in-out;
    }

    .gallery img:hover {
        height: 40vh;
        width: 30vw;
        background-size: cover;
        transition: 200ms all ease-in-out;
    }
</style>