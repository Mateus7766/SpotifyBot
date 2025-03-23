import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { generateAuthLinkSpotify } from '../../Utils/GenerateAuthLink.js';
import { client, Spotcord } from '../../Sructures/Client.js';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { createCanvas, loadImage } from 'canvas';


export const command = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Faz login no Spotify'),

    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const authLink = generateAuthLinkSpotify(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('Discfy - Sistema de Login')
            .setColor(0x1DB954)
            .setFooter({ text: 'Aguardando login...' })
            .setDescription(`<a:loading2:1353491864182980688> [Clique aqui](${authLink}) para fazer login no Spotify!`);

        await interaction.editReply({ embeds: [embed] });

        const userLoggedListener = async (userId: string) => {
            if (userId === interaction.user.id) {
                const spotify = individualUserSpotifyApi.get(interaction.user.id);
                const spotifyAcc = await spotify?.getMe();
                const imageUrl = spotifyAcc?.body.images?.[0]?.url || "https://placehold.co/400x400.png";

                if (spotifyAcc?.body.images?.[0]?.url) {
                    try {



                        const img = await loadImage(imageUrl);
                        const canvas = createCanvas(100, 100);
                        const ctx = canvas.getContext('2d');

                        ctx.drawImage(img, 0, 0, 100, 100);

                        const imageBuffer = canvas.toBuffer('image/png');
                        const attachment = new AttachmentBuilder(imageBuffer, { name: 'resized-thumbnail.png' });

                        const successEmbed = new EmbedBuilder()
                            .setTitle('Discfy - Sistema de Login')
                            .setThumbnail('attachment://resized-thumbnail.png')
                            .setColor(0x1DB954)
                            .setTimestamp()
                            .setDescription(`<a:verified_done_accept:1353493474313244682>  Login feito com sucesso! Agora você pode usar os comandos do Spotify!`);

                        await interaction.editReply({ embeds: [successEmbed], files: [attachment] });

                    } catch (error) {
                        console.error("Erro ao redimensionar a imagem:", error);
                    }
                } else {
                    const successEmbed = new EmbedBuilder()
                        .setTitle('Discfy - Sistema de Login')
                        .setThumbnail(imageUrl)
                        .setColor(0x1DB954)
                        .setTimestamp()
                        .setDescription(`<a:verified_done_accept:1353493474313244682>  Login feito com sucesso! Agora você pode usar os comandos do Spotify!`);

                    await interaction.editReply({ embeds: [successEmbed] });
                }

                client.off('userLogged', userLoggedListener);
            }
        };

        client.on('userLogged', userLoggedListener);
    },
};
