const fs = require('fs');

const data = fs.readFileSync('./data/data.json');
let parsedData = JSON.parse(data);

function saveData(){
    const data = JSON.stringify(parsedData);
    fs.writeFileSync('./data/data.json', data);
}
function addEvent(user, song){
    parsedData.events.push({"user": user, "song": song, "time": Date.now()})
}

setInterval(saveData, 10000);

module.exports.addEvent = addEvent;