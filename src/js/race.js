function reset() {
  rowingAudio.stopCrowd();
  raceElapsed = 0;
  playerFinishedAt = null;
  playerFinishPlace = null;
  playerRouteRecord = false;
  document.getElementById('pauseOverlay').classList.add('hidden');
  setMapOverview(false);
  rowerChatter.reset();
  setProvisions(false);
  document.body.classList.remove('race-mode');
  cancelStroke();
  running = false;
  previewMode = false;
  previewPaused = false;
  previewPausedAt = 0;
  previewPlaybackRate = 180;
  document.getElementById('previewControls').hidden = true;
  document.body.classList.remove('preview-mode');
  recordEligible = false;
  pressing = false;
  speed = 0;
  ferryProgress = 0;
  ferryDirection = 1;
  ferryDockWait = 8;
  distance = START_GRID_DISTANCE;
  playerRouteChoice = 'primary';
  playerLane = playerLaneTarget = 0;
  resetBotRacers();
  strokeTimes = [];
  lastDrive = lastRecovery = 0;
  quality = .5;
  strokePower = Number.isFinite(rower.racePower) ? rower.racePower : 70;
  raceDay = null;
  raceStats = newRaceStats();
  strokePulse = feedbackTimer = powerSurge = 0;
  lastPowerSetting = strokePower;

  ({
    carbs,
    bloodCarbs,
    gutCarbs,
    fluidBalance,
    gutFluid,
    sodiumBalance,
    gutSodium,
    gutStress,
    digestionLoad,
    gutFood,
    alcoholLoad,
    nicotineLoad,
    wPrime,
    freshness,
    techniqueControl,
    hydration,
    energy,
    blisters,
    cramps
  } = INITIAL_BODY);
  intakeUntil = 0;
  intakeStartedAt = 0;
  intakePowerFactor = 1;
  intakeKey = null;
  intakeMessage = '';

  rowerSelect.disabled =
    partnerRowerSelect.disabled =
    boatSelect.disabled =
    materialSelect.disabled =
    provisionPackSelect.disabled =
    false;

  updateCramps(0, 0);
  inventory = initialInventory(selectedProvisionPack);

  ui.lastIntake.textContent = 'Et ole vielä nauttinut mitään.';
  ui.feedback.textContent = 'Valmistaudu ensimmäiseen vetoon';
  ui.feedbackDetail.textContent = 'Kahva näyttää koko vedon ja palautuksen.';

  ui.start.classList.remove('hidden');
  ui.finish.classList.add('hidden');
  document.getElementById('creditsOverlay').classList.add('hidden');
  document.body.classList.remove('credits-mode');
  document.getElementById('followRaceButton').hidden = true;
  document.getElementById('finalEnding').hidden = false;

  updateInventory();
  updateUI();
}

const RACE_LANES = [-3, -2, -1, 0, 1, 2, 3];
const START_GRID_DISTANCE = 12;
const START_GRID_ROW_GAP = 4;
const BOT_LAUNCH_ACCELERATION_SECONDS = 1.5;
const PREVIEW_RACE_SECONDS = 5 * 3600;
const RACE_TACTICS = new Set(['aggressive', 'conservative', 'sprint', 'steady']);
const SINGLE_START_DELAY = 20 * 60;
const ALTERNATING_START_DELAY = 10 * 60;
const CHURCH_START_DELAY = 30 * 60;
function seriesStartOffset(type) {
  return type === 'church' ? -CHURCH_START_DELAY : type === 'double' ? -SINGLE_START_DELAY : type === 'alternating' ? -ALTERNATING_START_DELAY : 0;
}
function randomPlayerRouteChoice() {
  return Math.random() < .95 ? 'primary' : 'alternative';
}
const RACE_WEATHERS = {
  record: {label: 'Pläkkityyni · 20 °C · pilvipouta', heat: .92, windIntensity: .05, windStrain: .76, strain: .94, speedFactor: 1.025},
  calm: {label: 'Tyyni · 17 °C · puolipilvistä', heat: .98, windIntensity: .55, windStrain: .90, strain: .98, speedFactor: 1.01},
  normal: {label: 'Vaihtelevat olosuhteet · 18 °C', heat: 1, windIntensity: 1, windStrain: 1, strain: 1, speedFactor: 1},
  hot: {label: 'Helle · 28 °C', heat: 1.25, windIntensity: .75, windStrain: 1.04, strain: 1.10, speedFactor: .91},
  // A hard wind is uncomfortable and costs time, but it is not a storm:
  // Suursoutu winning times have remained well below six hours for decades.
  windy: {label: 'Kova tuuli · 16 °C', heat: 1.02, windIntensity: 1.20, windStrain: 1.12, strain: 1.035, speedFactor: .955}
};
function weatherSpeedFactor(day) {
  return RACE_WEATHERS[day?.weather]?.speedFactor || 1;
}
function randomWeather() {
  const roll = Math.random();
  if (roll < .025) return ['record', RACE_WEATHERS.record];
  if (roll < .20) return ['calm', RACE_WEATHERS.calm];
  if (roll < .84) return ['normal', RACE_WEATHERS.normal];
  if (roll < .97) return ['hot', RACE_WEATHERS.hot];
  return ['windy', RACE_WEATHERS.windy];
}
function randomWindDirection() {
  const roll = Math.random();
  return roll < .45 ? 'head' : roll < .80 ? 'cross' : 'tail';
}
function initialRaceLane(index) {
  return RACE_LANES[index % RACE_LANES.length];
}
function doubleCrewRower(crew) {
  const members = crew.rowers.map(name => rowers.find(candidate => candidate.name === name));
  const average = key => members.reduce((sum, member) => sum + member[key], 0) / members.length;
  return {
    name: crew.rowers.join(' & '), speed: average('speed'), endurance: average('endurance'),
    skill: average('skill'), cramp: average('cramp'), hands: average('hands'),
    stomach: average('stomach'), power: average('power'), voiceGender: doubleCrewCategory(crew)
  };
}
function botEntries() {
  const singles = (raceType === 'single' ? singleRowersForStart() : singleRowersForStart('saturday'))
    .filter(candidate => !candidate.canoeOnly && (raceType !== 'single' || candidate.name !== rower.name))
    .map(candidate => ({rower: candidate, raceType: 'single', crew: [candidate.name]}));
  const doubles = (raceType === 'double' ? crewsForRaceType('double') : doubleCrews)
    .filter(crew => raceType !== 'double' || !crew.rowers.includes(rower.name))
    .map(crew => ({rower: doubleCrewRower(crew), raceType: 'double', crew: crew.rowers.slice()}));
  const alternating = (raceType === 'alternating' ? crewsForRaceType('alternating') : alternatingCrews)
    .filter(crew => raceType !== 'alternating' || !crew.rowers.includes(rower.name))
    .map(crew => ({rower: doubleCrewRower(crew), raceType: 'alternating', crew: crew.rowers.slice()}));
  const churches = (raceType === 'church' ? churchCrewsForStart() : [])
    .filter(crew => raceType !== 'church' || crew.name !== rower.name)
    .map(crew => ({rower: crew, raceType: 'church', crew: [crew.name]}));
  const canoes = canoeRowers.filter(candidate => candidate.name !== rower.name)
    .map(candidate => ({rower: candidate, raceType: 'canoe', crew: [candidate.name]}));
  if (raceType === 'church') return isTourRace() ? [...churches, ...canoes] : churches;
  if (raceType === 'canoe') return canoes;
  return [...churches, ...doubles, ...alternating, ...singles, ...(isTourRace() ? canoes : [])];
}
function resetBotRacers() {
  botRacers = botEntries()
    .map((entry, index) => ({
      ...entry,
      startAt: seriesStartOffset(entry.raceType) - seriesStartOffset(raceType),
      distance: START_GRID_DISTANCE + (Math.floor(index / RACE_LANES.length) - 2) * START_GRID_ROW_GAP,
      speed: 0,
      lane: initialRaceLane(index),
      laneTarget: initialRaceLane(index),
      routeBias: initialRaceLane(index),
      routeChoice: index % 2 ? 'alternative' : 'primary',
      wPrime: 100,
      freshness: 100,
      energy: 100,
      fluidBalance: 0,
      gutFluid: 0,
      gutCarbs: 0,
      gutStress: 0,
      sodiumBalance: 700,
      hydration: 100,
      cramps: 0,
      nextFuelAt: Math.max(0, seriesStartOffset(entry.raceType) - seriesStartOffset(raceType)),
      day: null,
      finishedAt: null
    }));
  syncTourCanoePair();
}

