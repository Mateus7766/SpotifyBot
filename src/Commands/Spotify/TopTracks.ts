import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';
import { createCanvas, loadImage } from 'canvas';

export const command = {
    data: new SlashCommandBuilder()
        .setName('toptracks')
        .setDescription('Mostra as músicas mais ouvidas no Spotify')
        .addStringOption((option) =>
            option.setName('periodo')
                .setDescription('O período de tempo para o qual você deseja obter as músicas mais ouvidas')
                .addChoices(
                    { name: 'Últimas 4 semanas', value: 'short_term' },
                    { name: 'Últimos 6 meses', value: 'medium_term' },
                    { name: 'Últimos 12 meses', value: 'long_term' }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('tamanho')
                .setDescription('Escolha o tamanho da área do gráfico')
                .addChoices(
                    { name: '3x3', value: '3x3' },
                    { name: '4x4', value: '4x4' },
                    { name: '5x5', value: '5x5' },
                    { name: '7x7', value: '7x7' }
                )
                .setRequired(true)
        ),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use o comando `/login` para logar!' });
        }

        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const range = interaction.options.getString('periodo', true) as "short_term" | "medium_term" | "long_term";
        const chartSize = interaction.options.getString('tamanho', true);

        try {
            const chartDimensions: { [key: string]: { rows: number, cols: number } } = {
                '3x3': { rows: 3, cols: 3 },
                '4x4': { rows: 4, cols: 4 },
                '5x5': { rows: 5, cols: 5 },
                '7x7': { rows: 7, cols: 7 },
            };

            const { rows, cols } = chartDimensions[chartSize];
            const canvasSize = 900;
            const borderHeight = 50;
            const borderRadius = 20;
            const imageSize = canvasSize / Math.max(rows, cols);
            const fontSize = 20 * (1 / (1 + (rows * cols * 0.01)));
            const canvas = createCanvas(canvasSize, canvasSize + borderHeight);
            const ctx = canvas.getContext('2d');

            const response = await spotify.getMyTopTracks({ limit: rows * cols, time_range: range });
            const tracks = response.body.items;

            if (!tracks.length) {
                return interaction.followUp({ content: 'Nenhuma música encontrada para o período selecionado.' });
            }

            const images = await Promise.all(
                tracks.slice(0, rows * cols).map(track => loadImage(track.album.images[0]?.url || 'https://placehold.co/400x400.png'))
            );
            
            ctx.fillStyle = '#1DB954';
            ctx.beginPath();
            ctx.moveTo(0, borderHeight);
            ctx.arcTo(0, 0, borderRadius, 0, borderRadius);
            ctx.lineTo(canvasSize - borderRadius, 0);
            ctx.arcTo(canvasSize, 0, canvasSize, borderRadius, borderRadius);
            ctx.lineTo(canvasSize, borderHeight);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Aqui está seu chart!`, canvasSize / 2, borderHeight / 1.5);


            images.forEach((image, index) => {
                const x = (index % cols) * imageSize;
                const y = Math.floor(index / cols) * imageSize + borderHeight;
                ctx.drawImage(image, x, y, imageSize, imageSize);

                const artistName = tracks[index].name;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(x, y + imageSize - 32 * (1 / (1 + (rows * cols * 0.01))), imageSize, 35 * (1 / (1 + (rows * cols * 0.01))));
               
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(artistName, x + imageSize / 2, y + imageSize - 10 * (1 / (1 + (rows * cols * 0.01))));
            });

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'toptracks.png' });

            await interaction.followUp({ files: [attachment], content: `-# Source: Spotify Web API` });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
