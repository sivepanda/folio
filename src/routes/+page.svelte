<script lang="ts">
	import Header from '../components/Header.svelte';
	import CursorDiv from '../components/CursorDiv.svelte';
	import Perspective from '../components/Perspective.svelte';
	import Gallery from '../components/Gallery.svelte';
	// import IntersectionObserved, { useScrollAction } from "../components/IntersectionObserved.svelte";
	import IntersectionObserved from '../components/IntersectionObserved.svelte';
	import gsap from 'gsap';
	import { onMount } from 'svelte';
	import ScrollTrigger from 'gsap/dist/ScrollTrigger';
    

	let photoHeadline: Element;
	let gallery: Element;
	let photos: Element;
    let doorman: Element;
    let doormansvg: Element;
    let heroscrollcounter:number = 0;

	$: heroscrollcounter;

	gsap.registerPlugin(ScrollTrigger);

	onMount(() => {
        gsap.to(doormansvg, {
            opacity: 1,
            width: '100%',
			borderRadius: 200,
			rotateY: '0deg',
            ease: 'power4.inOut',
            duration: 4
        }).then(() => {
			gsap.to(doormansvg, {
				opacity: 0,
				width: '10%',
            	ease: 'power3.inOut',
				duration: 2
			});
			gsap.to(doorman, {
				width: 0,
				height: 0,
            	ease: 'power3.inOut',
				delay: 1,
				duration: 1
			})
		})
		gsap.from(photoHeadline, {
			scrollTrigger: photoHeadline,
			x: '20vw',
			ease: 'sine.out',
			duration: 1
		});
		gsap.from(gallery, {
			scrollTrigger: photoHeadline,
			height: '15vh',
			paddingBottom: '0px',
			delay: 2
		});
		gsap.to(photos, {
		    scrollTrigger: photoHeadline,
			delay: 2,
		    opacity: 1
		}).then(() => {
			gsap.to(photoHeadline, {
				paddingTop: '2vh',
				paddingBottom: '2vh'
			})
		});

		gsap.timeline({
			scrollTrigger:{
				trigger:'#scrollBegin',
				
				start:'top top',
				end:'bottom bottom',
				endTrigger: '#hero1',
				scrub: 1}
			})
			.to('#her0', {marginLeft: '1000px'}, 0)
			.to('#her1', {marginLeft: '-1000px'}, 0)
	})
</script>

<div class="doorman" bind:this={doorman}>
    <svg version="1.1" id="svg10" viewBox="0 0 614 345" fill="white" bind:this={doormansvg}>
		<path 
			style="stroke-width:4px;stroke:#1f1587;fill:transparent;"
			d="M 445.48828,82.320312 170.62695,110.33398 v 150.24219 l 155.03711,-15.82422 v -68.55859 l 100.24414,-10.63672 0.30274,-57.60156 -231.42774,22.61719 v 56.1289 l 106.08399,-10.56445 v 57.86523 L 184.04687,246.53711 V 122.58594 L 434.50586,97.070312 v 75.759768 l -99.58203,10.04687 v 40.91016 h 1.59961 v -39.46289 l 99.58203,-10.04688 V 95.298828 L 182.44727,121.14063 V 248.31836 L 302.4668,235.43945 v -61.07031 l -106.08399,10.56445 v -52.91015 l 228.22071,-22.30469 -0.28907,54.39844 -100.25,10.63672 v 68.55273 L 172.22656,258.80469 V 111.7793 L 443.88867,84.091797 V 183.9082 l -98.10547,9.5293 v 19.12109 h 1.59961 v -17.66797 l 98.10547,-9.52929 z"
			id="path25"
		/>
	</svg>
</div>

<CursorDiv />
<Header />



<div class="herocontainer first" id="hero0">
	<div id="scrollBegin0"></div>
	<h1 class="hero" id="her0">Siven<b>Panda</b></h1>
	<h1 id="her1">Dev&<b>GraphicDsgn</b></h1>
