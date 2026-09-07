<script>
    import { onMount } from 'svelte';
    import { createAnimatable, utils } from 'animejs';
    import { resumeContent } from '$lib/resume-content.js';

    let opened = $state('closed');
    let hei = $state('0vh');
    let pdg = $state('0px');
    let { scrY = 0 } = $props();

    /** @type {SVGSVGElement | null} */
    let svgContainer = null;
    /** @type {HTMLSpanElement | null} */
    let nameText = null;

    let animationStarted = false;
    let typingStarted = false;
    /** @type {ReturnType<typeof setInterval> | null} */
    let typingInterval = null;
    /** @type {import('animejs').AnimatableObject | null} */
    let svgMotion = null;
    /** @type {import('animejs').AnimatableObject | null} */
    let nameMotion = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let widthResetTimeout = null;
    let expandedSvgWidth = 0;
    let lastProgress = -1;

    function toggleOpened() {
        if (opened === 'closed') {
            opened = 'opened';
            hei = 'calc(100vh - 60px)';
            pdg = '40px';
        } else {
            opened = 'closed';
            hei = '0vh';
            pdg = '0px';
        }
    }

    function closeMenu() {
        opened = 'closed';
        hei = '0vh';
        pdg = '0px';
    }

    $effect(() => {
        if (!svgContainer || !nameText) return;

        const triggerPoint = 50;
        const endPoint = 100;

        if (scrY >= triggerPoint) {
            const progress = Math.min((scrY - triggerPoint) / (endPoint - triggerPoint), 1);
            if (progress === lastProgress) return;
            lastProgress = progress;

            if (!animationStarted) {
                animationStarted = true;
                if (widthResetTimeout) {
                    clearTimeout(widthResetTimeout);
                    widthResetTimeout = null;
                }

                svgMotion?.revert();
                nameMotion?.revert();
                expandedSvgWidth = svgContainer.getBoundingClientRect().width;
                utils.set(svgContainer, {
                    '--svg-width': `${expandedSvgWidth}px`
                });
                utils.set(nameText, {
                    opacity: 0,
                    width: '0vw',
                    overflow: 'hidden'
                });

                svgMotion = createAnimatable(svgContainer, {
                    translateX: { unit: 'vw', duration: 300, ease: 'outCubic' },
                    opacity: { duration: 300, ease: 'outCubic' },
                    '--svg-width': { unit: 'px', duration: 300, ease: 'outCubic' }
                });
                nameMotion = createAnimatable(nameText, {
                    opacity: { duration: 300, ease: 'outCubic' },
                    width: { unit: 'vw', duration: 300, ease: 'outCubic' }
                });
            }

            svgMotion?.translateX(-progress);
            svgMotion?.opacity(0);
            svgMotion?.['--svg-width'](0);

            if (progress > 0.3) {
                nameMotion?.opacity(1);
                nameMotion?.width(25);
            }

            if (!typingStarted && progress > 0.5) {
                typingStarted = true;
                startTypingEffect();
            }
        } else {
            if (lastProgress === 0) return;
            lastProgress = 0;

            if (animationStarted) {
                animationStarted = false;
                typingStarted = false;

                if (typingInterval) {
                    clearInterval(typingInterval);
                    typingInterval = null;
                }

                svgMotion?.opacity(1);
                svgMotion?.['--svg-width'](expandedSvgWidth);
                nameMotion?.opacity(0);
                nameMotion?.width(0);

                // Restore the logo's size before settling it horizontally, matching the old GSAP/CSS handoff.
                widthResetTimeout = setTimeout(() => {
                    if (svgContainer && !animationStarted) {
                        svgContainer.style.removeProperty('--svg-width');
                        svgMotion?.translateX(0);
                    }
                    widthResetTimeout = null;
                }, 300);

                nameText.textContent = '';
                nameText.classList.remove('typing-complete');
            }
        }
    });

    function startTypingEffect() {
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }

        const text = resumeContent.name;
        let i = 0;
        if (nameText) {
            nameText.textContent = '';

            typingInterval = setInterval(() => {
                if (i < text.length && nameText) {
                    nameText.textContent += text.charAt(i);
                    i++;
                } else {
                    if (typingInterval) {
                        clearInterval(typingInterval);
                        typingInterval = null;
                    }
                    if (nameText) nameText.classList.add('typing-complete');
                }
            }, 80);
        }
    }

    onMount(() => {
        return () => {
            if (typingInterval) clearInterval(typingInterval);
            if (widthResetTimeout) clearTimeout(widthResetTimeout);
            svgMotion?.revert();
            nameMotion?.revert();
        };
    });
