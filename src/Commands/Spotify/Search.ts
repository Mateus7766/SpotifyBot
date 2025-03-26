import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Busca por músicas, álbuns ou artistas no Spotify')
        .addStringOption((option) =>
            option.setName('query')
                .setDescription('Nome da música, álbum ou artista que deseja buscar')
                .setRequired(true)
        ),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use `/login` para logar!' });
        }
        
        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const query = interaction.options.getString('query', true);
        
        try {
            const searchResults = await spotify.search(query, ['track', 'album', 'artist'], { limit: 5 });
            console.log(searchResults);
            if (!searchResults.body.tracks?.items.length && !searchResults.body.albums?.items.length && !searchResults.body.artists?.items.length) {
                return interaction.followUp({ content: 'Nenhum resultado encontrado para essa busca.' });
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔎 Resultados para "${query}"`)
                .setColor('#1DB954');
            
            if (searchResults.body.tracks?.items.length) {
                embed.addFields({ name: '🎵 Músicas', value: searchResults.body.tracks.items.map(track => `[${track.name}](${track.external_urls.spotify}) - ${track.artists.map(a => a.name).join(', ')}`).join('\n') });
            }
            
            if (searchResults.body.albums?.items.length) {
                embed.addFields({ name: '📀 Álbuns', value: searchResults.body.albums.items.map(album => `[${album.name}](${album.external_urls.spotify}) - ${album.artists.map(a => a.name).join(', ')}`).join('\n') });
            }
            
            if (searchResults.body.artists?.items.length) {
                embed.addFields({ name: '🎤 Artistas', value: searchResults.body.artists.items.map(artist => `[${artist.name}](${artist.external_urls.spotify})`).join('\n') });
            }
            
            return interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao buscar informações. Tente novamente mais tarde.' });
        }
    }
};