function randomRaceDay(r) {
  const variation = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const [weather, weatherProfile] = randomWeather();
  const windDirection = randomWindDirection();
  const majorProblem = (r.name === 'Ari Kankkunen' || r.name === 'Heikki Karjaluoto') && Math.random() < .02;
  // Skill represents racing experience here: experienced rowers pace the
  // long race more deliberately instead of gambling on an all-out start.
  const aggressiveChance = clamp(.12 + (r.power - 80) * .007 + (95 - r.endurance) * .003 - (r.skill - 80) * .003, .06, .28);
  const conservativeChance = clamp(.14 + (r.endurance - 80) * .008 + (95 - r.power) * .003 + (r.skill - 80) * .004, .10, .32);
  const sprintChance = clamp(.08 + (r.speed - 80) * .006 + (r.skill - 80) * .006, .06, .26);
  const tacticRoll = Math.random();
  const tactic = r.name === 'Seppo Räty'
    ? 'aggressive'
    : tacticRoll < aggressiveChance
      ? 'aggressive'
      : tacticRoll < aggressiveChance + conservativeChance
        ? 'conservative'
        : tacticRoll < aggressiveChance + conservativeChance + sprintChance
          ? 'sprint'
          : 'steady';
  return {
    form: majorProblem ? .64 : clamp(1 + variation * .12, .78, 1.14),
    strain: majorProblem ? 1.45 : weatherProfile.strain * clamp(1 - variation * .16, .82, 1.22),
    windStrain: majorProblem ? 1.45 : weatherProfile.windStrain * clamp(1 + variation * .12, .90, 1.14),
    heat: majorProblem ? 1.16 : weatherProfile.heat,
    windIntensity: weatherProfile.windIntensity,
    windDirection,
    weather,
    freshness: majorProblem ? 70 : clamp(94 + variation * 12, 76, 100),
    energy: majorProblem ? 70 : clamp(94 + variation * 12, 76, 100),
    hydration: majorProblem ? 78 : clamp(95 + variation * 8, 80, 100),
    cramps: majorProblem ? 22 : clamp(-variation * 9 + r.cramp / 30 - 1, 0, 18),
    blisters: r.blisterImmune ? 0 : majorProblem ? 12 : clamp(-variation * 6, 0, 12),
    fadeAt: TOTAL * (majorProblem ? (.18 + Math.random() * .20) : (.20 + Math.random() * .58)),
    fade: majorProblem ? .30 + Math.random() * .15 : Math.random() < .62 ? .08 + Math.random() * .18 : 0,
    tactic,
    esaBeatsAri: r.name === 'Esa Melanen' ? Math.random() < .10 : false
  };
}
function validRaceDay(day) {
  return day &&
    ['form', 'strain', 'windStrain', 'heat', 'windIntensity', 'freshness', 'energy', 'hydration', 'cramps', 'blisters', 'fadeAt', 'fade'].every(key => Number.isFinite(day[key])) &&
    RACE_TACTICS.has(day.tactic) && Object.hasOwn(RACE_WEATHERS, day.weather) &&
    ['head', 'cross', 'tail'].includes(day.windDirection);
}
function raceDayFactor(day, progress = distance) {
  if (!day) return 1;
  const fadeProgress = clamp((progress - day.fadeAt) / (TOTAL * .18));
  return day.form * (1 - day.fade * fadeProgress);
}
function tacticFactor(day, progress) {
  const p = clamp(progress / TOTAL);
  if (day?.tactic === 'aggressive') return p < .24 ? 1.065 : 1.065 - .12 * clamp((p - .24) / .76);
  if (day?.tactic === 'conservative') return p < .38 ? .945 : .945 + .09 * clamp((p - .38) / .48);
  if (day?.tactic === 'sprint') return p < .74 ? .975 : .975 + .105 * clamp((p - .74) / .26);
  return 1;
}
function prepareRaceDay() {
  raceDay = randomRaceDay(rower);
  freshness = raceDay.freshness;
  wPrime = 100;
  energy = raceDay.energy;
  hydration = raceDay.hydration;
  carbs = 25 + 395 * energy / 100;
  bloodCarbs = clamp(10 + energy * .2, 8, 30);
  fluidBalance = (hydration - 100) / 31.25;
  cramps = raceDay.cramps;
  blisters = raceDay.blisters;
  for (const bot of botRacers) {
    bot.day = randomRaceDay(bot.rower);
    bot.freshness = bot.day.freshness;
    bot.wPrime = 100;
    bot.energy = bot.day.energy;
    bot.fluidBalance = (bot.day.hydration - 100) / 31.25;
    bot.gutFluid = 0;
    bot.gutCarbs = 0;
    bot.gutStress = 0;
    bot.sodiumBalance = 700;
    bot.hydration = bot.day.hydration;
    bot.cramps = bot.day.cramps;
    bot.nextFuelAt = bot.startAt > 0 ? bot.startAt : 0;
  }
}
function simulateDoubleHeadStart() {
  const firstStart = Math.min(0, ...botRacers.map(bot => bot.startAt));
  const playerElapsed = raceElapsed;
  for (raceElapsed = firstStart; raceElapsed < 0; raceElapsed += 2) {
    updateBotRacers(2, {wind: 0, sweat: 1});
  }
  raceElapsed = playerElapsed;
}
function previewRaceDay(day) {
  // The preview is a visual test drive, not an endurance simulation.
  return {
    ...day,
    form: 1,
    strain: 1,
    windStrain: 1,
    heat: 1,
    windIntensity: 0,
    weather: 'normal',
    freshness: 100,
    energy: 100,
    hydration: 100,
    cramps: 0,
    blisters: 0,
    fadeAt: TOTAL,
    fade: 0,
    tactic: 'steady'
  };
}
function stabilizePreviewBodies() {
  carbs = 420;
  bloodCarbs = 30;
  gutCarbs = gutFluid = gutStress = 0;
  digestionLoad = 0;
  alcoholLoad = nicotineLoad = 0;
  fluidBalance = 0;
  sodiumBalance = 700;
  gutSodium = 0;
  wPrime = freshness = hydration = energy = 100;
  blisters = cramps = 0;
  for (const bot of botRacers) {
    bot.wPrime = bot.freshness = bot.energy = bot.hydration = 100;
    bot.fluidBalance = 0;
    bot.gutFluid = bot.gutCarbs = bot.gutStress = 0;
    bot.sodiumBalance = 700;
    bot.cramps = 0;
  }
}
function updatePreviewTimeline() {
  const timeline = document.getElementById('previewTimeline');
  if (timeline) timeline.value = String(Math.round(clamp(distance / TOTAL) * 1000));
}
function seekPreview(progress) {
  if (!previewMode) return;
  const p = clamp(progress);
  distance = p * TOTAL;
  raceElapsed = p * PREVIEW_RACE_SECONDS;
  playerFinishedAt = p >= 1 ? PREVIEW_RACE_SECONDS : null;
  playerFinishPlace = null;
  playerRouteRecord = false;
  speed = p >= 1 ? 0 : 9;
  for (const [index, bot] of botRacers.entries()) {
    const spread = .988 + ((index % 5) - 2) * .003;
    bot.distance = Math.min(TOTAL, p * TOTAL * spread);
    bot.speed = p >= 1 ? 0 : 8.7 + (index % 4) * .18;
    bot.finishedAt = p >= 1
      ? PREVIEW_RACE_SECONDS - 420 + index * 38
      : null;
  }
  stabilizePreviewBodies();
  updatePreviewTimeline();
  if (p >= 1) {
    playerFinishPlace = 1 + botRacers.filter(bot => bot.finishedAt <= playerFinishedAt).length;
    raceElapsed = Math.max(playerFinishedAt, ...botRacers.map(bot => bot.finishedAt));
    finishCompetition();
  }
}
function setPreviewPaused(paused) {
  if (!previewMode) return;
  const now = performance.now();
  if (paused && !previewPaused) previewPausedAt = now;
  else if (!paused && previewPaused) {
    const pausedFor = now - previewPausedAt;
    phaseStart += pausedFor;
    previewLastStroke += pausedFor;
    previewPausedAt = 0;
  }
  previewPaused = paused;
  previewPlaybackRate = paused ? 0 : Number(document.getElementById('previewSpeed').value) || 180;
  const button = document.getElementById('previewPause');
  button.textContent = paused ? 'Jatka' : 'Pysäytä';
  button.setAttribute('aria-pressed', String(paused));
}
function botPowerPlan(bot, s) {
  const progress = bot.distance / TOTAL;
  const planned = criticalStrokePower(bot.rower, bot.freshness) +
    1.5 +
    (s.wind ? 2 : 0) +
    (progress > .85 ? 4 : 0);
  return Math.max(bot.rower.racePower || 0, planned);
}
function effectiveBotPower(bot, requestedPower) {
  const critical = criticalStrokePower(bot.rower, bot.freshness);
  if (requestedPower <= critical) return requestedPower;
  return critical + (requestedPower - critical) * clamp(bot.wPrime / 20);
}
function updateBotWPrime(bot, dt, requestedPower) {
  const excess = requestedPower - criticalStrokePower(bot.rower, bot.freshness);
  if (excess > 0) bot.wPrime = clamp(bot.wPrime - excess * dt / 90, 0, 100);
  else bot.wPrime = clamp(bot.wPrime - excess * dt / 160, 0, 100);
}
function updateBotBody(bot, dt, s, effort, actualPower) {
  const hour = dt / 3600;
  const r = bot.rower;
  const day = bot.day || {strain: 1, windStrain: 1, heat: 1};
  // Bots fuel on a fixed plan, so each serving still spends time in the gut.
  while (raceElapsed >= bot.nextFuelAt) {
    bot.gutCarbs += 16 + 2 * r.stomach / 99;
    bot.gutFluid += .18 * (s.wind ? 1.12 : 1);
    bot.sodiumBalance += 104;
    bot.nextFuelAt += 720;
  }

  const carbAbsorb = Math.min(
    bot.gutCarbs,
    (55 + 35 * r.stomach / 99) * hour
  );
  bot.gutCarbs -= carbAbsorb;

  const fluidAbsorb = Math.min(
    bot.gutFluid,
    (.8 + .3 * r.stomach / 99) * hour
  ) / (1 + bot.gutStress / 100);
  bot.gutFluid -= fluidAbsorb;

  const sweat =
    (.42 + .42 * effort) * rowerSweatRate(r) *
    (day.heat || 1) * s.sweat * hour;
  bot.fluidBalance += fluidAbsorb - sweat;
  bot.sodiumBalance += 520 * hour - sweat * 780;

  const excessCarbs = Math.max(0, bot.gutCarbs - (40 + 50 * r.stomach / 99));
  bot.gutStress = clamp(bot.gutStress + excessCarbs / 70 * 5 * hour - Math.min(bot.gutStress, 7 * hour), 0, 100);

  const fluidScore = bot.fluidBalance < 0
    ? clamp(1 + bot.fluidBalance / 3.2)
    : clamp(1 - bot.fluidBalance / 2.0);
  const saltScore = clamp(1 - Math.max(0, -bot.sodiumBalance) / 6000 - Math.max(0, bot.sodiumBalance - 4200) / 10000);
  bot.hydration = 100 * fluidScore * saltScore;

  // Same energy model as the player: the bot pays for its achieved, not requested, power.
  const powerLoad = Math.pow(actualPower / 70, 2);
  const overdrive = Math.max(0, (actualPower - 100) / 10);
  const burn = (
    48 +
    45 * Math.pow(effort, 1.7) +
    35 * Math.max(0, powerLoad - 1) +
    150 * overdrive
  ) * day.strain * (s.wind ? day.windStrain : 1) * hour;
  // Absorbed race nutrition directly covers part of the work and spares stores.
  bot.energy = clamp(bot.energy - Math.max(0, burn - carbAbsorb) / 3.95, 0, 100);

  const imbalance =
    Math.max(0, (80 - bot.hydration) / 80) +
    Math.max(0, (45 - bot.energy) / 90) +
    Math.max(0, -bot.sodiumBalance) / 6000;
  const load = .08 + .45 * (1 - bot.wPrime / 100) + .30 * (1 - bot.freshness / 100) + (s.wind ? .30 : 0);
  const growth = r.cramp / 99 * (.25 + effort) * 42 * load * (1 + imbalance * .8);
  const recovery = bot.hydration > 75 && bot.energy > 40 && bot.sodiumBalance > -300 && effort < .25 ? 24 : 0;
  bot.cramps = clamp(bot.cramps + (growth - recovery) * hour, 0, 100);
}
function trafficLane(racer) {
  return racer.player ? playerLane : racer.lane;
}
function openLaneFor(actor, racers, allowStationaryBypass = false) {
  const currentLane = trafficLane(actor), routeBias = actor.player ? 0 : actor.routeBias;
  const preferred = RACE_LANES.slice()
    .sort((a, b) => Math.abs(a - currentLane) - Math.abs(b - currentLane) || Math.abs(a - routeBias) - Math.abs(b - routeBias))
    .filter((lane, index, lanes) => lanes.indexOf(lane) === index);
  const laneIsFree = lane => !racers.some(racer => racer !== actor && racer.finishedAt == null &&
    Math.abs(racer.distance - actor.distance) < 58 &&
    Math.abs(trafficLane(racer) - lane) < .7);
  const normalLane = preferred.find(lane => {
    const routeChoice = actor.player ? playerRouteChoice : actor.routeChoice;
    if (waterRoutePixels && anticipatedLaneFraction(actor.distance, lane * 4.5, routeChoice) < .98) return false;
    return laneIsFree(lane);
  });
  if (normalLane !== undefined || !allowStationaryBypass || !waterRoutePixels) return normalLane;
  const point = racerPointOnWater(
    raceMapProgressForDistance(actor.distance), 805, 851,
    actor.player ? playerRouteChoice : actor.routeChoice
  );
  return preferred.find(lane => availableLaneFraction(point, lane * 4.5) >= .98 && laneIsFree(lane));
}
const TRAFFIC_ACTIVE_DISTANCE = 500;
const TRAFFIC_PASSING_RANGE = 52;
const TRAFFIC_FOLLOW_GAP = 4;
const ESA_ARI_FINISH_STRAIGHT = 500;
function racerAheadInLane(actor, racers, range = TRAFFIC_PASSING_RANGE) {
  return racers
    .filter(racer => racer !== actor && racer.finishedAt == null && racer.distance > actor.distance &&
      racer.distance - actor.distance < range &&
      Math.abs(trafficLane(racer) - trafficLane(actor)) < .7)
    .sort((a, b) => a.distance - b.distance)[0];
}
function trafficLimitedDistance(actor, proposedDistance, racers) {
  if (actor.distance < TRAFFIC_ACTIVE_DISTANCE) return proposedDistance;
  const ahead = racerAheadInLane(actor, racers, Math.max(TRAFFIC_PASSING_RANGE, proposedDistance - actor.distance + TRAFFIC_FOLLOW_GAP));
  // A stopped racer must never deadlock the route. Lane selection gets the
  // first chance to route around it; this final exception keeps progress
  // possible even where the authored water corridor exposes no full lane.
  if (ahead && ahead.speed <= .15) return proposedDistance;
  return ahead ? Math.min(proposedDistance, Math.max(actor.distance, ahead.distance - TRAFFIC_FOLLOW_GAP)) : proposedDistance;
}
function moveLaneToward(currentLane, targetLane, dt) {
  const difference = targetLane - currentLane;
  if (Math.abs(difference) < .001) return targetLane;
  // A distant target used to produce a proportionally faster sideways leap.
  // Cap lateral velocity so changing several lanes takes longer than changing
  // one while retaining a gentle ease-out on arrival.
  const easedStep = Math.abs(difference) * (1 - Math.exp(-.9 * dt)),
    maximumStep = .22 * dt,
    step = Math.min(Math.abs(difference), easedStep, maximumStep);
  return currentLane + Math.sign(difference) * step;
}
function updatePlayerLane(dt) {
  const player = {player: true, distance, speed}, racers = [player, ...botRacers];
  if (ferryBlocksRacer(distance)) {
    playerLaneTarget = ferryAvoidanceLane();
  } else if (distance >= TRAFFIC_ACTIVE_DISTANCE) {
    const ahead = racerAheadInLane(player, racers);
    if (ahead && speed > ahead.speed + .12) {
      const lane = openLaneFor(player, racers, ahead.speed <= .15);
      if (lane !== undefined) playerLaneTarget = lane;
    } else if (Math.abs(playerLaneTarget) > .1) {
      const centreOpen = !racers.some(racer => racer !== player &&
        Math.abs(racer.distance - distance) < TRAFFIC_PASSING_RANGE && Math.abs(trafficLane(racer)) < .7);
      if (centreOpen) playerLaneTarget = 0;
    }
  }
  const laneDt = previewMode && previewPlaybackRate > 0 ? dt / previewPlaybackRate : dt;
  playerLane = moveLaneToward(playerLane, playerLaneTarget, laneDt);
}
function updateEsaAriTactic() {
  const esa = botRacers.find(bot => bot.raceType === 'single' && bot.rower.name === 'Esa Melanen');
  if (!esa || !esa.day) return;
  const ari = raceType === 'single' && rower.name === 'Ari Kankkunen'
    ? {player: true, distance, speed, finishedAt: playerFinishedAt}
    : botRacers.find(bot => bot.raceType === 'single' && bot.rower.name === 'Ari Kankkunen');
  if (!ari || raceElapsed < esa.startAt || raceElapsed < (ari.startAt || 0)) return;

  if (typeof esa.day.esaBeatsAri !== 'boolean') esa.day.esaBeatsAri = Math.random() < .10;
  const onFinishStraight = Math.max(esa.distance, ari.distance) >= TOTAL - ESA_ARI_FINISH_STRAIGHT;
  const esaShouldLead = onFinishStraight && esa.day.esaBeatsAri;
  const leader = esaShouldLead ? esa : ari;
  const follower = esaShouldLead ? ari : esa;
  if (leader.finishedAt !== null && leader.finishedAt < raceElapsed) return;

  if (!onFinishStraight) {
    follower.distance = Math.max(0, leader.distance - TRAFFIC_FOLLOW_GAP);
    follower.speed = leader.speed;
  } else if (esaShouldLead) {
    esa.distance = Math.min(TOTAL, Math.max(esa.distance, ari.distance + TRAFFIC_FOLLOW_GAP));
    if (!ari.player && ari.finishedAt === null) ari.distance = Math.min(ari.distance, esa.distance - TRAFFIC_FOLLOW_GAP);
  } else if (esa.finishedAt === null) {
    esa.distance = Math.min(esa.distance, Math.max(0, ari.distance - TRAFFIC_FOLLOW_GAP));
    esa.speed = ari.speed;
  }
  if (!onFinishStraight) {
    esa.lane = esa.laneTarget = trafficLane(ari);
    esa.routeChoice = ari.player ? playerRouteChoice : ari.routeChoice;
  }

  if (esa.distance >= TOTAL) {
    esa.distance = TOTAL;
    esa.finishedAt = raceElapsed;
  }
  if (ari !== esa && ari.finishedAt === raceElapsed && follower === ari) {
    ari.distance = TOTAL - TRAFFIC_FOLLOW_GAP;
    ari.finishedAt = null;
  } else if (esa.finishedAt === raceElapsed && follower === esa) {
    esa.distance = TOTAL - TRAFFIC_FOLLOW_GAP;
    esa.finishedAt = null;
  }
}
function syncTourCanoePair() {
  if (!isTourRace()) return;
  const names = ['Tero Tiitu', 'Juho Moilanen'];
  const playerName = usesKayak() && names.includes(rower.name) ? rower.name : null;
  const bots = Object.fromEntries(names.map(name => [name,
    botRacers.find(bot => bot.raceType === 'canoe' && bot.rower.name === name)
  ]));
  if (!playerName && (!bots[names[0]] || !bots[names[1]])) return;

  if (playerName) {
    const companionName = names.find(name => name !== playerName), companion = bots[companionName];
    if (!companion) return;
    const preferredSide = playerName === names[0] ? 1 : -1;
    const companionLane = RACE_LANES.includes(playerLane + preferredSide)
      ? playerLane + preferredSide
      : playerLane - preferredSide;
    companion.distance = distance;
    companion.speed = speed;
    companion.lane = companion.laneTarget = companion.routeBias = companionLane;
    companion.routeChoice = playerRouteChoice;
    companion.finishedAt = playerFinishedAt;
    return;
  }

  const tero = bots[names[0]], juho = bots[names[1]];
  juho.distance = tero.distance;
  juho.speed = tero.speed;
  tero.lane = tero.laneTarget = tero.routeBias = -.5;
  juho.lane = juho.laneTarget = juho.routeBias = .5;
  juho.routeChoice = tero.routeChoice;
  juho.finishedAt = tero.finishedAt;
}
function updateBotRacers(dt, s) {
  for (const bot of botRacers) {
    if (raceElapsed < bot.startAt) {
      bot.speed = 0;
      continue;
    }
    if (bot.finishedAt !== null) continue;

    const r = bot.rower,
      day = bot.day || {form: 1, strain: 1, windStrain: 1, fadeAt: TOTAL, fade: 0};

    const bodyFactor =
      .48 +
      .52 *
        Math.pow(
          clamp(bot.freshness / 100) *
            clamp(bot.energy / 100) *
            clamp(bot.hydration / 100) *
            Math.max(.015, 1 - .985 * Math.pow(bot.cramps / 100, 2.4)),
          .22
        );

    const speedFactor =
      .72 + .28 * r.speed / 99;

    const doubleFactor = bot.raceType === 'church'
      ? CHURCH_SPEED_FACTOR
      : ['double', 'alternating'].includes(bot.raceType)
        ? (DOUBLE_SPEED_FACTORS[r.voiceGender] || DOUBLE_SPEED_FACTORS.mixed)
        : 1;
    const maxSpeed = Math.min(maxRowerSpeed(r) * doubleFactor, tourSpeedLimit(r));
    const botPower = botPowerPlan(bot, s);
    const usablePower = effectiveBotPower(bot, botPower);

    let target =
      RACE_SPEED_FACTOR * weatherSpeedFactor(day) * (7.05 + 4.75 * Math.pow(r.skill / 99, 2.2)) *
      (maxSpeed / MAX_SPEED) *
      bodyFactor *
      speedFactor *
      (r.racePower || 70) / 70 *
      usablePower / botPower *
      (.90 + .02 * 5) *
      (1 + .015) *
      raceDayFactor(day, bot.distance) *
      tacticFactor(day, bot.distance) *
      (s.wind ? 1 / day.windStrain : 1);

    if (ferryBlocksRacer(bot.distance)) {
      target *= ferrySpeedFactor(bot.distance);
      bot.laneTarget = ferryAvoidanceLane();
    }

    const racers = [
      {player: true, distance, speed},
      ...botRacers
    ];
    const ahead = bot.distance >= TRAFFIC_ACTIVE_DISTANCE ? racerAheadInLane(bot, racers) : null;
    if (ahead && target > ahead.speed + .12) {
      const lane = openLaneFor(bot, racers, ahead.speed <= .15);
      if (lane !== undefined) bot.laneTarget = lane;
      else target = Math.min(target, ahead.speed * .98);
    } else if (Math.abs(bot.laneTarget - bot.routeBias) > .1) {
      const lane = openLaneFor(bot, racers);
      if (lane !== undefined) bot.laneTarget = lane;
    }
    // Lane changes are a visible rowing manoeuvre, so preview fast-forward must
    // not compress the whole movement into a single frame. Ease into the new
    // line instead of stepping sideways at a constant, simulation-scaled rate.
    const laneDt = previewMode && previewPlaybackRate > 0 ? dt / previewPlaybackRate : dt;
    bot.lane = moveLaneToward(bot.lane, bot.laneTarget, laneDt);

    const effort =
      clamp((bot.speed - 7.2) / 4.6);

    // Make the starting signal visible on the map immediately. The normal
    // eight-second easing made large church boats look stationary at the most
    // dramatic moment of the race, even though their simulation had started.
    const accelerationSeconds = bot.distance < 60 ? BOT_LAUNCH_ACCELERATION_SECONDS : 8;
    bot.speed +=
      (target - bot.speed) / accelerationSeconds * dt;

    bot.speed =
      clamp(bot.speed, 0, maxSpeed);

    const botPreviousDistance = bot.distance;
    const proposedDistance = ferryLimitedDistance(
      botPreviousDistance,
      botPreviousDistance + bot.speed / 3.6 * dt
    );
    bot.distance = trafficLimitedDistance(bot, proposedDistance, racers);

    if (previewMode) {
      bot.wPrime = bot.freshness = bot.energy = bot.hydration = 100;
      bot.cramps = 0;
    } else {
      updateBotWPrime(bot, dt, botPower);
      bot.freshness = clamp(bot.freshness - (.35 + .65 * effort) * dt / 900, 0, 100);
      updateBotBody(bot, dt, s, effort, effectiveBotPower(bot, botPower));
    }

    if (bot.distance >= TOTAL) {
      bot.distance = TOTAL;
      bot.finishedAt = raceElapsed;
    }
  }
  updateEsaAriTactic();
  syncTourCanoePair();
}

