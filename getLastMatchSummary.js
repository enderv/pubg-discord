const pubg = require('./pubg');
const request = require('request-promise');
const handleConfig = require('./handleConfig');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));


function getLastMatchSummary(playerName) {
  let matchData;
  let telemetryData;
  return pubg.getPlayerData(playerName)
    .then((data) => {
      return pubg.getLastMatchId(data)
    })
    .then((matchId) => {
      return pubg.getMatchData(matchId);
    })
    .then((matchReport) => {
      return pubg.processMatchReport(playerName, matchReport);
    })
    .then((matchReport) => {
      matchData = matchReport;
      return request.get({ url: matchData.telemetryLink, json: true });
    })
    .then((telemetry) => {
      telemetryData = pubg.processTelemetryData(playerName, telemetry);
      console.log(JSON.stringify(matchData, null, 2));
      console.log(JSON.stringify(telemetryData, null, 2));
      return fs.writeFileAsync(`${__dirname}/outputs/${playerName}-${matchData.fileId}-telemetry.json`, JSON.stringify(telemetryData, null, 2));
    })
    .then(() => {
      return fs.writeFileAsync(`${__dirname}/outputs/${playerName}-${matchData.fileId}-matchData.json`, JSON.stringify(matchData, null, 2));
    })
    .then(() => {
      return { matchData, telemetryData };
    })
    .catch((err) => {
      console.log(err);
    })
}

module.exports = {
  getLastMatchSummary
}