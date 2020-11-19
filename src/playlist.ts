import { Credentials, PrismaClient } from "@prisma/client";
import SpotifyClient from "spotify-web-api-node";
import { refreshCredentialsInPlace } from "./auth";

// Register a new playlist managed by the bot
export async function register(
    spotifyId: string,
    inputChannelId: string,
    infoChannelId: string,
    ownerCredentials: Credentials,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<string> {
    // Refresh credentials if needed
    if (new Date() > ownerCredentials.expiresAt) {
        await refreshCredentialsInPlace(ownerCredentials, spotify, prisma);
    }

    // Make sure playlist exists
    spotify.setAccessToken(ownerCredentials.accessToken);
    const playlist = (await spotify.getPlaylist(spotifyId)).body;
    spotify.resetAccessToken();

    // Register playlist in the database
    await prisma.playlist.create({
        data: {
            spotifyId,
            inputChannelId,
            infoChannelId,
            ownerCredentials: { connect: { userId: ownerCredentials.userId } },
        },
        select: {},
    });

    return playlist.name;
}

// Add tracks to a playlist
export async function addTracks(
    spotifyId: string,
    tracks: string[],
    userId: string,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<number> {
    const playlist = await prisma.playlist.findOne({
        where: { spotifyId },
        include: { ownerCredentials: true },
    });
    if (!playlist) {
        return 0;
    }

    // Refresh credentials if needed
    if (new Date() > playlist.ownerCredentials.expiresAt) {
        await refreshCredentialsInPlace(
            playlist.ownerCredentials,
            spotify,
            prisma
        );
    }

    // Add tracks to the Spotify playlist
    spotify.setAccessToken(playlist.ownerCredentials.accessToken);
    await spotify.addTracksToPlaylist(
        spotifyId,
        tracks.map((id) => `spotify:track:${id}`)
    );
    spotify.resetAccessToken();

    // Register tracks as part of the playlist in the database
    await Promise.all(
        tracks.map((id) =>
            prisma.track.create({
                data: {
                    spotifyId: id,
                    userId,
                    playlist: { connect: { spotifyId } },
                },
            })
        )
    );

    return tracks.length;
}
