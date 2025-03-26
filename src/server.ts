import express from 'express'
import { client } from './Sructures/Client.js'
import { generateAuthLinkDiscord, tempIds, discordUsersId } from './Utils/GenerateAuthLink.js'
import { User } from './Sructures/User.js'
import { setIndividualUserSpotifyApi } from './Utils/GenerateIndividualClass.js'

const app = express()
const port = 3000

const tempToken = new Map<string, string>()
const tempRefreshToken = new Map<string, string>()

app.get('/', (req, res) => {
    res.send('Hello from SpotifyBot =)')
})

app.get('/callback', async (req, res) => {
    const code = req.query.code
    const state = req.query.state
    if (!state || !code) {
        res.send('State or Auth token is missing.')
        return
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: 'http://localhost:3000/callback',
            client_id: process.env.SPOTIFY_CLIENT_ID as string,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET as string
        })
    })

    if (!response.ok) {
        res.send('Falha ao obter o token')
        return
    }

    const autor = tempIds.get(state as string)

    if (!autor) {
        res.send('Consegui obter o token, mas não consegui encontrar o autor da requisição. Portanto, requisicao cancelada.')
        return
    }

    const user = await client.users.fetch(autor)
    if (!user) {
        res.send('Não consegui encontrar o usuário que fez a requisição. Portanto, a requisição foi cancelada.')
        return
    }
    discordUsersId.set(user.id, state as string)

    const tokenData = await response.json()
    const spotifyToken = tokenData.access_token

    tempToken.set(user.id, spotifyToken)
    tempRefreshToken.set(user.id, tokenData.refresh_token)

    res.send(`Login com Spotify feito com sucesso, agora <a href="${generateAuthLinkDiscord()}">Clique aqui</a> para sabermos se quem fez login agora foi: <strong>${user.username} (${user.displayName})</strong>`)
})

// Rota de callback do Discord
app.get('/discord_callback', async (req, res) => {

    // console.log(req.query)

    const code = req.query.code as string

    if (!code) {
        res.send('Code is missing.')
        return
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID as string,
            client_secret: process.env.DISCORD_CLIENT_SECRET as string,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:3000/discord_callback'
        })
    })



    if (!response.ok) {
        res.send('Falha ao obter o token do Discord')
        //console.log(await response.text())
        return
    }

    const tokenData = await response.json()
    const discordToken = tokenData.access_token


    const discordUserResponse = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${discordToken}`
        }
    })

    if (!discordUserResponse.ok) {
        res.send('Falha ao obter dados do usuário do Discord')
        return
    }

    const discordUser = await discordUserResponse.json()

    const autor = tempIds.get(discordUsersId.get(discordUser.id) as string)
    if (!autor) {
        res.send('Não conseguimos encontrar o autor da requisição. Portanto, a requisição foi cancelada.')
        return
    }

    if (discordUser.id !== autor) {
        res.send('Os IDs não coincidem! Acesso negado.')
        return
    }
    const document = await User.findOne({ id: discordUser.id })
    if (!document) {
        const user = new User({
            id: discordUser.id,
            spotifyToken: tempToken.get(discordUser.id) as string,
            refreshToken: tempRefreshToken.get(discordUser.id) as string,
        })

        await user.save()
    } else {
        document.spotifyToken = tempToken.get(discordUser.id) as string
        document.refreshToken = tempRefreshToken.get(discordUser.id) as string
        await document.save()
    }

    tempRefreshToken.delete(discordUser.id)
    tempToken.delete(discordUser.id)
    tempIds.delete(discordUsersId.get(discordUser.id) as string)
    discordUsersId.delete(discordUser.id)

    await setIndividualUserSpotifyApi(discordUser.id)

    client.emit('userLogged', discordUser.id)

    res.send(`<p style="color: green;">Login no Discord realizado com sucesso! O usuário ${discordUser.username} (${discordUser.id}) fez login e é o mesmo que iniciou a requisição.</p>`)
})

app.listen(port, () => {
    console.log(`Servidor online em: http://localhost:${port}`)
})
