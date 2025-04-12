// src/routes/api/now-playing/+server.ts
import { json } from '@sveltejs/kit';
import {
    SPOTIFY_REFRESH_TOKEN,
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET
} from '$env/static/private';

export async function GET() {
    const authBuffer = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
        'base64'
    );

    const refreshRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code: SPOTIFY_REFRESH_TOKEN,
            redirect_uri: 'https://sivenpanda.com'
        })
    });

    const { access_token } = await refreshRes.json();
    console.log('access tok', await access_token);

    const nowPlayingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    if (nowPlayingRes.status === 204 || nowPlayingRes.status > 400) {
        return json({ isPlaying: false });
    }

    const song = await nowPlayingRes.json();
    console.log('here');
    return json({
        isPlaying: song.is_playing,
        title: song.item.name,
        artist: song.item.artists.map((a: any) => a.name).join(', '),
        album: song.item.album.name,
        image: song.item.album.images[0]?.url,
        url: song.item.external_urls.spotify
    });
}
