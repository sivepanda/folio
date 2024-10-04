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
    <div class="sect dev">
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
    <div class="sect experience">
        <h1>Experience</h1>
        <!-- Onhov to org colors -->
        <!-- Register domain on aws -->
        <h2>Oklahoma Medical Research Foundation</h2>
        <p>
            Experimented with Transformer and Convolutional Machine Learning models in Python to 
            determine the viability of a feature reduction model over an entire genomic track. Included 
            building custom tokenizers to convert research standard BED files into vectors.
        </p>

        <h2>University of Central Oklahoma</h2>
        <p>
            Utilized Large Language Models and text classifiers (OpenAI API and LangChain) to create a web
            resource for students to generate practice tests from a PDF of notes. Text classification via LangChain
            allowed for users to select a number of questions from particular generalized concepts generated from the notes.
        </p>
        
        <h2>FIRST Robotics Match Optimization</h2>
        <p>
            Built matchup optimizer utilizing Random Forest Classifiers and data pulled from official
            FIRST APIs to train a Random Forest Classifier alongside Binary Classification to predict wins
            to about an 85% accuracy rate. Included a Svelte frontend and visualization to inform match strategy.
        </p>
        
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

    .sect {
        display: flex;
        flex-direction: column;
        padding-left: 5vw;
    }

    .sect > h1 {
        font-size: 15vh;
        margin-bottom: .5em;
        padding-bottom: 0;
    }

    .sect> p {
        width: 50vw;
        font-size: 1.2em;
        line-height: 1.5;
        padding-top: 0px;
        margin-top: 0;
    }

    .dev {
        height: 100vh;
    }

    .experience {
        height: 120vh;
        background: linear-gradient(180deg, rgb(31, 31, 46) 0%, rgba(100, 0, 200, 1) 100%);
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

</style>
