import { individualUserSpotifyApi, setIndividualUserSpotifyApi } from "./GenerateIndividualClass.js"
import { User } from "../Sructures/User.js"

async function verifyIfHasIndividualApi(userid: string) {
    const user = await User.findOne({ id: userid });
    if(!user) return false;
    const api = individualUserSpotifyApi.get(userid);
    if(!api) {
        await setIndividualUserSpotifyApi(userid);
        return true
    } else return true
}
export { verifyIfHasIndividualApi }