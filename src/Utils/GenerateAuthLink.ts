import queryString from "query-string"
import { randomBytes } from 'crypto';

const tempIds = new Map<string, string>();
const discordUsersId = new Map<string, string>();

function generateAuthLinkSpotify(userid: string) {

    const tempId = randomBytes(16).toString('hex');
    tempIds.set(tempId, userid);

    const authLink = `https://accounts.spotify.com/authorize?${queryString.stringify({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: "http://localhost:3000/callback",
        scope: "user-read-email user-read-playback-state user-read-currently-playing user-read-recently-played user-top-read",
        state: tempId
    })}`

    return authLink;
}

function generateAuthLinkDiscord() {
    return `https://discord.com/api/oauth2/authorize?${queryString.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: "http://localhost:3000/discord_callback",
        response_type: "code",
        scope: "identify"
    })}`
}

export {
    tempIds,
    generateAuthLinkSpotify,
    generateAuthLinkDiscord,
    discordUsersId,
}