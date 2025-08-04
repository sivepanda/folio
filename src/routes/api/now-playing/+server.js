import { json } from '@sveltejs/kit';
import { LASTFM_API_KEY, LASTFM_USERNAME } from '$env/static/private';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
            return json({ 
                isPlaying: false, 
                error: 'Last.fm API credentials not configured' 
            });
        }

        const params = new URLSearchParams({
            method: 'user.getRecentTracks',
            user: LASTFM_USERNAME,
            api_key: LASTFM_API_KEY,
            format: 'json',
            limit: '1'
        });

        const response = await fetch(`${LASTFM_API_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Last.fm API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Last.fm API error: ${data.message}`);
        }

        const tracks = data.recenttracks?.track;
        if (!tracks || tracks.length === 0) {
            return json({ isPlaying: false });
        }

        const track = Array.isArray(tracks) ? tracks[0] : tracks;
        const isCurrentlyPlaying = track['@attr']?.nowplaying === 'true';
        
        // Get the largest available image
        const images = track.image || [];
        const image = images.find(/** @param {any} img */ img => img.size === 'large')?.['#text'] || 
                     images.find(/** @param {any} img */ img => img.size === 'medium')?.['#text'] || 
                     images[images.length - 1]?.['#text'] || 
                     '/favicon.png'; // fallback

        return json({
            isPlaying: isCurrentlyPlaying,
            title: track.name || 'Unknown Track',
            artist: track.artist?.['#text'] || track.artist || 'Unknown Artist',
            album: track.album?.['#text'] || 'Unknown Album',
            image: image,
            url: track.url || `https://www.last.fm/music/${encodeURIComponent(track.artist?.['#text'] || track.artist)}/_/${encodeURIComponent(track.name)}`,
            timestamp: track.date?.uts ? new Date(parseInt(track.date.uts) * 1000) : null,
            isRecent: !isCurrentlyPlaying && track.date?.uts 
                ? (Date.now() - parseInt(track.date.uts) * 1000) < 3600000 // less than 1 hour ago
                : false
        });

    } catch (error) {
        console.error('Error fetching Last.fm data:', error);
        return json({ 
            isPlaying: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
}