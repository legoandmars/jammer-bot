const spotify = require("./spotify.js");
const data = require("./data.js");
const Discord = require('discord.js');
const fs = require('fs');
const envfile = require('envfile');
const config = envfile.parse(fs.readFileSync(".env"));

// see if config is filled out
if(!config.DISCORD_TOKEN){
    exitWithError("Missing discord token! Make sure to fill out the .env file.");
}else if(!config.SPOTIFY_CLIENT_ID || !config.SPOTIFY_CLIENT_SECRET || !config.SPOTIFY_REDIRECT_URL){
    exitWithError("Missing spotify application information! Make sure to fill out the .env file.");
}else if(!config.PLAYLIST_ID){
    exitWithError("Missing spotify application information! Make sure to fill out the .env file.");
}

const client = new Discord.Client();

spotify.Authenticate(config.SPOTIFY_CLIENT_CREDENTIAL);

function exitWithError(message){
    console.log(message);
    process.exit(9);
}

function parseSpotifyURLSFromString(inputString){
    const allMessage = inputString.split(" ");
    const messageArray = [];
    for(const parsedMessage of allMessage){
        parsedMessage.split("\n").forEach(subMessage => {
                messageArray.push(subMessage);
            }
        )
    }
    const spotifyIDs = [];
    for(const parsedMessage2 of messageArray){
        if(parsedMessage2.includes("track/")){
            const spotifyID = parsedMessage2.split("track/")[1].split("?")[0].split("&")[0];
            spotifyIDs.push("spotify:track:" + spotifyID);
        }else if(parsedMessage2.length == 22 && /^[A-Za-z0-9]+$/.test(parsedMessage2)){
            spotifyIDs.push("spotify:track:" + parsedMessage2);
        }else if(parsedMessage2.includes("spotify:track:")){
            spotifyIDs.push(parsedMessage2);
        }
    }

    return spotifyIDs;
}

function sendUpdateMessage(user, spotifyIDs){
    spotify.getInfoForSongs(spotifyIDs).then((nameArray) => {
        nameArray = nameArray.map(arrayItem => arrayItem.name);
        if(nameArray.length < 1) return;
        const addedString = `<@${user.id}> added ${nameArray.length} song${nameArray.length > 1 ? "s" : ""} to the playlist:\n${nameArray.map((data) => {return `• ${data}`}).join("\n")}`
        if(config.ANNOUNCEMENT_CHANNEL){
            client.channels.cache.get(config.ANNOUNCEMENT_CHANNEL).send(addedString);   
        }
    });
}
client.once('ready', () => {
    console.log('Ready!');
    client.on('message', message => {
        if(message.author.bot) return;
        if(config.IS_LOCKED_TO_CHANNEL && config.LOCK_CHANNEL && message.channel.id.toString() != config.LOCK_CHANNEL) return;
        const spotifyIDs = parseSpotifyURLSFromString(message.content);
        if(spotifyIDs.length > 0){
            spotify.getInfoForSongs(spotifyIDs).then(nameArray => {
                nameArray = nameArray.map(song => song.id); // get array to only ids
                console.log(nameArray);
                console.log(spotifyIDs);
                nameArray = spotifyIDs.filter(song => nameArray.indexOf(song) < 0); // remove already present songs
                if(nameArray.length < 1){
                    message.reply(spotifyIDs.length > 1 ? 
                    `Whoops! Those songs are already in the playlist. Try again with some different songs.` :
                    `Whoops! That song is already in the playlist. Try again with a different song.`);
                    return;
                }
                spotify.AddToPlaylist(nameArray).then(() => {
                    for(const spotifyID of nameArray){
                        data.addEvent(message.author.id, spotifyID);
                    }
                    sendUpdateMessage(message.author, nameArray)
                    message.reply(`Added to playlist! Check it out here: <https://open.spotify.com/playlist/${config.PLAYLIST_ID}>`)
                });    
            })
        }
    });    
});

client.login(config.DISCORD_TOKEN);
