import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('recenttracks')
        .setDescription('Mostra as músicas tocadas recentemente no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use o comando `/login` para logar!' });
        }

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;

        try {
            const response = await spotify.getMyRecentlyPlayedTracks({ limit: 10 });
            const tracks = response.body.items;

            if (!tracks.length) {
                return interaction.followUp({ content: 'Nenhuma música recente encontrada.' });
            }
            
            const trackList = tracks.map((track, index) => 
                `${index + 1}. [**${track.track.name}**](https://open.spotify.com/track/${track.track.id})\n    ↳ Tocada: <t:${Math.round((new Date(track.played_at)).getTime() / 1000)}:R>`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('🎶 Músicas Recentemente Tocadas')
                .setDescription(`Aqui estão suas músicas tocadas recentemente no Spotify:\n\n${trackList}`);

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
