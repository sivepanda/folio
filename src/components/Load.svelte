<script>
    // @ts-ignore
    import Header from "./Header.svelte";
    // import anime from "animejs";
    import { createTimeline, svg, animate, stagger } from 'animejs';
    import { onMount } from "svelte";

    let visible = $state(true);



    onMount(() => {
        const [ drawable ] = svg.createDrawable('.pth')
        console.log(drawable)

        const anim = animate(svg.createDrawable('.pth'), {
            draw: ['0 0', '0 1'],
            ease: 'inOutExpo',
            duration: 1500,
            delay: stagger(150)
        })

        const tl = createTimeline({
            ease: 'inOutExpo',
            duration: 2000,
        // @ts-ignore
        }).sync(anim)
        .add('#page', {
            opacity: 0,
            // scale: 0.7,
            duration: 500,
            // complete: (anim) => {visible = !anim}

        }, '-=200')

        tl.play();
        tl.then(() => {visible = false})
    })
</script>

{#if visible}
<div id="page"> 
    <svg
    version="1.1"
    id="svg179"
    preserveAspectRatio="xMidyMid"
    width="790.15509"
    height="553.80859"
    viewBox="0 0 790.15509 553.80859"
    xmlns="http://www.w3.org/2000/svg">
    <g
        id="g185"
        transform="translate(-144.92244,-263.1002)">
        <g
        id="pth1045"
        transform="matrix(13.203648,0,0,13.203648,-95.525119,-65.780623)">
        <path
            d="M 18.926311,66.016776 V 41.358024 a 7.7587396,7.7587396 130.64145 0 1 6.582858,-7.669116 l 51.829597,-7.946871 v 11.034219 a 9.7936922,9.7936922 130.56116 0 1 -8.282277,9.676364 l -15.262956,2.384022 v 11.772617 z"
            class="pth"
            id="path297" 
            />
        <path
            d="m 46.358197,35.881132 -16.590655,2.459531 a 5.047311,5.047311 130.78372 0 0 -4.307147,4.992745 v 7.136755 L 46.58351,47.372106 v 5.4631 A 7.2123416,7.2123416 130.92569 0 1 40.393456,59.97473 L 22.193353,62.580749 V 42.009908 a 5.9040234,5.9040234 130.58981 0 1 4.998716,-5.834202 l 47.273953,-7.335613 v 8.292199 a 6.8074949,6.8074949 130.38167 0 1 -5.714805,6.719227 L 51.25876,46.696167 v 11.153005"
            class="pth"
            id="path1034" />
        <path
            d="M 51.089775,43.142815 V 35.26152 L 71.53695,31.994479 v 2.703758"
            class="pth"
            id="path1036" />
        </g>
    </g>
    </svg>
</div>
{/if}

<style>
    #page {
        position: absolute;
        z-index: 9999;
        display: flex;
        background-color: rgba(0,0,0,0.5);
        height: 100vh;
        width: 100vw;
        backdrop-filter: blur(40px);
        align-items: center;
        justify-content: center;
        overflow: hidden;

    }
    #pth1045 {
        fill: none;
        stroke: #fff;
        stroke-width: 1.43124;
    }
</style>

