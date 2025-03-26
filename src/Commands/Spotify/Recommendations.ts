import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('recommendations')
        .setDescription('Gera recomendações com base em uma busca no Spotify')
        .addStringOption((option) =>
            option.setName('genero')
                .setDescription('Gênero musical para buscar recomendações')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName('quantidade')
                .setDescription('Número de músicas recomendadas (padrão: 5)')
                .setRequired(false)
        ),
        async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply();
            
            const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
            if (!hasIndividualApi) {
                return interaction.followUp({ content: 'Você não está logado no Spotify! Use `/login` para logar!' });
            }
            
            const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
            const genre = interaction.options.getString('genero', true);
            const limit = interaction.options.getInteger('quantidade') || 5;
            
            try {
                const searchResults = await spotify.searchTracks(`genre:${genre}`, { limit });
                if (!searchResults.body.tracks?.items.length) {
                    return interaction.followUp({ content: 'Nenhuma recomendação encontrada para esse gênero.' });
                }
    
                const embed = new EmbedBuilder()
                    .setTitle(`<:Spotify_Search:1354315357422227477> Recomendações para o gênero ${genre}`)
                    .setColor('#1DB954');
    
                searchResults.body.tracks.items.forEach(track => {
                    embed.addFields({ name: track.name, value: `[Ouvir no Spotify](${track.external_urls.spotify}) - ${track.artists.map(a => a.name).join(', ')}` });
                });
    
                return interaction.followUp({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                return interaction.followUp({ content: 'Erro ao buscar recomendações. Tente novamente mais tarde.' });
            }
        }
};

