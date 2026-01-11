<script>
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let musicHidden = $state(false);

    onMount(() => {
        if (browser) {
            musicHidden = localStorage.getItem('nowPlayingDismissed') === 'true';
        }
    });

    function toggleMusic() {
        if (browser) {
            if (musicHidden) {
                localStorage.removeItem('nowPlayingDismissed');
                localStorage.removeItem('nowPlayingDismissedTime');
            } else {
                localStorage.setItem('nowPlayingDismissed', 'true');
                localStorage.setItem('nowPlayingDismissedTime', Date.now().toString());
            }
            window.location.reload();
        }
    }
</script>

<div class="social">
    <p class="name">//maybesivenpanda</p>
    <div class="brandimgs">
        <a aria-label="Email" href="mailto:siven.panda@duke.edu" target="_blank">
            <i class="fa-solid fa-envelope"></i>
        </a>
        <a aria-label="GitHub" href="https://github.com/sivepanda" target="_blank">
            <i class="ri-github-fill"></i>
        </a>
        <a aria-label="LinkedIn" href="https://www.linkedin.com/in/sivenp" target="_blank">
            <i class="ri-linkedin-fill"></i>
        </a>
        <a
            aria-label="Spotify"
            href="https://open.spotify.com/user/sivenpanda2005?si=db790b52f868409f"
            target="_blank"
        >
            <i class="ri-spotify-fill"></i>
        </a>
        <button onclick={toggleMusic} class="music-toggle">
            <i class="ri-music-2-line"></i> {musicHidden ? 'show' : 'hide'} music widget
        </button>
    </div>
</div>

<style>
    a {
        text-decoration: none;
    }
    .social {
        min-height: 8vh;
        background: rgb(11, 11, 26);
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding: 2vh 5vw;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 0.6rem;
    }

    .social > .brandimgs {
        display: flex;
        font-size: 2vh;
        flex-direction: row;
        gap: 1em;
        height: 100%;
        align-items: center;
        justify-content: flex-start;
        line-height: 1;
    }

    .name {
        font-size: 2rem;
        letter-spacing: 0.02em;
        line-height: 1;
        margin: 0;
        font-weight: 650;
    }

    .brandimgs > a {
        display: flex;
        align-items: center;
    }

    .brandimgs > a {
        color: white;
    }

    .brandimgs > a:hover {
        color: gray;
    }

    .music-toggle {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 0.75rem;
        padding: 0.3em 0.6em;
        display: flex;
        align-items: center;
        gap: 0.4em;
        transition: all 0.2s ease;
    }

    .music-toggle:hover {
        border-color: rgba(255, 255, 255, 0.6);
        color: white;
    }
</style>
