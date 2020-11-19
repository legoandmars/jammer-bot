import { Client as DiscordClient } from "discord.js";
import { PrismaClient } from "@prisma/client";
import SpotifyClient from "spotify-web-api-node";
import listener from "./listener";
import { read as readConfig } from "./config";

const discord = new DiscordClient();
const spotify = new SpotifyClient();
const prisma = new PrismaClient();

discord.on("message", (msg) =>
    listener(msg, spotify, prisma).catch(console.log)
);

async function main() {
    const config = await readConfig();

    await discord.login(config.discord.token);
    spotify.setCredentials(config.spotify);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
