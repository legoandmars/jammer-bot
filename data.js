const fs = require("fs");

let parsedData;

if (fs.existsSync("./data/data.json")) {
    parsedData = JSON.parse(fs.readFileSync("./data/data.json"));
} else {
    parsedData = { events: [] };
    saveData();
}

function saveData() {
    const data = JSON.stringify(parsedData);
    if (!fs.existsSync("./data/")) {
        fs.mkdirSync("./data/");
    }
    fs.writeFileSync("./data/data.json", data);
}

function addEvent(user, song) {
    parsedData.events.push({ user: user, song: song, time: Date.now() });
}

setInterval(saveData, 10_000);

module.exports.addEvent = addEvent;