function start() {
  if (
    rowerSelect.value === '' ||
    boatSelect.value === '' ||
    materialSelect.value === ''
    || provisionPackSelect.value === '' ||
    (!['single', 'church', 'canoe'].includes(raceType) && (!partnerRower || partnerRower === rower))
  ) {
    return;
  }

  if (
    loadRace() &&
    !confirm(
      `Aloitetaanko uusi soutu? Tallennuspaikan ${activeSaveSlot} aiempi soutu korvataan.`
    )
  ) {
    return;
  }

  rowingAudio.unlock();
  previewMode = false;
  reset();
  playerRouteChoice = randomPlayerRouteChoice();
  selectCrew();
  prepareRaceDay();
  simulateDoubleHeadStart();

  rowerChatter.arm(rower.name, true);

  running = true;
  recordEligible = true;
  document.body.classList.remove('start-menu');
  rowingAudio.stopMenuMusic();
  document.body.classList.add('race-mode');

  resize();

  rowerSelect.disabled =
    partnerRowerSelect.disabled =
    boatSelect.disabled =
    materialSelect.disabled =
    provisionPackSelect.disabled =
    true;

  startTime = performance.now();
  phaseStart = startTime;
  last = startTime;
  rowingAudio.starterShot();
  rowingAudio.cheerStart();

  ui.start.classList.add('hidden');

  updateInventory();
  saveRace();
}

