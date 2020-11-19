import { SpotifyTrackLink, parseSpotifyLink } from "./link";
import { addTracks, register } from "./playlist";
import { Message } from "discord.js";
import { PrismaClient } from "@prisma/client";
import SpotifyClient from "spotify-web-api-node";

export default async function listener(
    message: Message,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<void> {
    if (message.author.bot) {
        return;
    }

    const targetPlaylist = await prisma.playlist.findOne({
        where: { inputChannelId: message.channel.id },
        select: { spotifyId: true, infoChannelId: true },
    });
    if (targetPlaylist) {
        try {
            await addTracksListener(
                message,
                targetPlaylist.spotifyId,
                targetPlaylist.infoChannelId,
                spotify,
                prisma
            );
        } catch (e) {
            console.error(e);
            await message.channel.send("An error occurred");
        }

        return;
    }

    const words = message.content
        .split(" ")
        .map((word) => word.trim())
        .filter((word) => word !== "");
    if (
        words.length === 5 &&
        words[0].toLowerCase() === "spotify" &&
        words[1].toLowerCase() === "register"
    ) {
        try {
            await registerListener(message, words, spotify, prisma);
        } catch (e) {
            console.error(e);
            await message.channel.send("An error occurred");
        }

        return;
    }
}

async function registerListener(
    message: Message,
    words: string[],
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<void> {
    const playlist = parseSpotifyLink(words[2]);
    if (!playlist || playlist.type !== "playlist") {
        await message.channel.send("Invalid playlist link");
        return;
    }

    const inputChannelId = words[3].slice(0, -1);
    if (!(await message.client.channels.fetch(inputChannelId)).isText()) {
        await message.channel.send("Invalid input channel");
        return;
    }

    const infoChannelId = words[4].slice(0, -1);
    if (!(await message.client.channels.fetch(infoChannelId)).isText()) {
        await message.channel.send("Invalid info channel");
        return;
    }

    // eslint-disable-next-line prefer-const
    let ownerCredentials = await prisma.credentials.findOne({
        where: { userId: message.author.id },
    });

    if (!ownerCredentials) {
        // TODO: authorization flow
    }

    const playlistName = await register(
        playlist.playlist,
        inputChannelId,
        infoChannelId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ownerCredentials!,
        spotify,
        prisma
    );

    await message.channel.send(`Successfully registered ${playlistName}`);
}

async function addTracksListener(
    message: Message,
    spotifyId: string,
    infoChannelId: string,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<void> {
    const tracks = message.content
        .split(" ")
        .map((word) => word.trim())
        .map(parseSpotifyLink)
        .filter((link) => link && link.type === "track")
        .map((link) => (link as SpotifyTrackLink).track);

    const numAdded = await addTracks(
        spotifyId,
        tracks,
        message.author.id,
        spotify,
        prisma
    );

    const infoChannel = await message.client.channels.fetch(infoChannelId);
    if (infoChannel.isText()) {
        await infoChannel.send(
            `Successfully added ${numAdded} track${
                numAdded === 1 ? "" : "s"
            } to the playlist`
        );
    } else {
        return;
    }
}
