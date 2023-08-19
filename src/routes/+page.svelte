<script lang='ts'>
    import Header from "../components/Header.svelte";
    import CursorDiv from "../components/CursorDiv.svelte";
    import { Cursor, Interactive } from 'svelte-cursor';
    import IntersectionObserved, { elementInViewport } from "../components/IntersectionObserved.svelte"
    
    window.addEventListener("scroll", (e) => {
        if(elementInViewport(document.getElementById("her0"))) {
            console.log("invew")
        }
        console.log('yo')
    });
</script>


<CursorDiv/>
<Header />

<div class="herocontainer first">
    <h1 class="hero" id="her0">Create<i>&</i><b>Imagine</b></h1>
    <h1 id="her1">Think<i>&</i><b>Dream</b></h1>
    <h2>ask what's next?</h2>
</div>
<div class="herocontainer"></div>


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
    }  
    .herocontainer {
        padding-left: 0px;
        left:0px;
        height: 90vh;
        background:  linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url("/images/photos/DSC_3076.JPG");
        background-size: cover;  
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
        background-position: center;
        /* -webkit-text-stroke: 1px white; */
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        filter: brightness(1000%) invert(100) grayscale(90%) hue-rotate(20deg);
        transition: ease 200ms;
    }
    #her0:hover {
        filter: brightness(100%) invert(100) grayscale(0%);
        transition: ease 200ms;
    }
    #her1 {
        background: url("/images/photos/DSC_6492.JPG");
        /* -webkit-text-stroke: 1px white; */
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        filter: brightness(10000%) grayscale(50%) hue-rotate(90deg);
        transition: ease 200ms;
    }
    #her1:hover {
        filter: brightness(100%) grayscale(0%);
        transition: ease 200ms;
    }
</style>