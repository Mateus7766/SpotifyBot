import { ActivityType, Client, Events } from 'discord.js';

export const event = {
	name: Events.ClientReady,
	execute(client: Client) {
		console.log(`Ready! Logged in as ${client.user?.tag}`);
        client.user?.setActivity('Spotify', { type: ActivityType.Listening });
	},
};
