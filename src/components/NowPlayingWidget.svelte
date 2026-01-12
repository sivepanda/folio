<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    /** @type {any} */
    let nowPlaying = $state(null);
    let isVisible = $state(true);
    let isLoading = $state(true);
    /** @type {string | null} */
    let error = $state(null);

    // Check localStorage for dismiss state
    onMount(() => {
        if (browser) {
            const dismissed = localStorage.getItem('nowPlayingDismissed');
            const dismissedTime = localStorage.getItem('nowPlayingDismissedTime');

            // Reset visibility after 24 hours
            if (dismissed && dismissedTime) {
                const dayInMs = 24 * 60 * 60 * 1000;
                if (Date.now() - parseInt(dismissedTime) > dayInMs) {
                    localStorage.removeItem('nowPlayingDismissed');
                    localStorage.removeItem('nowPlayingDismissedTime');
                    isVisible = true;
                } else {
                    isVisible = false;
                }
            }

            if (isVisible) {
                fetchNowPlaying();
                // Refresh every 2 minutes
                const interval = setInterval(fetchNowPlaying, 120000);
                return () => clearInterval(interval);
            }
        }
    });

    async function fetchNowPlaying() {
        try {
            isLoading = true;
            error = null;
            const response = await fetch('/api/now-playing');
            console.log(response);
            const data = await response.json();
            
            if (data.error) {
                error = data.error;
                nowPlaying = null;
            } else {
                nowPlaying = data;
            }
        } catch (err) {
            error = 'Failed to fetch now playing data';
            nowPlaying = null;
        } finally {
            isLoading = false;
        }
    }

    function dismiss() {
        isVisible = false;
        if (browser) {
            localStorage.setItem('nowPlayingDismissed', 'true');
            localStorage.setItem('nowPlayingDismissedTime', Date.now().toString());
        }
    }

    /** @param {string | number | Date} timestamp */
    function formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        const now = new Date();
        const then = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes === 1) return '1 min ago';
        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours === 1) return '1 hr ago';
        if (diffInHours < 24) return `${diffInHours} hrs ago`;
        
        return then.toLocaleDateString();
    }
</script>

{#if isVisible && (nowPlaying?.isPlaying || nowPlaying?.isRecent)}
    <div class="now-playing-widget" class:loading={isLoading}>
        <button class="dismiss-btn" onclick={() => dismiss()} aria-label="Dismiss now playing">
            <i class="ri-close-line"></i>
        </button>
        
        {#if isLoading}
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>Loading...</span>
            </div>
        {:else if nowPlaying}
            <div class="track-info">
                <div class="album-art">
                    <img 
                        src={nowPlaying.image} 
                        alt="Album cover for {nowPlaying.album}"
                        onerror={(e) => {if (e.target instanceof HTMLImageElement) e.target.src='/favicon.png'}}
                    />
                    
                </div>
                
                <div class="track-details">
                    <div class="status">
                        {#if nowPlaying.isPlaying}
                            <i class="ri-music-2-line"></i>
                            <span>Now Playing</span>
                        {:else}
                            <i class="ri-time-line"></i>
                            <span>Recently Played {formatTimeAgo(nowPlaying.timestamp)}</span>
                        {/if}
                    </div>
                    
                    <div class="track-title">{nowPlaying.title}</div>
                    <div class="track-artist">{nowPlaying.artist}</div>
                    {#if nowPlaying.album && nowPlaying.album !== 'Unknown Album'}
                        <div class="track-album">{nowPlaying.album}</div>
                    {/if}
                    
                    <a 
                        href={nowPlaying.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="lastfm-link"
                    >
                        <i class="ri-external-link-line"></i>
                        View on Last.fm
                    </a>
                </div>
            </div>
        {/if}
    </div>
{:else if isVisible && error}
    <div class="now-playing-widget error">
        <button class="dismiss-btn" onclick={() => dismiss()} aria-label="Dismiss error">
            <i class="ri-close-line"></i>
        </button>
        <div class="error-content">
            <i class="ri-error-warning-line"></i>
            <span>Unable to load music data</span>
        </div>
    </div>
{/if}

<style>
    .now-playing-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(11, 11, 26, 0.35);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        max-width: 320px;
        min-width: 280px;
        color: white;
        font-family: 'Mozilla Text', sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
        animation: slideIn 0.5s ease-out;
    }

    .now-playing-widget:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }

    .now-playing-widget.loading {
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .dismiss-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
    }

    .dismiss-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .loading-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
    }

    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .track-info {
        display: flex;
        gap: 12px;
        padding-right: 16px;
    }

    .album-art {
        position: relative;
        flex-shrink: 0;
        align-self: center;
    }

    .album-art img {
        width: 90px;
        height: 90px;
        border-radius: 8px;
        object-fit: cover;
        background: rgba(255, 255, 255, 0.1);
    }

    .track-details {
        flex: 1;
        min-width: 0;
    }

    .status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 6px;
    }

    .status i {
        font-size: 14px;
    }

    .track-title {
        font-weight: 500;
        font-family: 'Mozilla Headline', sans-serif;
        font-size: 16px;
        line-height: 1.2;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .track-artist {
        font-size: 14px;
        color: rgba(226, 226, 226, 0.8);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .track-album {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .lastfm-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: rgba(255, 100, 150, 0.8);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .lastfm-link:hover {
        color: rgba(255, 100, 150, 1);
    }

    .error {
        background: rgba(255, 50, 50, 0.1);
        border-color: rgba(255, 50, 50, 0.3);
    }

    .error-content {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255, 100, 100, 0.9);
        font-size: 14px;
        padding-right: 16px;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 640px) {
        .now-playing-widget {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            min-width: auto;
        }

        .track-info {
            gap: 10px;
        }

        .album-art img {
            width: 56px;
            height: 56px;
        }

        .track-title {
            font-size: 15px;
        }

        .track-artist {
            font-size: 13px;
        }
    }

    @media (max-width: 480px) {
        .now-playing-widget {
            padding: 12px;
        }

        .track-details {
            font-size: 14px;
        }

        .track-title {
            font-size: 14px;
        }

        .track-artist {
            font-size: 12px;
        }
    }
</style>