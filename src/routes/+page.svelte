<script>
    // import Nokia from 'virtual:icons/cib/nokia'
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Header from '../components/Header.svelte';
    import Load from '../components/Load.svelte';
    import Footer from '../components/Footer.svelte';
    import gsap from 'gsap';
    import {ScrollTrigger} from 'gsap/dist/ScrollTrigger';
    import Animbk from '../components/animbk.svelte';

    let defaul = "rgba(100, 0, 200, 1)";
    let omrf = "rgba(5, 175, 242, 1)";
    let uco = "rgba(0, 57, 114, 1)";
    let frc = "rgba(1, 123, 5, 1)";

    let color =  defaul;

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
<Load />
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

    <div id="skills" class="sect dev">
        <h1>Skills</h1>
        <p>
            I program in a number of languages and with a broad range of principles, from frontend and design to backend,
            to simple scripts. Most of my work is done in Java and JS/TS, but I have worked
            extensively with Python, Rust, C, and C++
        </p>
        <h2>Favorite/Frequent Languages and Tools</h2>
        <div class="langs">
            <div class="langbox">
                <p>Next.js</p>
                <p>React</p>
                <p>Svelte</p>
                <p>Java</p>
                <p>Python</p>
                <p>TypeScript</p>
                <p>Golang</p>
                <p>Huggingface</p>
                <p>Rust</p>
            </div>
        </div>
    </div>

    <div class="sect experience" style="--gradient-to: {color}">
        <h1>Experience</h1>
        <!-- Onhov to org colors -->
        <!-- Register domain on aws -->
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <h2>Duke University Dept. of Biostatics & Bioinformatics</h2>
        <p>
            Working with multi-omic and genetic sequence data to find associations in the genome. More to come!
        </p>
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
    </div>

    <div id="projects" class="sect proj" style="--gradient-to: {color}">
        <h1>Projects</h1>
        <h2>LARI</h2>
        <p>EHR-integrated application that automates managing patient appointment scheduling (and rescheduling).</p>
        <h2>Soundbits</h2>
        <p>Architected, designed and built a social media application that allows users to share and send "bits" of sound that they come across in their daily life, and enable other uses to use them as a library of samples for them to use in their music productions.</p>
        <h2>FIRST Robotics Match Optimizer</h2>
        <p>
            Built matchup optimizer utilizing Random Forest Classifiers and data pulled from official FIRST APIs to train a Random Forest Classifier alongside Binary Classification to predict wins to about an 85% accuracy rate. Included a Svelte frontend and visualization to inform match strategy.
        </p>
        <h2>roundify</h2>
        <p>
            Customized user interface for Firefox (via userchrome.css), includes integration that modifies the default homepage with the daily Astronomy Picture of the Day.
        </p>
        <h2>mtxmathtools</h2>
        <p>CLI matrix computational tool I wrote to make doing linear algebra homework easier. Wrapped in a python package.</p>
    </div>
    <Footer />

    </div>

<style>
    .main {
        background: rgb(31, 31, 46);
        height: 100vh;
        width: 100vw;
    }

    #g1045 {
        stroke: white;
        stroke-width: 0.02;
    }

    .hero {
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
    
    @media (max-aspect-ratio: 1) {
        .hero {
            background: linear-gradient(0deg, rgb(31, 31, 46) 00%, rgba(31, 31, 46, .4) 70%, rgba(0, 0, 0, 0.7)),
                url('/images/DSC_7287.JPG');
            background-position: center;
            background-size: cover;
            background-repeat: no-repeat;
            height: 100vh;
        }

        .hero > h2 {
            font-size: 6vw;
        }

        p {
            padding-right: 5vw;
        }

    }

    @media (min-aspect-ratio: 1) {
        .hero {
            background: linear-gradient(90deg, rgb(31, 31, 46) 60%, rgba(31, 31, 46, .4) 80%, rgba(0, 0, 0, 0)),
                url('/images/DSC_7287.JPG');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: right;
        }

        .hero > p {
            width: 40vw;
        }


        .hero > h2 {
            font-size: 2vw;
        }

        .sect> p {
            width: 50vw;
        }
    }

    .hero > h1 {
        font-size: 8vw;
        margin-bottom: 0vh;
        padding-bottom: 0vh;
    }

    .hero > h2 {
        font-family: 'Urbanist', 'sans-serif';
        font-weight: 450;
        margin-top: 1vh;
        margin-bottom: 2vh;
    }

    .hero > p {
        line-height: 1.5;
    }

    .sect {
        display: flex;
        flex-direction: column;
        padding-left: 5vw;
    }

    .sect > h1 {
        font-size: 8vw;
        margin-bottom: .5em;
        padding-bottom: 0;
    }

    .sect > p {
        font-size: 1.2em;
        line-height: 1.5;
        padding-top: 0px;
        margin-top: 0;
    }

    .dev {
        height: 100vh;
    }

    .experience {
        padding-bottom: 20vh;
        /* height: 120vh; */
        background: linear-gradient(180deg, rgb(31, 31, 46) 0%, var(--gradient-to) 100%);
    }

    .proj {
        background: linear-gradient(180deg, var(--gradient-to) 0%, rgb(20, 0, 100) 100%);
        height: 100vh;
        padding-bottom: 5vh;
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

    .const {
        display: flex;
        flex-direction: column;
        width: 100vw;
        align-items: center;
        align-content: center;
        justify-items: center;
        background-color: black;
        padding: 0;
        padding-bottom: 2vh;
    } 
    .const > h2 {
        width: auto;
        height: auto;
        padding: 0;
        padding-top: 2vh;
        margin: 0;
    }
    .const > p {
        width: auto;
        padding: 0;
        margin: 0;
        font-size: 2vw;
    }


</style>
