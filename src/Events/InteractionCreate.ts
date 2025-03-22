import { Events, Interaction } from 'discord.js';
import { Spotcord } from '../Sructures/Client.js';

export const event = {
    name: Events.InteractionCreate,
    execute(client: Spotcord, interaction: Interaction) {
        if (!interaction.isCommand()) return;
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            command.execute(client, interaction);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};