</div>
<div class="fullheight showcasedeck" id="hero1">
	<h2 class="idea">development</h2>
	<div>
		<Perspective displayImage="/images/retroim.png" url="https://flyretrograde.com">
			<img slot="headerim" src="/images/retrograde_wh.png" alt="" />
		</Perspective>
	</div>
	<div>
		<Perspective displayImage="/images/sbim.png" url="https://github.com/sivepanda/soundbits">
			<img slot="headerim" src="/images/bits.svg" alt="" />
		</Perspective>
	</div>
	<div>
		<Perspective
			displayImage="/images/nuwrldim.png"
			url="https://sivepanda.github.io/tsawebmaster22/public_html/"
		>
			<img slot="headerim" src="/images/nw22.png" alt="" />
		</Perspective>
	</div>
	<div>
		<Perspective displayImage="/images/ghim.png" url="https://github.com/sivepanda">
			<img slot="headerim" src="/images/github-mark-white.png" alt="" />
		</Perspective>
	</div>
</div>
<div class="fullheight gallery" bind:this={gallery}>
	<h2 bind:this={photoHeadline} class="intersec-obs-gall-h2">photography</h2>
	<!-- <IntersectionObserved classname="intersec-obs-gall-h2"><h2 class="idea">&gt;&gt; photography</h2></IntersectionObserved> -->
	<div class="images" bind:this={photos}>
		<img src="../images/photos/DSC_2913.JPG" alt="" />
		<img src="../images/photos/_MG_9697.JPG" alt="" />
		<img src="../images/photos/DSC_6566.JPG" alt="" />
		<img src="../images/photos/DSC_6117.png" alt="" />
		<img src="../images/photos/DSC_5527_Edit.jpg" alt="" />
		<img src="../images/photos/DSC_5347.png" alt="" />
	</div>
</div>

<div class="fullheight" />

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
    .doorman {
        background-color: black;
        height: 100vh;
        width: 100vw;
        position: absolute;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        clip-path: url(#path25);
    }
    .doorman svg {
        width: 20%;
		transform: rotateY(270deg);
		opacity: 0;
    }
	.herocontainer {
		padding-left: 0px;
		left: 0px;
		margin-top: 0vh;
		padding-top: 0vh;
		height: 100vh;
		background: linear-gradient(rgba(0, 0, 0, 0), var(--almostblack)),
			url('/images/photos/DSC_3076.JPG');
		background-size: fill;
		background-position: center;
		display: flex;
		flex-direction: column;
		justify-content: start;
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
		background: url('/images/photos/DSC_6492.JPG');
		z-index: 2;
		padding-top: 15vh;
		font-size: 30vh;
		margin-top: 0vh;
		background-position: center;
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		filter: brightness(1000%) invert(100) grayscale(90%) hue-rotate(20deg);
		transition: ease 200ms;
	}
	#her1 {
		background: url('/images/photos/DSC_6492.JPG');
		-webkit-text-fill-color: transparent;
		font-size: 12vh;
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
		padding-bottom: 2vh;
	}

	.intersec-obs-gall-h2 {
		left: 5vw;
		grid-row: 1;
		color: #181818 !important;
		grid-column: 1 !important;
		align-self: left;
		justify-self: left;
		color: #181818 !important;
		width: 20vw;
		text-align: center;
		padding: 0px;
		margin: 0px;
	}

	.gallery {
		background: var(--light);
		/* padding-top: 3vh; */
		width: 99svw;
		height: auto;
		display: grid !important;
		align-items: center !important;
		padding: 0px;
		padding-bottom: 8vh;
		border-radius: 20px 20px 20px 20px;
		box-shadow: black 0px -10px 10px;
		overflow-y: hidden;
	}

	.gallery .images {
		padding-left: 5vw;
		opacity: 0;
		padding-right: 5vw;
	}

	.gallery img {
		height: 40vh;
		width: auto;
		border-radius: 20px;
		transition: 200ms all ease-in-out;
	}

	.gallery img:hover {
		transform: scaleX(110%) scaleY(110%);
		background-size: cover;
		transition: 200ms all ease-in-out;
	}
</style>
