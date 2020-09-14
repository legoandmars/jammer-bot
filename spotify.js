var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const envfile = require('envfile');
const config = envfile.parse(fs.readFileSync(".env"));

var credentials = {
    clientId: config.SPOTIFY_CLIENT_ID,
    clientSecret: config.SPOTIFY_CLIENT_SECRET,
    redirectUri: config.SPOTIFY_REDIRECT_URL
};

var spotifyApi = new SpotifyWebApi(credentials);

let tokens; 

function saveTokens(){
    fs.writeFileSync('./auth/tokens.json', JSON.stringify(tokens));
}
function loadTokens(){
    if(fs.existsSync('./auth/tokens.json')){
        tokens = JSON.parse(fs.readFileSync('./auth/tokens.json'));
    }else{
        tokens = {"access": "", "refresh": ""}
        saveTokens();
    }    
}

loadTokens();
// The code that's returned as a query parameter to the redirect URI
// Retrieve an access token and a refresh token
function Authenticate(code){
    if(tokens.refresh != ""){
        spotifyApi.setAccessToken(tokens.access);
        spotifyApi.setRefreshToken(tokens.refresh);
        refreshAuth();
        setInterval(refreshAuth, 3600*1000);
        return;
    }
    if(!code || code == ""){
        const spotifyAuthURL = `https://accounts.spotify.com/authorize?client_id=${config.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURI(config.SPOTIFY_REDIRECT_URL)}&scope=playlist-read-collaborative%20playlist-modify-public%20playlist-read-private%20playlist-modify-private`
        console.log("Spotify client credential not found! To get this, click this link and fill out SPOTIFY_CLIENT_CREDENTIAL with the part that's returned as ?code=XXXXXX");
        console.log(spotifyAuthURL);
        process.exit(9);
    }
    spotifyApi.authorizationCodeGrant(code).then(
        function(data) {
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            tokens.access = data.body['access_token'];
            tokens.refresh = data.body['refresh_token'];
            saveTokens();

            setInterval(refreshAuth, data.body['expires_in']*1000);
        },
            function(err) {
                console.log('Something went wrong!', err);
            }
        );
  }

function refreshAuth(){
    spotifyApi.refreshAccessToken().then(data => {
        console.log('The access token has been refreshed!');
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);

        tokens.access = data.body['access_token'];
        saveTokens();

    }).catch(err => {
        console.log('Could not refresh access token', err);
    });
} 

function AddToPlaylist(ids){
    return new Promise((resolve, reject) => {
        spotifyApi.addTracksToPlaylist(playlistID, ids)
        .then(data => {
            console.log('Added tracks to playlist!');
            resolve();
        }).catch(err => {
            console.log('Something went wrong!', err);
            reject();
        });    
    });
}

function stringFromTrackInfo(trackInfo){
    return trackInfo.name + " - " + trackInfo.artists.map((data) => {return data.name}).join(", ");
}

function getInfoForSongs(ids){
    return new Promise((resolve, reject) => {
        spotifyApi.getPlaylist(playlistID)
            .then((data) => {
                //console.log('Some information about this playlist', data.body);
                const songNames = [];
                for(const id of ids){
                    for (const trackitem of data.body.tracks.items) {
                        if(trackitem.track.id == id.split("spotify:track:")[1]){
                            songNames.push(stringFromTrackInfo(trackitem.track));
                            break;
                        }
                    }    
                }
                resolve(songNames);
            }, (err) => {
                console.log('Something went wrong!', err);
                reject();
        });
    });
}

module.exports.Authenticate = Authenticate;
module.exports.AddToPlaylist = AddToPlaylist;  
module.exports.getInfoForSongs = getInfoForSongs;  