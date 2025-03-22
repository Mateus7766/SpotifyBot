import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
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
            if(!response.body.albums) return interaction.followUp({ content: 'Erro ao obter dados do álbum no Spotify. Tente novamente mais tarde.' });
            const album = response.body.albums.items[0];

            if (!album) {
                return interaction.followUp({ content: 'Álbum não encontrado.' });
            }

            const albumLink = `https://open.spotify.com/album/${album.id}`;

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle(`🎶 Álbum: **${album.name}**`)
                .setDescription(`Por: **${album.artists.map(artist => artist.name).join(', ')}**\n[Ouça no Spotify](${albumLink})`);

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do álbum no Spotify. Tente novamente mais tarde.' });
        }
    }
};
