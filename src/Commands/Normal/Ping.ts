import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Responde com Pong!'),
	async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
		const sent = await interaction.reply({ content: 'Calculando...', withResponse: true });
		const timeDiff = sent.interaction.createdTimestamp - interaction.createdTimestamp;
		await interaction.editReply(`🐢 Pong! A latência é de ${timeDiff}ms. A latência da API é de ${Math.round(client.ws.ping)}ms`);
	},
};