function startPreview() {
  if (running) return;
  rowingAudio.unlock();
  reset();
  provisionPackSelect.value = 'athlete';
  selectDefaultCrew();
  selectCrew();
  prepareRaceDay();
  raceDay = previewRaceDay(raceDay);
  for (const bot of botRacers) bot.day = previewRaceDay(bot.day);
  stabilizePreviewBodies();
  simulateDoubleHeadStart();
  rowerChatter.arm(rower.name, true);
  previewMode = true;
  previewPaused = false;
  previewPlaybackRate = Number(document.getElementById('previewSpeed').value) || 180;
  document.getElementById('previewPause').textContent = 'Pysäytä';
  document.getElementById('previewPause').setAttribute('aria-pressed', 'false');
  document.getElementById('previewControls').hidden = false;
  document.body.classList.add('preview-mode');
  running = true;
  document.body.classList.remove('start-menu');
  rowingAudio.stopMenuMusic();
  document.body.classList.add('race-mode');
  resize();
  rowerSelect.disabled = partnerRowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = provisionPackSelect.disabled = true;
  startTime = performance.now();
  phaseStart = startTime;
  last = startTime;
  previewLastStroke = startTime;
  strokeTimes = [startTime - targetStrokeCycle() * 1000, startTime];
  quality = .92;
  ui.feedback.textContent = 'ESIKATSELU · 180×';
  ui.feedbackDetail.textContent = 'Kilpailu etenee automaattisesti eikä tallenna suoritusta.';
  ui.start.classList.add('hidden');
  updateInventory();
  updatePreviewTimeline();
}

