import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('toptracks')
        .setDescription('Mostra as musicas mais ouvidas no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi)
            return interaction.followUp({
                content: 'Você não está logado no Spotify! Use o comando `/login` para logar!'
            });

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        spotify.getMyTopTracks({ limit: 10 }).then((tracks) => {
            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setAuthor({
                    name: `Top 10 Músicas Mais Ouvidas por ${interaction.user.displayName}`,
                    iconURL: 'https://media.discordapp.net/attachments/1288079277304315969/1352839250755846194/Spotify_logo_without_text.svg.png?ex=67df793b&is=67de27bb&hm=a61026b4f1055ba13520609df452b757aab441d725f2ebf17bd80fa47c876238&=&format=webp&quality=lossless&width=265&height=265'
                })
                .setDescription(tracks.body.items.map((track, index) => {
                    return `**${index + 1}.** [${track.name}](${track.external_urls.spotify}) - ${track.artists.map((artist) => artist.name).join(', ')}`;
                }).join('\n'));
            interaction.followUp({ embeds: [embed] });
        });
    }
};