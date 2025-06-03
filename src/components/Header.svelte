<script>
    let opened = $state('closed');
    let hei = $state('0vh');
    let pdg = $state('0px');

    function toggleOpened() {
        console.log('test');
        if (opened == 'closed') {
            opened = 'opened';
            hei = '90vh !important';
            pdg = '10vh !important';
        } else {
            opened = 'closed';
            hei = '0vh !important';
            pdg = '0vh !important';
        }
        console.log(opened);
    }
    // this.classList.toggle('opened');this.setAttribute('aria-expanded', this.classList.contains('opened'))
</script>

<!-- {#if opened=='opened'} -->
<div class="fullmnu" style="height: {hei}; padding-top: {pdg}">
    <a href="/">cd /</a>
    <a href="/#skills">cd /skills</a>
    <a href="/#projects">cd /projects</a>
    <a href="/photography">cd /photography</a>
</div>

<!-- {/if} -->

<div class="header">
    <svg
        version="1.1"
        id="svgcontain"
        width="90"
        height="63"
        viewBox="0 0 790.15509 553.80859"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g id="g185" transform="translate(-144.92244,-263.1002)">
            <g id="pthgrp" transform="matrix(13.203648,0,0,13.203648,-95.525119,-65.780623)">
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
    <div class="right">
        <a href="/">/</a>
        <a href="/#skills">/skills</a>
        <a href="/#projects">/projects</a>
        <a href="/photography">/photography</a>
        <div></div>
    </div>
    <div class="mnuicon">
        <!-- <button class="menu" onclick="this.classList.toggle('opened');this.setAttribute('aria-expanded', this.classList.contains('opened'))" aria-label="Main Menu"> -->
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
        position: absolute;
        font-family: 'Mozilla Headline', 'sans-serif';
        font-weight: 650;
        background: linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0));
        backdrop-filter: blur(20px);
        width: 80vw;
        height: 0vh;
        display: flex;
        flex-direction: column;
        padding-top: 10vh;
        padding-left: 10vw;
        padding-right: 10vw;
        transition: 500ms ease-in-out;
        overflow: hidden;
    }
    .fullmnu > a {
        text-decoration: none;
        font-size: 3em;
        color: white;
        padding-top: 5vh;
    }
    .header {
        font-family: 'Mozilla Headline', 'sans-serif';
        font-weight: 650;
        background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0));
        backdrop-filter: blur(20px);
        height: 10vh;
        width: 100vw;
        position: fixed;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        z-index: 9998;
    }

    @media (min-aspect-ratio: 1) {
        .mnuicon {
            display: none !important;
        }
    }

    @media (max-aspect-ratio: 1) {
        .header {
            width: calc(100vw - 4vw - 4vw);
            padding-left: 4vw;
            padding-right: 4vw;
        }

        #svgcontain {
            scale: 0.8;
        }

        .right {
            display: none !important;
        }
    }

    #svgcontain {
        padding-left: 2vw;
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
        font-size: 3svh;
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
        /* margin-bottom: 2vh; */
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
