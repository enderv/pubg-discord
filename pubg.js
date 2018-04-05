const request = require('request-promise');
const _ = require('underscore');
const requestPaths = {
  'player': 'players?filter[playerNames]=',
  'match': 'matches/'
}


function makePubgRequest(path) {
  //TODO always assuming NA
  let requestObject = {
    url: `https://api.playbattlegrounds.com/shards/pc-na/${path}`,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Authorization': process.env.PUBG_KEY
    },
    json: true
  }
  return request(requestObject);
}

function getLastMatchId(data) {
  return data.data[0].relationships.matches.data[0].id;
}

function getPlayerData(playerName) {
  return makePubgRequest(`${requestPaths['player']}${playerName}`);
}

function getMatchData(match) {
  return makePubgRequest(`${requestPaths['match']}${match}`)
}

function getDamageTaken(damageReport) {
  return {
    attacker: damageReport.attacker.name,
    damageType: damageReport.damageTypeCategory,
    damageReason: damageReport.damageReason,
    damage: damageReport.damage,
    time: damageReport._D
  }
}

function getItemPickup(itemReport) {
  return { item: itemReport.item.itemId, itemCategory: itemReport.item.category, count: itemReport.item.stackCount }
}

function getDamageGiven(damageReport) {
  return {
    victim: damageReport.victim.name,
    damageType: damageReport.damageTypeCategory,
    damageReason: damageReport.damageReason,
    damage: damageReport.damage,
    time: damageReport._D,
    weapon: damageReport.damageCauserName
  }
}

function getKillData(killReport) {
  return { victim: killReport.victim.name, weapon: killReport.damageCauserName, damageType: killReport.damageTypeCategory, distance: killReport.distance }
}

function processMatchReport(player, matchReport) {
  let processedMatchData = {};
  processedMatchData.type = matchReport.data.attributes.gameMode;
  processedMatchData.matchId =
    processedMatchData.duration = matchReport.data.attributes.duration;
  processedMatchData.time = matchReport.data.attributes.createdAt;
  let jsTime = new Date(Date.parse(processedMatchData.time));
  processedMatchData.fileId = `${jsTime.getFullYear()}-${jsTime.getMonth()+1}-${jsTime.getDate()}-${matchReport.data.id}`
  let telemetry = matchReport.included.filter((dataBlob) => dataBlob.type === 'asset' && dataBlob.attributes.hasOwnProperty('name') && dataBlob.attributes.name === 'telemetry');
  processedMatchData.telemetryLink = telemetry[0].attributes.URL;
  processedMatchData.playerData = matchReport.included.filter((dataBlob) => dataBlob.type === 'participant' && dataBlob.attributes.hasOwnProperty('stats') && dataBlob.attributes.stats.name === player)[0];
  return processedMatchData;
}

function processTelemetryData(player, telemetryData) {
  let filteredData = telemetryData.filter((x) => x._T === 'LogPlayerKill' || x._T === 'LogPlayerAttack' || x._T === 'LogItemPickup' || x._T === 'LogPlayerTakeDamage');
  let playerKills = filteredData.filter((x) => x._T === 'LogPlayerKill' && x.killer.name === player).map((killReport) => { return getKillData(killReport) });
  let numberPlayerAttacks = filteredData.filter((x) => x._T === 'LogPlayerAttack' && x.attacker.name === player).length;
  let playerAttackDamages = filteredData.filter((x) => x._T === 'LogPlayerTakeDamage' && x.attacker.name === player).map((damage) => { return getDamageGiven(damage) });
  let playerTakenDamages = filteredData.filter((x) => x._T === 'LogPlayerTakeDamage' && x.victim.name === player).map((damage) => { return getDamageTaken(damage) });
  let playerPickups = filteredData.filter((x) => x._T === 'LogItemPickup' && x.character.name === player).map((pickup) => {
    return getItemPickup(pickup)
  });
  let playerAttackByWeapon = _.groupBy(playerAttackDamages, "weapon");
  let playerAttackByVictim = _.groupBy(playerAttackDamages, "victim");
  let pickUpsByType = _.groupBy(playerPickups, "itemCategory");
  let playerDamageByAttacker = _.groupBy(playerTakenDamages, "attacker");
  let playerAttackByType = _.groupBy(playerAttackDamages, "damageReason");
  return { playerKills, numberPlayerAttacks, playerAttackDamages, playerTakenDamages, playerPickups, playerAttackByWeapon, playerAttackByVictim, pickUpsByType, playerDamageByAttacker, playerAttackByType };
}

module.exports = {
  getPlayerData,
  getMatchData,
  getLastMatchId,
  processMatchReport,
  processTelemetryData
}