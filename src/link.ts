const spotifyLinkRegexp = /^https?:\/\/open.spotify.com\/(?<type>playlist|track)\/(?<id>[\da-z]{22})\S*$/i;

interface SpotifyPlaylistLink {
    type: "playlist";
    playlist: string;
}

interface SpotifyTrackLink {
    type: "track";
    track: string;
}

export type SpotifyLink = SpotifyPlaylistLink | SpotifyTrackLink;

// Parse an ID from a Spotify link
export function parseSpotifyLink(link: string): SpotifyLink | undefined {
    const matches = spotifyLinkRegexp.exec(link);

    if (!matches || !matches.groups) {
        return;
    }

    const type = matches.groups.type.toLowerCase();
    if (type === "playlist") {
        return { type, playlist: matches.groups.id };
    } else if (type === "track") {
        return { type, track: matches.groups.id };
    }
}
