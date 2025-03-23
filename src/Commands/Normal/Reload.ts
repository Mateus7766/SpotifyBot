import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client } from 'discord.js';
import { Spotcord } from '../../Sructures/Client.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('recarrega os comandos e atualiza eles'),
	async execute(client: Spotcord, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
        client.commands.clear();
        await client.loadCommands();
        await interaction.followUp('💀 Comandos recarregados!');
	},
};