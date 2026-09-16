const assert = require('node:assert/strict');
const {createGame} = require('./harness.cjs');

const RACES = 8;
const results = [];

for (let race = 1; race <= RACES; race++) {
  const game = createGame();
  let clock = 1000;
  game.box.performance.now = () => clock;
  results.push(game.run(`
    let seed=${race};
    Math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    rower=rowers.find(r=>r.name==='Ari Kankkunen');
    selectedBoat=boats.find(b=>b.name==='Lonka');
    material='mahogany';
    selectedProvisionPack='athlete';
    provisionPackSelect.value='athlete';
    reset();
    prepareRaceDay();
    running=true;
    recordEligible=false;
    updateUI=()=>{};
    updateInventory=()=>{};
    saveRace=()=>true;
    rowerChatter.tick=()=>{};
    rowerChatter.announceFinish=()=>{};
    let place=null, nextSportsDrink=0, nextWater=0, nextPickle=0, simNow=1000;
    showFinishReport=(sec,rank)=>place=rank;
    while(playerFinishedAt===null&&raceElapsed<36000){
      const progress=distance/TOTAL;
      strokePower=progress<.10?78:progress<.85?85:90;
      if(raceElapsed>=nextSportsDrink){consume('sportsdrink');nextSportsDrink+=720;}
      if(raceElapsed>=nextWater){consume('water');nextWater+=1800;}
      if(raceElapsed>=nextPickle){consume('pickle');nextPickle+=1800;}
      quality=.9;
      simNow+=5000;
      strokeTimes=[simNow-2857,simNow];
      update(5,simNow);
    }
    const finishedBots=botRacers.filter(bot=>bot.finishedAt!==null).sort((a,b)=>a.finishedAt-b.finishedAt);
    const winningBot=finishedBots[0];
    ({finished:distance>=TOTAL,time:playerFinishedAt,place,seriesSize:botRacers.filter(bot=>bot.raceType===raceType).length+1,winner:winningBot?.finishedAt<playerFinishedAt?winningBot.rower.name:rower.name,winnerTime:Math.min(playerFinishedAt,winningBot?.finishedAt??Infinity),botFinishes:finishedBots.length,totalBots:botRacers.length});
  `));
}

assert.equal(results.length, RACES);
assert(results.every(result=>result.finished&&result.place>=1&&result.place<=result.seriesSize), JSON.stringify(results));
assert(results.every(result=>result.time>=4*3600&&result.time<=9*3600));

const average=(key)=>results.reduce((sum,result)=>sum+result[key],0)/results.length;
const wins=results.filter(result=>result.place===1).length;
const winners=[...new Set(results.map(result=>result.winner))].length;
const bestAri=results.reduce((best,result)=>result.time<best.time?result:best);
const bestRace=results.reduce((best,result)=>result.winnerTime<best.winnerTime?result:best);
const format=seconds=>`${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
console.log(`Kilpailusimulaatio OK: ${RACES} kilpailua · Arin keskiaika ${(average('time')/3600).toFixed(2)} h · keskisijoitus ${average('place').toFixed(1)} · voitot ${wins} · eri voittajia ${winners}.`);
console.log(`Paras Ari: ${format(bestAri.time)} (sijoitus ${bestAri.place}) · nopein voittaja: ${bestRace.winner} ${format(bestRace.winnerTime)}.`);