function pauseRace() {
  if (!running) return;

  if (!previewMode) saveRace();
  cancelStroke();
  rowingAudio.stopCrowd();
  rowerChatter.cancel();

  running = false;

  setProvisions(false);
  updateInventory();

  document
    .getElementById('pauseOverlay')
    .classList
    .remove('hidden');

  updateUI();
}

function resumePausedRace() {
  if (running) return;
  rowingAudio.unlock();
  const now = performance.now();
  last = now;
  phaseStart = now - targetStrokeRecovery() * 1000;
  rowerChatter.arm(rower.name);
  running = true;
  document.getElementById('pauseOverlay').classList.add('hidden');
  updateUI();
}

function withdrawRace(reason, medical = false) {
  if (previewMode || !running) return;
  recordEligible = false;
  cancelStroke();
  rowingAudio.stopCrowd();
  rowerChatter.cancel();
  running = false;
  setProvisions(false);
  clearRace();
  document.getElementById('pauseOverlay').classList.add('hidden');
  document.getElementById('finishTime').textContent = medical ? 'LÄÄKÄRIN KESKEYTYS' : 'KESKEYTYS';
  document.getElementById('finishSummary').textContent = medical
    ? `Ambulanssivene keskeytti ${rower.name}n suorituksen ja kuljettaa soutajan arvioon.`
    : `Valvontavene noutaa ${rower.name}n kilpailusta.`;
  document.getElementById('finishStats').innerHTML = `
    <div><span>Matka</span><b>${(distance / 1000).toFixed(1).replace('.', ',')} km</b></div>
    <div><span>Aika</span><b>${formatTime(raceElapsed)}</b></div>
    <div><span>Nestetasapaino</span><b>${Math.round(hydration)} %</b></div>
    <div><span>Krampit</span><b>${Math.round(cramps)} %</b></div>`;
  document.getElementById('finishAnalysis').textContent = reason;
  ui.finish.classList.remove('hidden');
  updateInventory();
  updateUI();
}

