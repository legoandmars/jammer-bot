import { SpotifyTrackLink, parseSpotifyLink } from "./link";
import { Message } from "discord.js";
import { PrismaClient } from "@prisma/client";
import SpotifyClient from "spotify-web-api-node";
import { addTracks } from "./playlist";

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
            await message.channel.send(
                "Couldn't add the given tracks to the playlist"
            );
        }
    }
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