</script>

<!-- width="90" -->
<!-- height="63" -->
<!-- viewBox="0 0 790.15509 553.80859" -->
<div class="fullmnu" style="height: {hei}; padding-top: {pdg}">
    <a href="/" onclick={closeMenu}>/</a>
    <a href="/photography" onclick={closeMenu}>/photography</a>
</div>

<div class="header">
    <div class="logo-container">
        <a href="/" class="logo-link">
            <svg
                bind:this={svgContainer}
                version="1.1"
                id="svgcontain"
                viewBox="0 12 100 70"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g id="g185">
                    <g id="pthgrp">
                        <path
                            d="M 18.926311,66.016776 V 41.358024 a 7.7587396,7.7587396 130.64145 0 1 6.582858,-7.669116 l 51.829597,-7.946871 v 11.034219 a 9.7936922,9.7936922 130.56116 0 1 -8.282277,9.676364 l -15.262956,2.384022 v 11.772617 z"
                            class="logopath"
                            id="path297"
                        />
                        <path
                            d="m 46.358197,35.881132 -16.590655,2.459531 a 5.047311,5.047311 130.78372 0 0 -4.307147,4.992745 v 7.136755 L 46.58351,47.372106 v 5.4631 A 7.2123416,7.2123416 130.92569 0 1 40.393456,59.97473 L 22.193353,62.580749 V 42.009908 a 5.9040234,5.9040234 130.58981 0 1 4.998716,-5.834202 l 47.273953,-7.335613 v 8.292199 a 6.8074949,6.8074949 130.38167 0 1 -5.714805,6.719227 L 51.25876,46.696167 v 11.153005"
                            class="logopath"
                            id="path1034"
                        />
                        <path
                            d="M 51.089775,43.142815 V 35.26152 L 71.53695,31.994479 v 2.703758"
                            class="logopath"
                            id="path1036"
                        />
                    </g>
                </g>
            </svg>

            <div class="name-text" bind:this={nameText}>
                <!-- Text will be typed in here -->
            </div>
        </a>
    </div>

    <div class="right">
        <a href="/">/</a>
        <a href="/photography">/photography</a>
        <div></div>
    </div>

    <div class="mnuicon">
        <button class="menu {opened}" onmousedown={() => toggleOpened()} aria-label="Main Menu">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <path
                    class="line line1"
                    d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058"
                />
                <path class="line line2" d="M 20,50 H 80" />
                <path
                    class="line line3"
                    d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942"
                />
            </svg>
        </button>
    </div>
</div>

