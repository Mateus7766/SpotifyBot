import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('cover')
        .setDescription('Mostra o cover da música que você está ouvindo no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi)
            return interaction.followUp({
                content: 'Você não está logado no Spotify! Use o comando `/login` para logar!'
            });

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const trackResponse = await spotify.getMyCurrentPlayingTrack();
        if (!trackResponse.body.item)
            return interaction.followUp({ content: 'Você não está ouvindo nada no Spotify!' });
        const track = trackResponse.body.item;
        if (track.type === 'track') {
            const coverUrl = track.album.images[0]?.url;
            if (coverUrl) {
                await interaction.followUp({
                    files: [
                        {
                            attachment: coverUrl,
                            name: 'cover.jpg',
                        },
                    ],
                });
            } else {
                await interaction.followUp({ content: 'Não foi possível obter a capa do álbum.' });
            }
        }
    }
};