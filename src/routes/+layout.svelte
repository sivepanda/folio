<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Header from '../components/Header.svelte';
    import Load from '../components/Load.svelte';
    import gsap from 'gsap';
    import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
    import { animate, engine, onScroll, stagger, svg } from 'animejs';

    let scrY = $state(0);

    onMount(() => {
        console.log('hello');

        engine.defaults.autoplay = false;

        animate(svg.createDrawable('.svg_lgo'), {
            draw: ['0 0', '0 1'],
            ease: 'inExpo',
            duration: 3000,
            delay: stagger(150),
            repeat: false,
            autoplay: onScroll({
                target: '#lan',
                container: '.main'
            })
        });
    });
</script>

<svelte:window bind:scrollY={scrY} />

<Header {scrY} />

<slot /> 