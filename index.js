const {
    Client
} = require('discord.js');
const fs = require('fs');
const gameDetection = "Fortnite"

const client = new Client({
    disableEveryone: true
});

client.login("YOURTOKEN");

function readFile(param) {
    let tmp = param.split('.');

    if (tmp[1] === 'json') {
        return JSON.parse(fs.readFileSync(param));
    } else if (tmp[1] === 'txt') {
        return fs.readFileSync(param);
    }
}

function writeFile(file, data) {
    let tmp = file.split('.');

    if (tmp[1] === 'json') {
        return fs.writeFileSync(file, JSON.stringify(data));
    } else if (tmp[1] === 'txt') {
        return fs.writeFileSync(file, data);
    }
}

async function addServer(gId) {
    if (gId === '') return cLog('Error no data given.', true)
    let data = readFile('data.json');
    data.serverIds.push(gId);
    let result = writeFile('data.json', data);
    if (result === false) {
        cLog('Error writing new ID to System.', true);
    }
}

async function removeServer(gId) {
    if (gId === '') return cLog('Error no data given.', true)
    let data = readFile('data.json');
    let mod = data.serverIds.filter(function (value, index, arr) {
        if (value === gId) {
            return false;
        } else {
            return true;
        }
    })
    let newData = {
        "serverIds": []
    }
    mod.forEach(data => {
        newData.serverIds.push(data);
    });
    let result = writeFile('data.json', newData);
    if (result === false) {
        cLog('Error removing ID from System.', true);
    }
}

async function checkGuilds() {
    let ver = await verifyGuilds();
    let guilds = readFile('data.json').serverIds;
    guilds.forEach(id => {
        client.guilds.get(id).members.forEach(member => {
            if (member.user.bot) return undefined;
            if (member.user.presence.game == gameDetection) {
                try {
                    if (!member.bannable) {
                        return undefined;
                    } else {
                        try {
                            member.ban('Fortnite Blocker | Detected User')
                        } catch (error) {
                            return;
                        }
                    }
                } catch (error) {
                    return;
                }
            }
        })
    })
    setTimeout(checkGuilds, 5000);
}

async function verifyGuilds() {
    let guilds = readFile('data.json').serverIds;
    guilds.forEach(id => {
        let verified = true;
        try {
            client.guilds.get(id).name
        } catch (error) {
            verified = false;
        }

        if (verified == false) {
            removeServer(id);
        }
    });
    return null;
}

async function matchGuild(gId) {
    let guilds = readFile('data.json').serverIds;
    if (!guilds.includes(gId)) {
        addServer(gId);
    }
}

client.on('error', err => {
    console.error();
});

client.on('warn', info => {
    console.warn();
});

client.on('disconnect', () => {
    cLog('Disconnected from Websocket');
});

client.on('reconnecting', () => {
    cLog('Reconnecting to Websocket');
});

client.on('ready', () => {
    cLog('Finished Booting');
    setTimeout(checkGuilds, 25);
});

client.on('guildCreate', async guild => {
    addServer(guild.id);
});

client.on('guildDelete', async guild => {
    removeServer(guild.id)
})

client.on('message', async msg => {
    if (msg.author.bot) return undefined;
    if (msg.channel.type === null) return undefined;
    if (msg.guild) {
        matchGuild(msg.guild.id).catch(error => {
            return;
        })
    };
});