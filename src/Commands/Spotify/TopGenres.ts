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
        .setName('topgenres')
        .setDescription('Mostra os generos mais ouvidos no Spotify')
        .addStringOption((option) =>
            option.setName('periodo')
                .setDescription('O período de tempo para o qual você deseja obter os generos mais ouvidos')
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
            const response = await spotify.getMyTopArtists({ limit: 50, time_range: range });
            const artists = response.body.items;
            
            if (!artists.length) {
                return interaction.followUp({ content: 'Nenhum artista encontrado para o período selecionado.' });
            }


            const genreCount: Record<string, number> = {};
            artists.forEach(artist => {
                artist.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            });

            const sortedGenres = Object.entries(genreCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); 

            const labels = sortedGenres.map(item => item[0]);
            const values = sortedGenres.map(item => item[1]);

           
            const width = 800;
            const height = 600;
            const chartCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
            const chartConfig: any = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Top Gêneros Musicais',
                        data: values,
                        backgroundColor: '#89CFF0', 
                        borderColor: '#4682B4', 
                        borderWidth: 1,
                        borderRadius: 6,
                        barThickness: 30,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Gêneros mais ouvidos no Spotify',
                            color: '#000',
                            font: { size: 18, weight: 'bold' }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#000' },
                            grid: { color: '#ddd' }
                        },
                        y: {
                            ticks: { color: '#000', font: { size: 13 } },
                            grid: { color: '#eee' }
                        }
                    }
                }
            };

            const imageBuffer = await chartCanvas.renderToBuffer(chartConfig);
            const filePath = `./topgenres_${interaction.user.id}.png`;
            fs.writeFileSync(filePath, imageBuffer);

          
            const attachment = new AttachmentBuilder(filePath, { name: 'topgenres.png' });

            
            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('🎶 Top Gêneros Mais Ouvidos')
                .setDescription(`Aqui estão seus gêneros musicais mais ouvidos no período selecionado!`)
                .setImage('attachment://topgenres.png');

            await interaction.followUp({ embeds: [embed], files: [attachment] });

           
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter dados do Spotify. Tente novamente mais tarde.' });
        }
    }
};
