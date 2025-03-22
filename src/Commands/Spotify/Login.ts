import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { generateAuthLinkSpotify } from '../../Utils/GenerateAuthLink.js';
import { EmbedBuilder } from 'discord.js';
import { client, Spotcord } from '../../Sructures/Client.js';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Faz login no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const authLink = generateAuthLinkSpotify(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setThumbnail('https://media.discordapp.net/attachments/1288079277304315969/1352782014389944440/spotify-seeklogo.png?ex=67df43ed&is=67ddf26d&hm=1cfed352656e6a57245ec5d66448af4155898c026c077ba92618be869102938d&=&format=webp&quality=lossless&width=958&height=958')
            .setDescription(`<a:loading:1352819728187658363> [Clique aqui](${authLink}) para fazer login no Spotify!\n\n-# ***Ao finalizar o login volte para esse chat.***`);
        await interaction.editReply({ embeds: [embed] });

        const userLoggedListener = async (userId: string) => {
            if (userId === interaction.user.id) {

                const spotify = individualUserSpotifyApi.get(interaction.user.id);

                const spotifyAcc = await spotify?.getMe();

                const successEmbed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setThumbnail(spotifyAcc?.body.images?.[0]?.url || 'https://cdn3.emoji.gg/emojis/34203-correct.png')
                    .setDescription(`Login feito com sucesso! Agora você pode usar os comandos do Spotify!\nSpotify Logado: ${spotifyAcc?.body.display_name}`);
                await interaction.editReply({ embeds: [successEmbed] });
                client.off('userLogged', userLoggedListener);
            }
        };

        client.on('userLogged', userLoggedListener);
    },
};