<style>
    .fullmnu {
        position: fixed;
        top: 60px;
        font-family: 'Mozilla Headline', 'sans-serif';
        font-weight: 650;
        background: linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0));
        backdrop-filter: blur(20px);
        width: 100%;
        height: 0vh;
        display: flex;
        flex-direction: column;
        padding-top: 0;
        padding-left: 20px;
        padding-right: 20px;
        transition: 500ms ease-in-out;
        z-index: 9997;
        overflow-x: hidden;
    }

    .fullmnu > a {
        text-decoration: none;
        font-size: clamp(2rem, 8vw, 3rem);
        color: white;
        padding-top: 40px;
    }

    .header {
        font-family: 'Mozilla Headline', 'sans-serif';
        font-weight: 650;
        background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0));
        backdrop-filter: blur(20px);
        height: 6vh;
        width: 100%;
        position: fixed;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        z-index: 9998;
        top: 0;
        border-bottom: 1px solid rgba(100, 100, 100, 0.4);
    }

    .logo-container {
        display: flex;
        align-items: center;
        padding-left: 2vw;
        position: relative;
        width: auto;
        height: 100%;
    }

    .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        height: 100%;
        cursor: pointer;
        transition: 100ms ease-in;
    }

    .logo-link:hover {
        filter: brightness(80%);
        transition: 100ms ease-out;
    }

    .name-text {
        font-family: 'Mozilla Headline', 'sans-serif';
        font-weight: 650;
        font-size: 2.2vh;
        color: white;
        margin-left: 1vw;
        white-space: nowrap;
        width: 0;
        opacity: 0;
        overflow: hidden;
        will-change: opacity, width;
    }

    /* Typing animation cursor effect */
    .name-text::after {
        content: '|';
        color: white;
        animation: blink 1s infinite;
        margin-left: 2px;
    }

    @keyframes blink {
        0%,
        50% {
            opacity: 1;
        }
        51%,
        100% {
            opacity: 0;
        }
    }

    /* Hide cursor after animation completes */
    .name-text.typing-complete::after {
        display: none;
    }

    @media (min-aspect-ratio: 1) {
        .mnuicon {
            display: none !important;
        }

        .fullmnu {
            display: none !important;
        }
    }

    @media (max-aspect-ratio: 1) {
        .header {
            width: 100%;
            height: 60px;
            padding-left: 12px;
            padding-right: 8px;
        }

        .logo-container {
            padding-left: 0;
        }

        .right {
            display: none !important;
        }

        .name-text {
            font-size: 16px;
        }

        #svgcontain {
            height: 40px;
        }

        .mnuicon {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
        }

        .menu {
            width: 48px;
            height: 48px;
            scale: 1;
        }

        .menu svg {
            width: 48px;
            height: 48px;
        }

        .fullmnu {
            padding-left: clamp(1rem, 6vw, 2rem);
            padding-right: clamp(1rem, 6vw, 2rem);
        }

        .fullmnu > a {
            font-size: clamp(1.5rem, 6vw, 2.5rem);
            padding-top: 30px;
        }
    }

    .mnuicon {
        scale: 0.8;
    }

    #svgcontain {
        /* scale: 0.8; */
        width: var(--svg-width, auto);
        height: 100%;
        padding: 0px;
        will-change: transform;
    }

    #pthgrp,
    .logopath {
        fill: none;
        stroke: white;
        stroke-width: 1.5;
    }

    .right {
        display: flex;
        padding-right: 2vw;
        flex-direction: row;
    }

    .right a {
        display: block;
        align-self: center;
        font-size: 2svh;
        text-decoration: none;
        color: white;
        margin: 0;
        padding: 0;
        padding-left: 2vw;
        transition: ease 0.7s;
    }

    .right a:hover {
        margin-top: 0vh;
        font-weight: 950;
        color: gray;
        transition: cubic-bezier(0.57, -0.01, 0, 0.72) 200ms;
    }

    .menu {
        background-color: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        padding: 0;
        scale: 0.7;
    }

    .line {
        fill: none;
        stroke: white;
        stroke-width: 6;
        transition:
            stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
            stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .line1 {
        stroke-dasharray: 60 207;
        stroke-width: 6;
    }

    .line2 {
        stroke-dasharray: 60 60;
        stroke-width: 6;
    }

    .line3 {
        stroke-dasharray: 60 207;
        stroke-width: 6;
    }

    .opened .line1 {
        stroke-dasharray: 90 207;
        stroke-dashoffset: -134;
        stroke-width: 6;
    }

    .opened .line2 {
        stroke-dasharray: 1 60;
        stroke-dashoffset: -30;
        stroke-width: 6;
    }

    .opened .line3 {
        stroke-dasharray: 90 207;
        stroke-dashoffset: -134;
        stroke-width: 6;
    }
</style>
