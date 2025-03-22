import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
		await interaction.reply('TRALALA!');
		
	},
};