import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('artistinfo')
        .setDescription('Exibe informações sobre um artista no Spotify')
        .addStringOption(option =>
            option.setName('artist')
                .setDescription('Nome do artista para buscar')
                .setRequired(true)
        ),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use o comando `/login` para logar!' });
        }

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const artistName = interaction.options.getString('artist', true);

        try {
            const response = await spotify.searchArtists(artistName, { limit: 1 });
            if (!response.body.artists) return interaction.followUp({ content: 'Erro ao obter dados do artista no Spotify. Tente novamente mais tarde.' });
            const artist = response.body.artists.items[0];

            if (!artist) {
                return interaction.followUp({ content: 'Artista não encontrado.' });
            }

            const artistLink = `https://open.spotify.com/artist/${artist.id}`;
            const topGenres = artist.genres.length ? artist.genres.join(', ') : 'Não disponível';
            const albumsLink = `https://open.spotify.com/artist/${artist.id}/albums`;
            const topTracksLink = `https://open.spotify.com/artist/${artist.id}/top-tracks`;
            
            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle(`🎶 Artista: **${artist.name}**`)
                .setDescription(`**Gêneros:** ${topGenres}\n[Ouça no Spotify](${artistLink})\n\n**Popularidade:** ${artist.popularity}/100`)
                .setThumbnail(artist.images[0]?.url || 'https://placehold.co/400x400.png')
                .addFields(
                    { name: 'Álbuns', value: `[Ver álbuns do artista](${albumsLink})` },
                    { name: 'Seguidores', value: `${artist.followers.total.toLocaleString()} seguidores` },
                    { name: 'Músicas Populares', value: `[Ver as top tracks](${topTracksLink})` }
                );

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
