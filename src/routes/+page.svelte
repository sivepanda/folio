<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Header from '../components/Header.svelte';
    import gsap from 'gsap';
    import {ScrollTrigger} from 'gsap/dist/ScrollTrigger';

    onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
        console.log("hello")
		if(browser) {
			gsap.from('.langbox', {marginLeft: '50%'})

			gsap.timeline({
				scrollTrigger: {
					trigger: '.dev',
					start:'top top',
					end:'bottom bottom',
					endTrigger: '.experience',
					scrub: 1
				}
			})
			.to('.langbox', {marginLeft: '-100%'}, 0)
		}
	});
</script>

<Header />

<div class="main">
    <div class="hero">
        <h1>Hey, I'm Siven!</h1>
        <h2>I code, design, and take pictures sometimes</h2>
        <p>
            I'm a computer science student at Duke University. My goal is to create software and
            experiences that enable both equity and efficiency across many fields, whether it be
            health, education, or software development.
        </p>
    </div>
    <div class="dev">
        <h1>Development</h1>
        <p>
            I program in a number of languages and principles, from frontend and design to backend,
            to simple scripts. Most of my work is done in Java and JS/TS, but I have worked
            extensively with Python, Rust, C, and C++
        </p>
        <h2>Favorite/Frequent Languages and Tools</h2>
        <div class="langs">
            <div class="langbox">
                <p>Java</p>
                <p>Python</p>
                <p>TypeScript</p>
                <p>Svelte</p>
                <p>Next.js</p>
                <p>Huggingface</p>
                <p>Rust</p>
            </div>
        </div>
    </div>
    <div class="experience">
        <h1>Experience</h1>
        <h2>Oklahoma Medical Research Foundation</h2>
        <p>
            Experimented with Transformer and Convolutional Machine Learning models in Python to 
            determine the viability of a feature reduction model over an entire genomic track.
        </p>

        Robotics Match Predictor

        Win Predictor for FIRST Robotics with 85% accuracy; Using Sci-kit Learn, I coded cross validation (feature importance) by way of Random Forest Classifiers. In addition, ran a binary classification to train the data on accuracy. Data utilized from Statbotics API.
    </div>
</div>

<style>
    .main {
        background: rgb(31, 31, 46);
        height: 100vh;
        width: 100vw;
    }

    .hero {
        background: linear-gradient(90deg, rgb(31, 31, 46) 60%, rgba(31, 31, 46, .4) 80%, rgba(0, 0, 0, 0)),
            url('/images/DSC_7287.JPG');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: right;
        height: 100vh;
        display: flex;
        flex-direction: column;
        padding-left: 5vw;
        padding-bottom: 0px;
        justify-content: center;
    }

    .hero > h1 {
        font-size: 15vh;
        margin-bottom: 0vh;
        padding-bottom: 0vh;
    }

    .hero > h2 {
        font-family: 'Urbanist', 'sans-serif';
        font-weight: 450;
        font-size: 5svh;
        margin-top: 1vh;
        margin-bottom: 2vh;
    }

    .hero > p {
        width: 40vw;
        line-height: 1.5;
    }

    .dev, 
    .experience {
        height: 100vh;
        display: flex;
        flex-direction: column;
        padding-left: 5vw;
    }

    .dev > h1,
    .experience > h1 {
        font-size: 15vh;
        margin-bottom: .5em;
        padding-bottom: 0;
    }

    .dev > p,
    .experience > p {
        width: 50vw;
        font-size: 1.2em;
        line-height: 1.5;
        padding-top: 0px;
        margin-top: 0;
    }

    .dev .langs {
        width: calc(100vw - 5vw - 5vw); 
        /* padding-bottom: 2vh; */
        overflow-x: hidden;
        left: 0;
        margin-left: 0;
        height: 24vh;
        padding-left: -200vw;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0) 100%);
        background-clip: text;
        -webkit-background-clip: text;
    }

    .langs > .langbox {
        height: 24vh;
        padding-bottom: 2vh;
        margin: 0;
        /* margin-left: 50%; */
        padding: 0;
        display:flex;
        flex-direction: row;
        overflow-y: hidden;
        overflow-x: hidden;
    }

    .dev .langbox > p {
        color: transparent;
        font-size: 5em;
        font-family: 'Gloock', 'serif' !important;
        padding-left: 1vw;
        height: 22vh;
    }

    .experience {
        background: linear-gradient(180deg, rgb(31, 31, 46) 0%, rgba(100, 0, 200, 1) 100%);
    }

</style>
