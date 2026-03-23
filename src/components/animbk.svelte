<script>
    import { createTimeline, svg, animate, stagger, onScroll, engine, utils } from 'animejs';
    import { onMount } from 'svelte';

    export let text = 'Hello World';
    export let x = 0;
    export let y = 15;
    export let fontSize = 20;
    export let fontFamily = 'Gloock, sans-serif';
    export let fontWeight = 'normal';
    export let fill = '#00000000';
    export let viewBox = '0 0 300 50';
    export let textAnchor = 'start'; // start, middle, end
    export let rotate = 0;
    export let dx = 0;
    export let dy = 0;
    export let strokeColor = 'white';
    export let strokeWidth = 0.5;

    onMount(() => {
        engine.defaults.autoplay = false;

        animate(svg.createDrawable('#thee'), {
            draw: ['0 0', '0 1'],
            ease: 'inExpo',
            duration: 3000,
            delay: stagger(150),
            repeat: true,
            autoplay: onScroll({
                target: '#cntnt',
                container: '#global-body',
                debug: true
            })
        }).then(() => {
            console.log('hellorl');
        });
    });
</script>

<div id="cntnt">
    <svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
        <text
            id="thee"
            {x}
            {y}
            font-size="{fontSize}px"
            font-family={fontFamily}
            font-weight={fontWeight}
            stroke-width={strokeWidth}
            stroke={strokeColor}
            {fill}
            stroke-opacity="1"
            text-anchor={textAnchor}
            transform="rotate({rotate} {x} {y}) translate({dx} {dy})"
        >
            {text}
        </text>
    </svg>
</div>

<style>
    .cntnt {
        /* height: 20%; */
    }
</style>
