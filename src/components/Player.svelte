<script lang="ts">
    import { onMount } from 'svelte';
    let nowPlaying;
  
    onMount(async () => {
      const res = await fetch('/api/now-playing');
      nowPlaying = await res.json();
    });
  </script>
  
  {#if nowPlaying?.isPlaying}
    <div class="now-playing-widget">
      <img src={nowPlaying.image} alt="Album cover" />
      <div>
        <p>{nowPlaying.title} - {nowPlaying.artist}</p>
        <a href={nowPlaying.url} target="_blank">Listen on Spotify</a>
      </div>
    </div>
  {/if}
  