function showFinishReport(sec, place, newRouteRecord = false) {
  const averageSpeed = 3.6 * TOTAL / sec,
    activeSeconds = Math.max(1, raceStats.activeSeconds),
    averagePower = raceStats.powerIntegral / activeSeconds,
    averageCadence = raceStats.cadenceIntegral / activeSeconds,
    averageQuality = raceStats.qualityIntegral / activeSeconds,
    firstHalfTime = raceStats.halfwayAt || sec / 2,
    secondHalfTime = Math.max(1, sec - firstHalfTime),
    firstHalfSpeed = 3.6 * (TOTAL / 2) / firstHalfTime,
    secondHalfSpeed = 3.6 * (TOTAL / 2) / secondHalfTime,
    winnerTime = Math.min(sec, ...botRacers.filter(bot => bot.raceType === raceType && bot.finishedAt !== null).map(bot => bot.finishedAt - Math.max(0, bot.startAt))),
    gap = sec - winnerTime;
  let portions = 0,
    consumedCarbs = 0,
    consumedFluid = 0;
  const startingInventory = initialInventory(selectedProvisionPack);
  for (const [key, food] of Object.entries(foods)) {
    const used = startingInventory[key] - inventory[key];
    portions += food.servingUnits ? Math.ceil(used / food.servingUnits) : used;
    consumedCarbs += used * food.carbs;
    consumedFluid += used * food.fluid;
  }
  const observations = [];
  if (newRouteRecord) observations.push('Uusi reittiennätys!');
  if (secondHalfSpeed < firstHalfSpeed * .95) observations.push(`Vauhti hiipui toisella puoliskolla ${(firstHalfSpeed - secondHalfSpeed).toFixed(1).replace('.', ',')} km/h.`);
  else if (secondHalfSpeed > firstHalfSpeed * 1.05) observations.push(`Säästit voimia ja soudat toisen puoliskon ${(secondHalfSpeed - firstHalfSpeed).toFixed(1).replace('.', ',')} km/h nopeammin.`);
  else observations.push('Vauhdinjako pysyi tasaisena kilpailun molemmilla puoliskoilla.');
  if (freshness < 15) observations.push('Pitkäkestoinen väsymys vei lähes kaikki voimat.');
  if (energy < 25) observations.push('Energiavarastot jäivät hyvin vähäisiksi.');
  if (hydration < 75) observations.push('Nestetasapaino heikensi loppumatkan suorituskykyä.');
  if (cramps >= 30) observations.push('Kramppirasitus nousi merkittäväksi.');
  if (blisters >= 30) observations.push('Käsien rakot haittasivat soutua selvästi.');
  if (observations.length === 1 && freshness >= 35 && energy >= 35 && hydration >= 85) observations.push('Voimavarat pysyivät hyvin hallinnassa maaliin asti.');

  document.getElementById('finishSummary').textContent = raceUsesReverseRoute()
    ? `${crewName()} maalissa Hakovirran sillan alituksen jälkeen.`
    : `${crewName()} maalissa Sulkavan soutustadionilla.`;
  document.getElementById('finishStats').innerHTML = `
    <div><span>Sijoitus</span><b>${place}/${botRacers.filter(bot => bot.raceType === raceType).length + 1}</b></div>
    <div><span>Ero voittajaan</span><b>${gap > .5 ? `+${formatTime(gap)}` : '—'}</b></div>
    <div><span>Keskinopeus</span><b>${averageSpeed.toFixed(1).replace('.', ',')} km/h</b></div>
    <div><span>Huippunopeus</span><b>${raceStats.maxSpeed.toFixed(1).replace('.', ',')} km/h</b></div>
    <div><span>Vetotahti keskimäärin</span><b>${averageCadence.toFixed(1).replace('.', ',')} /min</b></div>
    <div><span>Voima keskimäärin</span><b>${Math.round(averagePower)} %</b></div>
    <div><span>Vedon laatu</span><b>${Math.round(averageQuality * 100)} %</b></div>
    <div><span>Tuoreus / W′ maalissa</span><b>${Math.round(freshness)} / ${Math.round(wPrime)} %</b></div>
    <div><span>Energia maalissa</span><b>${Math.round(energy)} %</b></div>
    <div><span>Nestetasapaino</span><b>${Math.round(hydration)} %</b></div>
    <div><span>Krampit / rakot</span><b>${Math.round(cramps)} / ${Math.round(blisters)} %</b></div>
    <div><span>Ravinto kilpailussa</span><b>${Math.round(consumedCarbs)} g · ${consumedFluid.toFixed(1).replace('.', ',')} l · ${portions} annosta</b></div>`;
  document.getElementById('finishAnalysis').textContent = observations.join(' ');
  document.getElementById('finishDetails').hidden = true;
  const detailsButton = document.getElementById('finishDetailsButton');
  detailsButton.setAttribute('aria-expanded', 'false');
  detailsButton.textContent = 'Oman suorituksen tiedot';
}

