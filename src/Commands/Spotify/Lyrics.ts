import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { individualUserSpotifyApi } from '../../Utils/GenerateIndividualClass.js';
import { verifyIfHasIndividualApi } from '../../Utils/VerifyIfHasIndividualApi.js';
import axios from 'axios';
import { lyrics } from '@bochilteam/scraper-lyrics'

export const command = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Busca a letra da música atual que você está ouvindo no Spotify'),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use `/login` para logar!' });
        }
        
        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const currentTrack = await spotify.getMyCurrentPlayingTrack();
         if (!currentTrack.body.item) {
            return interaction.followUp({ content: 'Nenhuma música está tocando no momento.' });
        }

        if(currentTrack.body.item.type != 'track') return interaction.followUp({ content: 'Você não está ouvindo uma música.' });
        try {
            const response = await axios.get(`https://api.lyrics.ovh/v1/${currentTrack.body.item.artists[0].name}/${currentTrack.body.item.name}`);
            // console.log(response.data);
            return interaction.followUp({ content: `**${currentTrack.body.item.name}**\n\n${response.data.lyrics.replaceAll('\n\n\n', '').replaceAll('\n\n', '\n')}` });
        } catch (error) {
            return interaction.followUp({ content: 'Letra não encontrada.' });
        }
    }
};

export const recommendationsCommand = {
    data: new SlashCommandBuilder()
        .setName('recommendations')
        .setDescription('Gera recomendações com base nas suas músicas favoritas')
        .addIntegerOption((option) =>
            option.setName('quantidade')
                .setDescription('Número de músicas recomendadas (padrão: 5)')
                .setRequired(false)
        ),
    async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const hasIndividualApi = await verifyIfHasIndividualApi(interaction.user.id);
        if (!hasIndividualApi) {
            return interaction.followUp({ content: 'Você não está logado no Spotify! Use `/login` para logar!' });
        }
        
        const spotify = individualUserSpotifyApi.get(interaction.user.id) as SpotifyWebApi;
        const limit = interaction.options.getInteger('quantidade') || 5;
        
        try {
            const topTracks = await spotify.getMyTopTracks({ limit: 5 });
            if (!topTracks.body.items.length) {
                return interaction.followUp({ content: 'Não há músicas suficientes para recomendações.' });
            }

            const seedTracks = topTracks.body.items.map(track => track.id).slice(0, 5);
            const recommendations = await spotify.getRecommendations({ seed_tracks: seedTracks, limit });
            
            const trackList = recommendations.body.tracks.map(track => `**${track.name}** - ${track.artists.map(a => a.name).join(', ')}`).join('\n');
            
            return interaction.followUp({ content: `🎵 **Recomendações baseadas no seu gosto:**\n\n${trackList}` });
        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Erro ao obter recomendações. Tente novamente mais tarde.' });
        }
    }
};
