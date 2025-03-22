import SpotifyWebApi from 'spotify-web-api-node';
import { User } from '../Sructures/User.js';

const individualUserSpotifyApi = new Map<string, SpotifyWebApi>();

async function setIndividualUserSpotifyApi(userid: string) {
    individualUserSpotifyApi.set(userid, new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/callback'
    }));

    const user = await User.findOne({ id: userid });

    if (user) {
        const api = individualUserSpotifyApi.get(userid) as any;
        api.setAccessToken(user.spotifyToken);
    }
}

export {
    individualUserSpotifyApi,
    setIndividualUserSpotifyApi
}