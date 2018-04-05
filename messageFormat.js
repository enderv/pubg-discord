function friendlyTimeFormat(time) {
  return (new Date(time * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];
}


function formatMatch(matchData) {
  return `For match ${matchData.matchId} of type ${matchData.type} at ${matchData.time}  \n
   The match lasted ${friendlyTimeFormat(matchData.duration)} and you lasted ${friendlyTimeFormat(matchData.playerData.attributes.stats.timeSurvived)} \n
   You had \n
   ------------------------------------------------ \n
   ${matchData.playerData.attributes.stats.kills} kills \n
   ${matchData.playerData.attributes.stats.headshotKills} headshot kills \n
   ${matchData.playerData.attributes.stats.assists} assists \n
   ${matchData.playerData.attributes.stats.revives} revives \n
   Used ${matchData.playerData.attributes.stats.boosts} boosts \n
   Did ${matchData.playerData.attributes.stats.damageDealt} damage \n
   Rode ${matchData.playerData.attributes.stats.rideDistance} in a vehicle \n
   Walked ${matchData.playerData.attributes.stats.walkDistance} \n
   Ranked ${matchData.playerData.attributes.stats.killPlace} in kills \n
   Ranked ${matchData.playerData.attributes.stats.winPlace} overall \n`
}

function killMessage(victim, weapon, distance) {
  return `   You killed ${victim} with ${weapon} from ${distance} away\n`;
}

function damageWeaponMessage(weapon, damageArray) {
  let damageTotal = damageArray.reduce((total, currentValue) => { return total + currentValue.damage }, 0);
  return `   You did ${damageTotal} damage with ${weapon}\n`;
}

function damageVictimMessage(victim, damageArray) {
  let damageTotal = damageArray.reduce((total, currentValue) => { return total + currentValue.damage }, 0);
  return `   You did ${damageTotal} damage to ${victim}\n`;
}

function damageReasonMessage(reason, damageArray) {
  let damageTotal = damageArray.reduce((total, currentValue) => { return total + currentValue.damage }, 0);
  return `   You did ${damageTotal} damage to ${reason}\n`;
}

function damageTookMessage(attacker, damageArray) {
  let damageTotal = damageArray.reduce((total, currentValue) => { return total + currentValue.damage }, 0);
  return `   You took ${damageTotal} from ${attacker}\n`;
}

function formatTelemetry(telemetryData) {
  let message = '';

  if (telemetryData.hasOwnProperty('playerKills') && telemetryData.playerKills.length > 0) {
    telemetryData.playerKills.forEach((kill) => {
      message += killMessage(kill.victim, kill.weapon, kill.distance)
    })
  }
  message += `   You did ${telemetryData.numberPlayerAttacks} attacks\n`;
  if (telemetryData.hasOwnProperty('playerAttackByWeapon') && Object.keys(telemetryData.playerAttackByWeapon).length > 0) {
    Object.keys(telemetryData.playerAttackByWeapon).forEach((weapon) => {
      message += damageWeaponMessage(weapon, telemetryData.playerAttackByWeapon[weapon])
    })
  }

  if (telemetryData.hasOwnProperty('playerAttackByVictim') && Object.keys(telemetryData.playerAttackByVictim).length > 0) {
    Object.keys(telemetryData.playerAttackByVictim).forEach((victim) => {
      message += damageVictimMessage(victim, telemetryData.playerAttackByVictim[victim])
    })
  }

  if (telemetryData.hasOwnProperty('playerAttackByType') && Object.keys(telemetryData.playerAttackByType).length > 0) {
    Object.keys(telemetryData.playerAttackByType).forEach((damageReason) => {
      message += damageReasonMessage(damageReason, telemetryData.playerAttackByType[damageReason])
    })
  }

  if (telemetryData.hasOwnProperty('playerDamageByAttacker') && Object.keys(telemetryData.playerDamageByAttacker).length > 0) {
    Object.keys(telemetryData.playerDamageByAttacker).forEach((attacker) => {
      message += damageTookMessage(attacker, telemetryData.playerDamageByAttacker[attacker])
    })
  }

  return message;
}

module.exports = {
  formatMatch,
  formatTelemetry
}