import { individualUserSpotifyApi, setIndividualUserSpotifyApi } from "./GenerateIndividualClass.js"
import { User } from "../Sructures/User.js"
import SpotifyWebApi from "spotify-web-api-node"

async function verifyIfHasIndividualApi(userid: string) {
    const user = await User.findOne({ id: userid });
    if (!user) return false;
    let api = individualUserSpotifyApi.get(userid);
    if (!api) {
        await setIndividualUserSpotifyApi(userid);
        api = individualUserSpotifyApi.get(userid) as SpotifyWebApi;
        if(!((Date.now() - user.generatedTime) < (user.expires_in * 1000))) {
            const data = await api.refreshAccessToken();
            if(data.body.access_token) {
                user.spotifyToken = data.body.access_token;
                user.generatedTime = Date.now();
                await user.save();
                api.setAccessToken(data.body.access_token);
                console.log('Token atualizado com sucesso!');
            }
        } else {
            console.log(`Token ainda é válido! Faltam ${(user.expires_in - (Date.now() - user.generatedTime))} segundos para expirar.`);
        }
    }
    return true
}
export { verifyIfHasIndividualApi }