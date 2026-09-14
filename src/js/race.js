function reset() {
  rowingAudio.stopCrowd();
  raceElapsed = 0;
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

  rowerSelect.disabled =
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

  updateInventory();
  updateUI();
}

const RACE_LANES = [-2, -1, 0, 1, 2];
const START_GRID_DISTANCE = 12;
const START_GRID_ROW_GAP = 4;
const PREVIEW_RACE_SECONDS = 5 * 3600;
const RACE_TACTICS = new Set(['aggressive', 'conservative', 'sprint', 'steady']);
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
function resetBotRacers() {
  botRacers = rowers
    .filter(r => r.name !== rower.name)
    .map((r, index) => ({
      rower: r,
      distance: START_GRID_DISTANCE + (Math.floor(index / RACE_LANES.length) - 2) * START_GRID_ROW_GAP,
      speed: 0,
      lane: initialRaceLane(index),
      laneTarget: initialRaceLane(index),
      routeBias: initialRaceLane(index),
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
      nextFuelAt: 0,
      day: null,
      finishedAt: null
    }));
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
    tactic
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
    bot.nextFuelAt = 0;
  }
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
  speed = p >= 1 ? 0 : 9;
  for (const [index, bot] of botRacers.entries()) {
    const spread = .988 + ((index % 5) - 2) * .003;
    bot.distance = Math.min(TOTAL, p * TOTAL * spread);
    bot.speed = p >= 1 ? 0 : 8.7 + (index % 4) * .18;
    bot.finishedAt = p >= 1 ? raceElapsed : null;
  }
  stabilizePreviewBodies();
  updatePreviewTimeline();
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
  return racer.player ? 0 : racer.lane;
}
function openLaneFor(bot, racers) {
  const preferred = [bot.routeBias, -2, -1, 1, 2, 0]
    .filter((lane, index, lanes) => lanes.indexOf(lane) === index);
  return preferred.find(lane => !racers.some(racer =>
    racer !== bot &&
    Math.abs(racer.distance - bot.distance) < 58 &&
    Math.abs(trafficLane(racer) - lane) < .7
  ));
}
function updateBotRacers(dt, s) {
  for (const bot of botRacers) {
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

    const maxSpeed = maxRowerSpeed(r);
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

    if (ferryBlocksRacer(bot.distance)) target = 0;

    const racers = [
      {player: true, distance, speed},
      ...botRacers
    ];
    const ahead = racers
      .filter(racer => racer !== bot && racer.distance > bot.distance && racer.distance - bot.distance < 52 && Math.abs(trafficLane(racer) - bot.lane) < .7)
      .sort((a, b) => a.distance - b.distance)[0];
    if (ahead && target > ahead.speed + .12) {
      const lane = openLaneFor(bot, racers);
      if (lane !== undefined) bot.laneTarget = lane;
      else target = Math.min(target, ahead.speed * .98);
    } else if (Math.abs(bot.laneTarget - bot.routeBias) > .1) {
      const lane = openLaneFor(bot, racers);
      if (lane !== undefined) bot.laneTarget = lane;
    }
    bot.lane += clamp(bot.laneTarget - bot.lane, -.9 * dt, .9 * dt);

    const effort =
      clamp((bot.speed - 7.2) / 4.6);

    bot.speed +=
      (target - bot.speed) / 8 * dt;

    bot.speed =
      clamp(bot.speed, 0, maxSpeed);

    const botPreviousDistance = bot.distance;
    bot.distance = ferryLimitedDistance(
      botPreviousDistance,
      botPreviousDistance + bot.speed / 3.6 * dt
    );
    if (bot.distance === KIETAVALA_FERRY_STOP_DISTANCE && botPreviousDistance < bot.distance) bot.speed = 0;

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
}

function start() {
  if (
    rowerSelect.value === '' ||
    boatSelect.value === '' ||
    materialSelect.value === ''
    || provisionPackSelect.value === ''
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
  selectCrew();
  prepareRaceDay();

  rowerChatter.arm(rower.name, true);

  running = true;
  recordEligible = true;
  document.body.classList.remove('start-menu');
  rowingAudio.stopMenuMusic();
  document.body.classList.add('race-mode');

  resize();

  rowerSelect.disabled =
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
  rowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = provisionPackSelect.disabled = true;
  startTime = performance.now();
  phaseStart = startTime;
  last = startTime;
  previewLastStroke = startTime;
  strokeTimes = [startTime - TARGET_CYCLE * 1000, startTime];
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
    winnerTime = Math.min(sec, ...botRacers.filter(bot => bot.finishedAt !== null).map(bot => bot.finishedAt)),
    gap = sec - winnerTime;
  let portions = 0,
    consumedCarbs = 0,
    consumedFluid = 0;
  const startingInventory = initialInventory(selectedProvisionPack);
  for (const [key, food] of Object.entries(foods)) {
    const used = startingInventory[key] - inventory[key];
    portions += used;
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

  document.getElementById('finishSummary').textContent = `${rower.name} maalissa Sulkavan soutustadionilla.`;
  document.getElementById('finishStats').innerHTML = `
    <div><span>Sijoitus</span><b>${place}/${rowers.length}</b></div>
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
  const active =
    strokeTimes.length &&
    now - strokeTimes.at(-1) < 4500;

  if (previewMode) stabilizePreviewBodies();
  else updateBody(dt, s, raceSec, active);
  updateBotRacers(dt, s);

  if (!previewMode && hydration <= 25 && cramps >= 70) {
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
        (.72 + .28 * rower.speed / 99) *
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

  const ferryAdjustedDesired = ferryBlocksRacer(distance) ? 0 : desired;

  /*
   * Reagoi vetotahdin muutoksiin hieman aiempaa nopeammin.
   * Tämä auttaa erityisesti silloin, kun pelaaja rauhoittaa
   * liian korkean tahdin takaisin normaaliksi.
   */
  speed +=
    (ferryAdjustedDesired - speed) /
    (active ? 5 : 3) *
    dt;

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

  const previousDistance = distance;
  distance = ferryLimitedDistance(previousDistance, previousDistance + speed / 3.6 * dt);
  if (distance === KIETAVALA_FERRY_STOP_DISTANCE && previousDistance < distance) speed = 0;
  if (raceStats.halfwayAt === null && previousDistance < TOTAL / 2 && distance >= TOTAL / 2) {
    raceStats.halfwayAt = raceElapsed;
  }

  rowerChatter.tick(dt, {
    time: raceSec,
    speed,
    active,
    wind: !!s.wind,
    quality,
    totalKm: TOTAL / 1000,
    freshness,
    energy,
    hydration,
    blisters,
    gutStress,
    digestionLoad,
    gutFluid,
    cramps
  });

  if (distance >= TOTAL) {
    distance = TOTAL;
    if (previewMode) {
      setPreviewPaused(true);
      speed = 0;
      updatePreviewTimeline();
      updateUI(now);
      return;
    }

    const sec =
      raceElapsed;

    const place =
      1 +
      botRacers.filter(
        bot =>
          bot.finishedAt !== null &&
          bot.finishedAt <= sec
      ).length;

    rowerChatter.announceFinish(
      rower.name,
      formatTime(sec),
      place
    );

    const newRouteRecord = recordEligible && updateRouteRecord(
      rower.voiceGender,
      rower.name,
      sec
    );
    recordEligible = false;

    setProvisions(false);
    cancelStroke();

    running = false;

    updateInventory();
    if (!previewMode) clearRace();

    document
      .getElementById('finishTime')
      .textContent =
      formatTime(sec);

    showFinishReport(sec, place, newRouteRecord);
    previewMode = false;
    document.body.classList.remove('preview-mode');

    ui.finish.classList.remove(
      'hidden'
    );
  }

  if (previewMode) updatePreviewTimeline();
  updateUI(now);
}
