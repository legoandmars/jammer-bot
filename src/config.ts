import * as dotenv from "dotenv";
import * as fs from "fs/promises";

export interface Config {
    discord: DiscordConfig;
    spotify: SpotifyConfig;
}

export interface DiscordConfig {
    token: string;
}

export interface SpotifyConfig {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    authExpiration: number;
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

// Read the configuration from the .env file
export async function read(): Promise<Config> {
    const contents = await fs.readFile(".env", { encoding: "utf-8" });
    const parsed = dotenv.parse(contents);

    if (!parsed["DISCORD_TOKEN"]) {
        throw new ConfigError("Missing DISCORD_TOKEN");
    }
    if (!parsed["SPOTIFY_CLIENT_ID"]) {
        throw new ConfigError("Missing SPOTIFY_CLIENT_ID");
    }
    if (!parsed["SPOTIFY_CLIENT_SECRET"]) {
        throw new ConfigError("Missing SPOTIFY_CLIENT_SECRET");
    }
    if (!parsed["SPOTIFY_REDIRECT_URL"]) {
        throw new ConfigError("Missing SPOTIFY_REDIRECT_URL");
    }
    if (!parsed["SPOTIFY_AUTH_EXPIRATION"]) {
        throw new ConfigError("Missing SPOTIFY_AUTH_EXPIRATION");
    }

    return {
        discord: { token: parsed["DISCORD_TOKEN"] },
        spotify: {
            clientId: parsed["SPOTIFY_CLIENT_ID"],
            clientSecret: parsed["SPOTIFY_CLIENT_SECRET"],
            redirectUrl: parsed["SPOTIFY_REDIRECT_URL"],
            authExpiration: Number.parseInt(parsed["SPOTIFY_AUTH_EXPIRATION"]),
        },
    };
}
