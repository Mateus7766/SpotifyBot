import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('albuminfo')
        .setDescription('Exibe informações sobre um álbum no Spotify')
        .addStringOption(option =>
            option.setName('album')
                .setDescription('Nome do álbum para buscar')
                .setRequired(true)
        ),

    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use o comando `/login` para logar!' });
        }

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const albumName = interaction.options.getString('album', true);

        try {
            const response = await spotify.searchAlbums(albumName, { limit: 1 });
            if (!response.body.albums) {
                return interaction.followUp({ content: 'Erro ao obter dados do álbum no Spotify. Tente novamente mais tarde.' });
            }

            const album = response.body.albums.items[0];
            if (!album) {
                return interaction.followUp({ content: 'Álbum não encontrado.' });
            }

            const albumData = await spotify.getAlbum(album.id);
            const albumDetails = albumData.body;

            const albumLink = `https://open.spotify.com/album/${album.id}`;
            const releaseDate = albumDetails.release_date;
            const totalTracks = albumDetails.total_tracks;
            const artists = albumDetails.artists.map(artist => `[${artist.name}](${artist.external_urls.spotify})`).join(', ');
            const imageUrl = albumDetails.images?.[0]?.url || "https://placehold.co/600x600.png";
            const label = albumDetails.label || "Desconhecido";
            const popularity = albumDetails.popularity;
            const copyrights = albumDetails.copyrights.map(c => c.text).join('\n') || "Nenhum copyright disponível.";
            const genres = albumDetails.genres.length > 0 ? albumDetails.genres.join(', ') : "Gênero não especificado.";

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle(`🎶 Álbum: **${albumDetails.name}**`)
                .setURL(albumLink)
                .setThumbnail(imageUrl)
                .addFields({ name: "ℹ️ Copyrights", value: copyrights })
                .setDescription(`🎤 **Artista(s):** ${artists}\n📅 **Lançamento:** ${releaseDate}\n🎵 **Total de faixas:** ${totalTracks}\n🏷️ **Gravadora:** ${label}\n🔥 **Popularidade:** ${popularity}/100\n🎧 **Gênero(s):** ${genres}`)
                .setFooter({ text: "Informações obtidas via Spotify Web API" });

            const button = new ButtonBuilder()
                .setCustomId('show_tracks')
                .setLabel('Ver faixas')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            const message = await interaction.followUp({ embeds: [embed], components: [row] });

            const filter = (i: any) => i.customId === 'show_tracks' && i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                const trackNames = albumDetails.tracks.items.map((track, i) => `${i}. [${track.name}](${track.external_urls.spotify})`).join('\n');
                const trackEmbed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle(`🎶 Faixas do álbum: **${albumDetails.name}**`)
                    .setDescription(trackNames)
                    .setFooter({ text: "Informações obtidas via Spotify Web API" });

                await i.update({ embeds: [trackEmbed], components: [] });
                collector.stop();
            });

            collector.on('end', async () => {
                await interaction.editReply({ components: [] });
            });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do álbum no Spotify. Tente novamente mais tarde.' });
        }
    }
};
