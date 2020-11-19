import * as crypto from "crypto";
import { Credentials, PrismaClient } from "@prisma/client";
import { addSeconds, differenceInMinutes } from "date-fns";
import SpotifyClient from "spotify-web-api-node";
import { promisify } from "util";

const randomBytes = promisify(crypto.randomBytes);
const scopes = [
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-read-private",
    "playlist-modify-private",
];

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

// Generate an authentication request and a Spotify OAuth URL for the given Discord user
export async function generateRequest(
    userId: string,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<string> {
    const id = (await randomBytes(16)).toString("hex");
    await prisma.authRequest.create({ data: { id, userId }, select: {} });

    return spotify.createAuthorizeURL(scopes, id);
}

// Verify the validity of an authentication request
export async function verifyRequest(
    id: string,
    expiration: number,
    prisma: PrismaClient
): Promise<{ userId: string; expired: boolean }> {
    const request = await prisma.authRequest.findOne({
        where: { id },
        select: { userId: true, createdAt: true },
    });

    if (request) {
        await prisma.authRequest.delete({ where: { id }, select: {} });

        const minutesSinceCreation = differenceInMinutes(
            new Date(),
            request.createdAt
        );
        if (minutesSinceCreation < expiration) {
            return { userId: request.userId, expired: false };
        } else {
            return { userId: request.userId, expired: true };
        }
    } else {
        throw new AuthError("Invalid authentication request ID");
    }
}

// Obtain credentials from Spotify and save them
export async function processRequest(
    userId: string,
    code: string,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<void> {
    const data = (await spotify.authorizationCodeGrant(code)).body;

    const accessToken = data["access_token"];
    const refreshToken = data["refresh_token"];
    const expiresAt = addSeconds(new Date(), data["expires_in"] - 60); // Remove 60 seconds from the expiration time just to be safe

    await prisma.credentials.create({
        data: { userId, accessToken, refreshToken, expiresAt },
        select: {},
    });
}

// Refresh Spotify credentials
export async function refreshCredentials(
    userId: string,
    refreshToken: string,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<{ accessToken: string; expiresAt: Date }> {
    spotify.setRefreshToken(refreshToken);
    const data = (await spotify.refreshAccessToken()).body;
    spotify.resetRefreshToken();

    const accessToken = data["access_token"];
    const expiresAt = addSeconds(new Date(), data["expires_in"] - 60); // Remove 60 seconds from the expiration time just to be safe

    await prisma.credentials.update({
        where: { userId },
        data: { accessToken, expiresAt },
        select: {},
    });

    return { accessToken, expiresAt };
}

// Refresh Spotify credentials in place
export async function refreshCredentialsInPlace(
    credentials: Credentials,
    spotify: SpotifyClient,
    prisma: PrismaClient
): Promise<void> {
    const newCredentials = await refreshCredentials(
        credentials.userId,
        credentials.refreshToken,
        spotify,
        prisma
    );

    credentials.accessToken = newCredentials.accessToken;
    credentials.expiresAt = newCredentials.expiresAt;
}
