import dotenv from 'dotenv';
dotenv.config();
import "./server.js"

import { client } from './Sructures/Client.js';

(async () => {
    await import("./Sructures/Mongoose.js")
    await client.loadCommands();
    await client.loadEvents();
    client.login(process.env.DISCORD_TOKEN);
})();
