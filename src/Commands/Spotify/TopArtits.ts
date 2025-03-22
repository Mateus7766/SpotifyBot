import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';

export const command = {
    data: new SlashCommandBuilder()
        .setName('topartists')
        .setDescription('Mostra os artistas mais ouvidos no Spotify')
        .addStringOption((option) =>
            option.setName('periodo')
                .setDescription('O período de tempo para o qual você deseja obter os artistas mais ouvidos')
                .addChoices(
                    { name: 'Últimas 4 semanas', value: 'short_term' },
                    { name: 'Últimos 6 meses', value: 'medium_term' },
                    { name: 'Últimos 12 meses', value: 'long_term' }
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

        try {
            const response = await spotify.getMyTopArtists({ limit: 10, time_range: range });
            const artists = response.body.items;

            if (!artists.length) {
                return interaction.followUp({ content: 'Nenhum artista encontrado para o período selecionado.' });
            }

            const artistNames = artists.map(artist => artist.name);
            const artistPopularity = artists.map(artist => artist.popularity);

           
            const width = 800;
            const height = 600;
            const chartCanvas = new ChartJSNodeCanvas({ width, height });
            const chartConfig: any = {
                type: 'bar',
                data: {
                    labels: artistNames,
                    datasets: [{
                        label: 'Popularidade dos Artistas',
                        data: artistPopularity,
                        backgroundColor: '#89CFF0',
                        borderColor: '#4682B4',
                    }]
                },
                options: {
                    indexAxis: 'y', // barras horizontais
                    responsive: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Gêneros mais ouvidos no Spotify',
                            color: '#FFFFFF',
                            font: { size: 18, weight: 'bold' }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#FFFFFF' },
                            grid: { color: '#ddd' }
                        },
                        y: {
                            ticks: { color: '#FFFFFF', font: { size: 13 } },
                            grid: { color: '#eee' }
                        }
                    }
                }
            };

            const imageBuffer = await chartCanvas.renderToBuffer(chartConfig);
            const filePath = `./topartists_${interaction.user.id}.png`;
            fs.writeFileSync(filePath, imageBuffer);

           
            const attachment = new AttachmentBuilder(filePath, { name: 'topartists.png' });

            
            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('🎶 Top Artistas Mais Ouvidos')
                .setDescription(`Aqui estão seus artistas mais ouvidos no período selecionado!`)
                .setImage('attachment://topartists.png');

            await interaction.followUp({ embeds: [embed], files: [attachment] });

           
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
