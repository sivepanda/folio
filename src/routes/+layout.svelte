<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Header from '../components/Header.svelte';
    import Load from '../components/Load.svelte';
    import gsap from 'gsap';
    import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
    import { animate, engine, onScroll, stagger, svg } from 'animejs';

    let scrY = $state(0);
</script>

<svelte:window bind:scrollY={scrY} />

<Header {scrY} />

<slot /> 