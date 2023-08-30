<script lang="ts">
    let displayImage:String;
    
    function hov(node: { target: { getBoundingClientRect: () => { (): any; new(): any; x: number; y: number; }; offsetWidth: number; offsetHeight: number; style: { transform: string; }; }; clientX: number; clientY: number; }) {
        const dampenFactor = 30;
        const centerX = node.target.getBoundingClientRect().x + node.target.offsetWidth / 2;
        const centerY = node.target.getBoundingClientRect().y + node.target.offsetHeight / 2;
        var rY = Math.floor(centerX - node.clientX)  / dampenFactor;
        var rX = Math.floor(centerY - node.clientY)  / dampenFactor;
        node.target.style.transform = "rotateY(" + rY + "deg) rotateX(" + rX + "deg)";
        node.target.style.setProperty("--perspX", rX / 5);
        node.target.style.setProperty("--perspY", rX / 5);
    }

    function out(node: { target: { style: { transform: string; }; }; }) {
        node.target.style.transform = "rotateY(0deg) rotateX(0deg)";

    }
</script>

<div class="main" aria-live="polite" style="--display_image: {displayImage}" on:mousemove={hov} on:mouseleave={out}>
    <div class="headerim">
        <slot name="headerim">no header provided</slot>
    </div>
</div>

<style>
    .main {
        --perspX: 0;
        width: 30vw;
        height: 70vh;
        background-color: gray;
        border-radius: 2vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-left: 3vw;
        transform: rotateX(0deg);
        box-shadow: 0px 0px 0px white;
        transition: 200ms ease-in-out;
    }
    .main:hover {
        box-shadow: 0px 0px 8px white;
        transition: 200ms ease-in-out;
    }
    .main:hover :global(img) {
    }
    .headerim {
        transform:translateY(0px);
        width: 60%;
        -webkit-filter: drop-shadow(0px 0px 1px black);
        filter: drop-shadow(0px 0px 1px black);
        transition: 200ms ease-in-out;
    }
    .main:hover .headerim {
        transform:rotateX(var(--perspX)) translateY(20px);
        transition: 200ms ease-in-out;
        -webkit-filter: drop-shadow(0px 0px 5px black);
        filter: drop-shadow(0px 0px 5px black);
    }
    .headerim :global(img) {
        width: 100%;
    }
</style>