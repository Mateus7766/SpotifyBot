import { Client, GatewayIntentBits, Collection, SlashCommandBuilder, ChatInputCommandInteraction, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface Command {
    data: SlashCommandBuilder;
    execute(client: Spotcord, interaction: ChatInputCommandInteraction): void
}

class Spotcord extends Client {
    commands = new Collection<String, Command>();

    constructor() {
        super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });
    }
    async loadCommands() {

        // Credits: https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files

        const foldersPath = path.join(import.meta.dirname, '..', 'Commands')
        const commandFolders = fs.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);

                const commandURL = new URL(`file://${filePath}`);
                const command = (await import(commandURL.toString())).command as Command;
                this.commands.set(command.data.name, command);
            }
        }
        this.registryCommands();
    }
    private async registryCommands() {

        // Credits: https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands

        const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
        try {
            console.log(`Started refreshing ${this.commands.size} application (/) commands.`);


            const data = await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as string),
                { body: this.commands.map(command => command.data.toJSON()) },
            );

            console.log(`Successfully reloaded ${(data as any).length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    }

    async loadEvents() {
        const eventsPath = path.join(import.meta.dirname, '..', 'Events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const eventURL = new URL(`file://${filePath}`);
            const event = (await import(eventURL.toString())).event;
            this.on(event.name, (...args) => event.execute(this, ...args));
        }
    }
}

const client = new Spotcord();

export {
    client,
    Spotcord
};