function followRace() {
  if (playerFinishedAt === null || !running) return;
  ui.finish.classList.add('hidden');
  setLeaderboardExpanded(true);
  setMapOverview(true);
}

function finishCompetition() {
  if (playerFinishedAt === null) return;
  const wasPreview = previewMode;
  running = false;
  speed = 0;
  showFinishReport(playerFinishedAt, playerFinishPlace, playerRouteRecord);
  document.getElementById('finishSummary').textContent += ' Kaikki kilpailijat ovat nyt maalissa.';
  document.getElementById('followRaceButton').hidden = true;
  document.getElementById('finalEnding').hidden = false;
  if (wasPreview) {
    previewMode = false;
    previewPaused = false;
    previewPlaybackRate = 180;
    document.getElementById('previewControls').hidden = true;
    document.body.classList.remove('preview-mode');
  }
  ui.finish.classList.remove('hidden');
  updateUI();
}

// Per-frame orchestration: physics, dialogue, finish handling and HUD.
function update(dt, now) {
  if (!running) return;

  raceElapsed += dt;
  updateKietavalaFerry(dt);

  const s = previewMode
    ? {name: 'Esikatselu', speedLoss: 0, wind: false, windHead: 0, windCross: 0, windLoad: 0}
    : section();
  const raceSec = raceElapsed;
  const playerRacing = playerFinishedAt === null;
  const active = playerRacing &&
    strokeTimes.length &&
    now - strokeTimes.at(-1) < 4500;

  if (previewMode) stabilizePreviewBodies();
  else if (playerRacing) updateBody(dt, s, raceSec, active);
  updateBotRacers(dt, s);
  updatePlayerLane(dt);

  if (!previewMode && playerRacing && hydration <= 25 && cramps >= 70) {
    withdrawRace('Nestehukka ja kramppirasitus ovat terveydelle liian vaarallisia. Älä jatka suoritusta ilman ammattilaisen arviota.', true);
    return;
  }

  strokePulse =
    Math.max(0, strokePulse - dt * 1.8);

  feedbackTimer =
    Math.max(0, feedbackTimer - dt);

  const bodyFactor =
    .48 +
    .52 *
      Math.pow(
        clamp(hydration / 100) *
          clamp(energy / 100) *
          clamp(freshness / 100),
        .22
      );

  const handFactor =
    1 - .0015 * blisters;

  const cadenceEfficiency =
    strokeRateEfficiency(
      currentStrokeRate(now)
    );

  const ideal = active
    ? (
        RACE_SPEED_FACTOR * weatherSpeedFactor(raceDay) * (7.05 +
        4.75 *
          Math.pow(quality, 2.2))
      ) *
        (maxRowerSpeed() / MAX_SPEED) *
        bodyFactor *
        handFactor *
        crampFactor() *
        (.72 + .28 * crewStat('speed') / 99) *
        boatSpeedFactor() *
        effectiveStrokePower() / 70 *
        raceDayFactor(raceDay) *
        cadenceEfficiency -
      (
        s.wind
          ? windPenalty(
              s.windHead ?? s.speedLoss,
              s.windCross ?? 0
            )
          : s.speedLoss
      )
    : 0;

  const gust =
    s.wind
      ? Math.max(
          0,
          Math.sin(now * .0017) * .28 +
            Math.sin(now * .0041) * .16
        )
      : 0;

  const desired =
    clamp(
      ideal -
        windPenalty(0, gust * (s.windLoad ?? 1)),
      0,
      maxRowerSpeed()
    );

  const ferryAdjustedDesired = desired * ferrySpeedFactor(distance);

  /*
   * Reagoi vetotahdin muutoksiin hieman aiempaa nopeammin.
   * Tämä auttaa erityisesti silloin, kun pelaaja rauhoittaa
   * liian korkean tahdin takaisin normaaliksi.
   */
  if (playerRacing) {
    speed +=
      (ferryAdjustedDesired - speed) /
      (active ? 5 : 3) *
      dt;
  } else {
    speed = 0;
  }

  speed =
    clamp(
      speed,
      0,
      maxRowerSpeed()
    );

  raceStats.maxSpeed = Math.max(raceStats.maxSpeed, speed);
  if (active) {
    raceStats.activeSeconds += dt;
    raceStats.powerIntegral += effectiveStrokePower() * dt;
    raceStats.cadenceIntegral += currentStrokeRate(now) * dt;
    raceStats.qualityIntegral += quality * dt;
  }

  if (playerRacing) {
    const previousDistance = distance;
    const proposedDistance = ferryLimitedDistance(previousDistance, previousDistance + speed / 3.6 * dt),
      playerTraffic = {player: true, distance: previousDistance, speed};
    distance = trafficLimitedDistance(playerTraffic, proposedDistance, [playerTraffic, ...botRacers]);
    if (raceStats.halfwayAt === null && previousDistance < TOTAL / 2 && distance >= TOTAL / 2) {
      raceStats.halfwayAt = raceElapsed;
    }
  }
  syncTourCanoePair();

  if (playerRacing) rowerChatter.tick(dt, {
    time: raceSec,
    speed,
    active,
    wind: !!s.wind,
    quality,
    totalKm: TOTAL / 1000,
    distance,
    bots: botRacers.map(bot => ({name: bot.rower.name, distance: bot.distance})),
    freshness,
    energy,
    hydration,
    blisters,
    gutStress,
    digestionLoad,
    gutFluid,
    cramps
  });

  if (playerRacing && distance >= TOTAL) {
    distance = TOTAL;
    if (previewMode) {
      playerFinishedAt = raceElapsed;
      playerFinishPlace = 1 + botRacers.filter(bot => bot.finishedAt !== null && bot.finishedAt <= playerFinishedAt).length;
      playerRouteRecord = false;
      speed = 0;
      updatePreviewTimeline();
    } else {
      const sec = raceElapsed;

      const place = 1 + botRacers.filter(bot => bot.raceType === raceType && bot.finishedAt !== null && bot.finishedAt - Math.max(0, bot.startAt) <= sec).length;

      rowerChatter.announceFinish(
        crewName(),
        formatTime(sec),
        place
      );

      const newRouteRecord = recordEligible && updateRouteRecord(
        crewCategory(),
        crewName(),
        sec,
        raceType
      );
      recordEligible = false;
      playerFinishedAt = sec;
      playerFinishPlace = place;
      playerRouteRecord = newRouteRecord;

      setProvisions(false);
      cancelStroke();

      updateInventory();
      clearRace();

      document
        .getElementById('finishTime')
        .textContent =
        formatTime(sec);

      showFinishReport(sec, place, newRouteRecord);
      const botsStillRacing = botRacers.some(bot => bot.finishedAt === null);
      document.getElementById('followRaceButton').hidden = !botsStillRacing;
      document.getElementById('finalEnding').hidden = botsStillRacing;
      document.body.classList.remove('preview-mode');

      ui.finish.classList.remove(
        'hidden'
      );
    }
  }

  if (playerFinishedAt !== null && botRacers.every(bot => bot.finishedAt !== null)) {
    finishCompetition();
    return;
  }

  if (previewMode) updatePreviewTimeline();
  updateUI(now);
}
