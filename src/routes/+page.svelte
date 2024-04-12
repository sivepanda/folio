<script>
    import Header from '../components/Header.svelte';
</script>

<Header />

<div class="main">
    <div class="hero">
        <h1>Hey, I'm Siven!</h1>
        <h2>I code, design, and take pictures sometimes</h2>
        <p>
            I'm a computer science student at &lbrace; &rbrace;. My goal is to create software and
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
    </div>
</div>

<style>
    .main {
        background: rgb(31, 31, 46);
        height: 100vh;
        width: 100vw;
    }

    .hero {
        background: linear-gradient(90deg, rgb(31, 31, 46) 40%, rgba(0, 0, 0, 0)),
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

    .dev {
        height: 100vh;
        display: flex;
        flex-direction: column;
        padding-left: 5vw;
    }

    .dev > h1 {
        font-size: 15vh;
    }

    .dev > p {
        width: 50vw;
        line-height: 1.5;
    }
</style>
