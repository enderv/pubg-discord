const Discord = require('discord.js');
const handleConfig = require('./handleConfig');
const client = new Discord.Client();
const pubg = require('./pubg');
const getSummary = require('./getLastMatchSummary');
const messageFormat = require('./messageFormat');

currentlyPlayingPUBG = {};
const prefix = '!'

function CreateTracking(discordUser, pubgName, time, lastMatchId) {
  return { discordUser, pubgName, time, playing: true, lastCheck: false, lastMatchId };
}

function timeOlderThirtyMinutes(time) {
  return (Date.now() - time) > (30 * 60 * 1000);
}



client.on('ready', () => {
  console.log('Ready!');
});

client.on('message', message => {
  console.log(message.content);
  if (message.content.startsWith(`${prefix}track`)) {
    let splitString = message.content.split(" ");
    if (splitString.length < 2) {
      message.channel.send('To few parameters were entered to track format is !track {pubgName}')
      return;
    }
    return handleConfig.ReadConfigFile()
      .then((data) => {
        data[message.author.username] = { "pubgName": splitString[1], "guildId": message.guild.id }
        return handleConfig.WriteToConfigFile(data);
      })
      .then(() => {
        message.channel.send(`Now tracking for ${message.author.username} as pubg player ${splitString[1]}`);
      })
  }
  if (message.content.startsWith(`${prefix}report`)) {
    let playerName;
    return handleConfig.ReadConfigFile()
      .then((data) => {
        if (data.hasOwnProperty(message.author.username)) {
          playerName = data[message.author.username].pubgName;
        }
        return
      })
      .then(() => {
        if (playerName) {
          return message.channel.send(`Looking up info for ${playerName} might take a few seconds`)
        }
      })
      .then(() => {
        if (playerName) {
          return getSummary.getLastMatchSummary(playerName)
        }
      })
      .then((summary) => {
        if (summary) {
          return message.channel.send(messageFormat.formatMatch(summary.matchData) + '\n' + messageFormat.formatTelemetry(summary.telemetryData), {
            title: `${summary.matchData.matchId} ${playerName}`,
            split: true
          })
        }
        return message.channel.send(`Not currently tracking for ${message.author.username} please enter !track and your pubg name to get stats`);
      })
      .catch((err) => {
        console.log(err);
        return message.channel.send(`Something went wrong idk what to do`);
      })
  }
});

client.on('presenceUpdate', (oldUser, newUser) => {
  if (newUser.presence.game && newUser.presence.game.name === "PLAYERUNKNOWN'S BATTLEGROUNDS") {
    if (!(currentlyPlayingPUBG.hasOwnProperty(newUser.guild.id))) {
      currentlyPlayingPUBG[newUser.guild.id] = {}
    };

    newUser.guild.systemChannel.send(`
                    I see $ { newUser.displayName }
                    has started playing pubg `);

    // Check if tracking that user
    return handleConfig.ReadConfigFile()
      .then((trackingData) => {
        let trackedUser = Object.keys(trackingData).filter((x) => x === newUser.displayName);
        //Not tracking so prompt
        if (!trackedUser) {
          newUser.guild.systemChannel.send(`
                    Currently not setup to track $ { newUser.displayName }
                    if you would like to track enter!track { discordDisplayName } { pubgName }(pubgName is
                      case sensitive)
                    `);
        }
        // We have a tracked user notify the channel, get last matchId and add to tracking object
        else {
          newUser.guild.systemChannel.send(`
                    I 'll send updates on ${newUser.displayName} on the next loop and then every 10 minutes until you stop`);
          return pubg.getPlayerData(trackingData[trackedUser].pubgName)
            .then((data) => {
              let lastMatch = pubg.getLastMatchId(data);
              currentlyPlayingPUBG[newUser.guild.id][newUser.displayName] = CreateTracking(newUser.displayName, trackingData[trackedUser].pubgName, Date.now(), lastMatch);
              return;
            })
        }
        return;
      });
  }

  if (!newUser.presence.game && oldUser.presence.game && oldUser.presence.game.name === "PLAYERUNKNOWN'S BATTLEGROUNDS") {
    if (currentlyPlayingPUBG.hasOwnProperty(newUser.guild.id)) {
      if (currentlyPlayingPUBG[newUser.guild.id].hasOwnProperty(newUser.displayName)) {
        currentlyPlayingPUBG[newUser.guild.id][newUser.displayName].lastCheck = true;
      }
    }
    return handleConfig.ReadConfigFile()
      .then((trackingData) => {
        let trackedUser = Object.keys(trackingData).filter((x) => x === newUser.displayName);
        if (trackedUser) {
          newUser.guild.systemChannel.send(`I see ${newUser.displayName} has stopped playing pubg i'll check for stat updates shortly`);
        }
      });
  }

});

client.login(process.env.DISCORD_TOKEN);


function checkPubgStats() {
  Object.keys(currentlyPlayingPUBG).forEach((guild) => {
    Object.keys(currentlyPlayingPUBG[guild]).forEach((playerName) => {

      if (currentlyPlayingPUBG[guild][playerName].playing) {
        if (timeOlderThirtyMinutes(currentlyPlayingPUBG[guild][playerName].time)) {

        }
      }
      if (currentlyPlayingPUBG[guild][playerName].lastCheck) {
        currentlyPlayingPUBG[guild][playerName].playing = false;
      }
    })
  })
}

// Run check every ten minutes
setInterval(checkPubgStats, 5000);