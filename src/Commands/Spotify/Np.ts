import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Ve oque está tocando no Spotify'),
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
            const artists = track.artists.map((artist) => `[${artist.name}](${artist.external_urls.spotify})`).join(', ');
            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setAuthor({
                    url: track.external_urls.spotify ?? '',
                    name: 'Tocando Agora',
                    iconURL: 'https://media.discordapp.net/attachments/1288079277304315969/1352839250755846194/Spotify_logo_without_text.svg.png?ex=67df793b&is=67de27bb&hm=a61026b4f1055ba13520609df452b757aab441d725f2ebf17bd80fa47c876238&=&format=webp&quality=lossless&width=265&height=265'
                })
                .setDescription(`Artistas: ${artists}`)
                .setThumbnail(track.album.images?.[0]?.url ?? '')
                .addFields([
                    { name: 'Álbum', value: `[${track.album.name}](${track.album.external_urls.spotify})`, inline: true },
                    {
                        name: 'Duração',
                        value: `${Math.floor(track.duration_ms / 60000)}:${String(
                            Math.floor((track.duration_ms % 60000) / 1000)
                        ).padStart(2, '0')}`,
                        inline: true
                    },
                    {
                        name: 'Explícita',
                        value: track.explicit ? 'Sim' : 'Não',
                        inline: true
                    },
                    {
                        name: 'Popularidade',
                        value: `${track.popularity}`,
                        inline: true
                    },
                    {
                        name: 'Lançamento',
                        value: track.album.release_date,
                        inline: true
                    }
                ]);
            await interaction.followUp({ embeds: [embed] });
        }
    }
};