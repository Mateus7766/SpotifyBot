import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('playlists')
        .setDescription('Lista as playlists do usuário no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use o comando `/login` para logar!' });
        }

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;

        try {
            const response = await spotify.getUserPlaylists();
            const playlists = response.body.items;

            if (!playlists.length) {
                return interaction.followUp({ content: 'Você não possui playlists no Spotify.' });
            }

            const playlistList = playlists.map(playlist => `[${playlist.name}](https://open.spotify.com/playlist/${playlist.id})`).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('🎶 Suas Playlists no Spotify')
                .setDescription(`Aqui estão suas playlists no Spotify:\n\n${playlistList}`);

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
