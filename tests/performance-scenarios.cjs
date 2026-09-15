const {createGame} = require('./harness.cjs');

const scenarios = {
  'Tasainen 70 %': '70',
  'Tasainen 85 %': '85',
  'Liian kova 95 %': '95',
  'Säästävä loppukiri': 'progress < .10 ? 78 : progress < .85 ? 72 : 92'
};
const format = seconds => {
  seconds = Math.floor(seconds);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

function simulate(rowerName, powerExpression, weather = 'normal', windDirection = 'head') {
  const game = createGame();
  let now = 1000;
  game.box.performance.now = () => now;
  game.run(`const profile=RACE_WEATHERS[${JSON.stringify(weather)}];rower=rowers.find(r=>r.name===${JSON.stringify(rowerName)});selectedBoat=boats.find(b=>b.name==='Lonka');material='mahogany';running=true;speed=0;distance=0;quality=.9;carbs=420;bloodCarbs=20;gutCarbs=0;fluidBalance=0;gutFluid=0;sodiumBalance=700;gutSodium=0;gutStress=0;wPrime=100;freshness=100;techniqueControl=1;hydration=100;energy=100;blisters=0;cramps=0;raceElapsed=0;raceDay={form:1,strain:profile.strain,windStrain:profile.windStrain,heat:profile.heat,windIntensity:profile.windIntensity,weather:${JSON.stringify(weather)},windDirection:${JSON.stringify(windDirection)},tactic:'steady',freshness:100,energy:100,hydration:100,cramps:0,blisters:0,fadeAt:TOTAL,fade:0};resetBotRacers();`);

  return game.run(`
    updateUI=()=>{};
    updateBotRacers=()=>{};
    updateInventory=()=>{};
    rowerChatter.tick=()=>{};
    rowerChatter.announceFinish=()=>{};
    showFinishReport=()=>{};
    let simNow=1000;
    let nextSportsDrink=0, nextWater=0, nextPickle=0;
    while(running && playerFinishedAt===null && raceElapsed<36000){
      const progress=distance/TOTAL;
      strokePower=${powerExpression};
      if(raceElapsed>=nextSportsDrink){consume('sportsdrink');nextSportsDrink+=720;}
      if(raceElapsed>=nextWater){consume('water');nextWater+=1800;}
      if(raceElapsed>=nextPickle){consume('pickle');nextPickle+=1800;}
      quality=.9;
      simNow+=5000;
      strokeTimes=[simNow-2857,simNow];
      update(5,simNow);
    }
    ({time:playerFinishedAt??raceElapsed,finished:distance>=TOTAL,wPrime,freshness,energy,hydration,techniqueControl,cramps,blisters});
  `);
}

for (const rower of ['Panu Musakka', 'Ari Kankkunen', 'Hanna Tuominen']) {
  console.log(`\n${rower}`);
  for (const [name, strategy] of Object.entries(scenarios)) {
    const result = simulate(rower, strategy);
  console.log(`${name}: ${format(result.time)} · W′ ${Math.round(result.wPrime)} % · tuoreus ${Math.round(result.freshness)} % · energia ${Math.round(result.energy)} % · neste ${Math.round(result.hydration)} % · tekniikka ${Math.round(result.techniqueControl * 100)} % · krampit ${Math.round(result.cramps)} %`);
  }
}

const roster = createGame().run('rowers.map(r=>r.name)');
const rosterResults = roster.map(name => ({
  name,
  result: simulate(name, 'Math.min(85, criticalStrokePower()-2)')
})).sort((a, b) => a.result.time - b.result.time);

console.log('\nKoko soutajajoukko · kestävä perusvauhti');
for (const {name, result} of rosterResults) {
  console.log(`${name}: ${result.finished ? format(result.time) : 'ei maaliin 10 h:ssa'} · energia ${Math.round(result.energy)} % · neste ${Math.round(result.hydration)} % · krampit ${Math.round(result.cramps)} %`);
}

const recordWeather = simulate('Ari Kankkunen', '85', 'record');
const hotWeather = simulate('Ari Kankkunen', '85', 'hot');
const windyWeather = simulate('Ari Kankkunen', '85', 'windy');
console.log(`\nSäävertailu: ennätyskeli ${format(recordWeather.time)} · helle ${format(hotWeather.time)} · tuuli ${format(windyWeather.time)}`);
if (!(recordWeather.time < hotWeather.time && recordWeather.time < windyWeather.time)) throw Error('Weather record advantage');
console.log(`\nAri · ennätyskeli ${format(recordWeather.time)} · helle ${format(hotWeather.time)} · tuuli ${format(windyWeather.time)}`);
const headwind = simulate('Ari Kankkunen', '85', 'windy', 'head');
const crosswind = simulate('Ari Kankkunen', '85', 'windy', 'cross');
const tailwind = simulate('Ari Kankkunen', '85', 'windy', 'tail');
console.log(`Tuulen suunta: vasta ${format(headwind.time)} · sivu ${format(crosswind.time)} · myötä ${format(tailwind.time)}`);
if (!(headwind.time > crosswind.time && crosswind.time > tailwind.time)) throw Error('Wind direction ordering');
