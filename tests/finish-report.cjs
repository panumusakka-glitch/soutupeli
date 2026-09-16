const assert = require('node:assert/strict');
const path = require('node:path');
const {createGame} = require('./harness.cjs');

const game = createGame(path.resolve(__dirname, '../src'));
game.run(`
  raceStats = {
    maxSpeed: 12.4,
    activeSeconds: 100,
    powerIntegral: 8500,
    cadenceIntegral: 2100,
    qualityIntegral: 82,
    halfwayAt: 9000
  };
  raceElapsed = 18000;
  wPrime = 12;
  freshness = 12;
  energy = 20;
  hydration = 74;
  cramps = 31;
  blisters = 32;
  selectedProvisionPack = 'athlete';
  inventory = initialInventory(selectedProvisionPack);
  inventory.water--;
  botRacers[0].finishedAt = 17900;
  showFinishReport(18000, 2);
`);

assert.match(game.nodes.finishStats.markup, new RegExp(`2/${game.run("botRacers.filter(bot => bot.raceType === raceType).length + 1")}`));
assert.match(game.nodes.finishStats.markup, /12,4 km\/h/);
assert.match(game.nodes.finishStats.markup, /85 %/);
assert.match(game.nodes.finishStats.markup, /0,3 l/);
assert.match(game.nodes.finishAnalysis.textContent, /hiipui|tasaisena|nopeammin/);
console.log('Loppuraportin testi OK');
