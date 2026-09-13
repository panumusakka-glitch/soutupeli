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
  pressing = false;
  speed = distance = 0;
  resetBotRacers();
  strokeTimes = [];
  lastDrive = lastRecovery = 0;
  quality = .5;
  strokePower = Number.isFinite(rower.racePower) ? rower.racePower : 70;
  raceDay = null;
  raceStats = newRaceStats();
  strokePulse = feedbackTimer = 0;

  ({
    carbs,
    gutCarbs,
    fluidBalance,
    gutFluid,
    sodiumBalance,
    gutSodium,
    gutStress,
    stamina,
    hydration,
    energy,
    blisters,
    cramps
  } = INITIAL_BODY);

  rowerSelect.disabled =
    boatSelect.disabled =
    materialSelect.disabled =
    false;

  updateCramps(0, 0);
  inventory = initialInventory();

  ui.lastIntake.textContent = 'Et ole vielä nauttinut mitään.';
  ui.feedback.textContent = 'Valmistaudu ensimmäiseen vetoon';
  ui.feedbackDetail.textContent = 'Kahva näyttää koko vedon ja palautuksen.';

  ui.start.classList.remove('hidden');
  ui.finish.classList.add('hidden');

  updateInventory();
  updateUI();
}

function resetBotRacers() {
  botRacers = rowers
    .filter(r => r.name !== rower.name)
    .map(r => ({
      rower: r,
      distance: 0,
      speed: 0,
      stamina: 100,
      energy: 100,
      day: null,
      finishedAt: null
    }));
}

function randomRaceDay(r) {
  const variation = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const majorProblem = (r.name === 'Ari Kankkunen' || r.name === 'Heikki Karjaluoto') && Math.random() < .02;
  return {
    form: majorProblem ? .64 : clamp(1 + variation * .12, .78, 1.14),
    strain: majorProblem ? 1.45 : clamp(1 - variation * .16, .82, 1.22),
    windStrain: majorProblem ? 1.45 : clamp(1 + variation * .25, .82, 1.25),
    stamina: majorProblem ? 70 : clamp(94 + variation * 12, 76, 100),
    energy: majorProblem ? 70 : clamp(94 + variation * 12, 76, 100),
    hydration: majorProblem ? 78 : clamp(95 + variation * 8, 80, 100),
    cramps: majorProblem ? 22 : clamp(-variation * 9 + r.cramp / 30 - 1, 0, 18),
    blisters: r.blisterImmune ? 0 : majorProblem ? 12 : clamp(-variation * 6, 0, 12),
    fadeAt: TOTAL * (majorProblem ? (.18 + Math.random() * .20) : (.20 + Math.random() * .58)),
    fade: majorProblem ? .30 + Math.random() * .15 : Math.random() < .62 ? .08 + Math.random() * .18 : 0
  };
}
function validRaceDay(day) {
  return day && ['form', 'strain', 'windStrain', 'stamina', 'energy', 'hydration', 'cramps', 'blisters', 'fadeAt', 'fade'].every(key => Number.isFinite(day[key]));
}
function raceDayFactor(day, progress = distance) {
  if (!day) return 1;
  const fadeProgress = clamp((progress - day.fadeAt) / (TOTAL * .18));
  return day.form * (1 - day.fade * fadeProgress);
}
function prepareRaceDay() {
  raceDay = randomRaceDay(rower);
  stamina = raceDay.stamina;
  energy = raceDay.energy;
  hydration = raceDay.hydration;
  carbs = 25 + 395 * energy / 100;
  fluidBalance = (hydration - 100) / 31.25;
  cramps = raceDay.cramps;
  blisters = raceDay.blisters;
  for (const bot of botRacers) {
    bot.day = randomRaceDay(bot.rower);
    bot.stamina = bot.day.stamina;
    bot.energy = bot.day.energy;
  }
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
          clamp(bot.stamina / 100) *
            clamp(bot.energy / 100),
          .22
        );

    const speedFactor =
      .72 + .28 * r.speed / 99;

    const maxSpeed = maxRowerSpeed(r);
    const botPower = r.racePower || 70;
    const powerLoad = Math.pow(botPower / 70, 2);
    const overdrive = Math.max(0, (botPower - 100) / 10);

    const target =
      (7.05 + 4.75 * Math.pow(r.skill / 99, 2.2)) *
      (maxSpeed / MAX_SPEED) *
      bodyFactor *
      speedFactor *
      botPower / 70 *
      (.90 + .02 * 5) *
      (1 + .015) *
      raceDayFactor(day, bot.distance) *
      (s.wind ? 1 / day.windStrain : 1);

    const effort =
      clamp((bot.speed - 7.2) / 4.6);

    bot.speed +=
      (target - bot.speed) / 8 * dt;

    bot.speed =
      clamp(bot.speed, 0, maxSpeed);

    bot.distance +=
      bot.speed / 3.6 * dt;

    bot.stamina = clamp(
      bot.stamina -
        (.65 + 7.2 * Math.pow(effort, 3) + 90 * overdrive) *
          powerLoad *
          dt /
          3600 *
          (1.7 - r.endurance / 99) *
          day.strain *
          (s.wind ? day.windStrain : 1),
      0,
      100
    );

    bot.energy = clamp(
      bot.energy -
        (48 +
          45 * Math.pow(effort, 1.7) +
          35 * Math.max(0, powerLoad - 1) +
          150 * overdrive) *
          dt /
          3600 /
          3.95 *
          day.strain *
          (s.wind ? day.windStrain : 1),
      0,
      100
    );

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
  reset();
  selectCrew();
  prepareRaceDay();

  rowerChatter.arm(rower.name, true);

  running = true;
  document.body.classList.remove('start-menu');
  document.body.classList.add('race-mode');

  resize();

  rowerSelect.disabled =
    boatSelect.disabled =
    materialSelect.disabled =
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

function pauseRace() {
  if (!running) return;

  saveRace();
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

function showFinishReport(sec, place) {
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
  for (const [key, food] of Object.entries(foods)) {
    const used = food.stock - inventory[key];
    portions += used;
    consumedCarbs += used * food.carbs;
    consumedFluid += used * food.fluid;
  }
  const observations = [];
  if (secondHalfSpeed < firstHalfSpeed * .95) observations.push(`Vauhti hiipui toisella puoliskolla ${(firstHalfSpeed - secondHalfSpeed).toFixed(1).replace('.', ',')} km/h.`);
  else if (secondHalfSpeed > firstHalfSpeed * 1.05) observations.push(`Säästit voimia ja soudat toisen puoliskon ${(secondHalfSpeed - firstHalfSpeed).toFixed(1).replace('.', ',')} km/h nopeammin.`);
  else observations.push('Vauhdinjako pysyi tasaisena kilpailun molemmilla puoliskoilla.');
  if (stamina < 15) observations.push('Annoit lähes kaikki voimasi reitille.');
  if (energy < 25) observations.push('Energiavarastot jäivät hyvin vähäisiksi.');
  if (hydration < 75) observations.push('Nestetasapaino heikensi loppumatkan suorituskykyä.');
  if (cramps >= 30) observations.push('Kramppirasitus nousi merkittäväksi.');
  if (blisters >= 30) observations.push('Käsien rakot haittasivat soutua selvästi.');
  if (observations.length === 1 && stamina >= 35 && energy >= 35 && hydration >= 85) observations.push('Voimavarat pysyivät hyvin hallinnassa maaliin asti.');

  document.getElementById('finishSummary').textContent = `${rower.name} maalissa Sulkavan soutustadionilla.`;
  document.getElementById('finishStats').innerHTML = `
    <div><span>Sijoitus</span><b>${place}/${rowers.length}</b></div>
    <div><span>Ero voittajaan</span><b>${gap > .5 ? `+${formatTime(gap)}` : '—'}</b></div>
    <div><span>Keskinopeus</span><b>${averageSpeed.toFixed(1).replace('.', ',')} km/h</b></div>
    <div><span>Huippunopeus</span><b>${raceStats.maxSpeed.toFixed(1).replace('.', ',')} km/h</b></div>
    <div><span>Vetotahti keskimäärin</span><b>${averageCadence.toFixed(1).replace('.', ',')} /min</b></div>
    <div><span>Voima keskimäärin</span><b>${Math.round(averagePower)} %</b></div>
    <div><span>Vedon laatu</span><b>${Math.round(averageQuality * 100)} %</b></div>
    <div><span>Voimat maalissa</span><b>${Math.round(stamina)} %</b></div>
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

  const s = section();
  const raceSec = raceElapsed;
  const active =
    strokeTimes.length &&
    now - strokeTimes.at(-1) < 4500;

  updateBody(dt, s, raceSec, active);
  updateBotRacers(dt, s);

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
          clamp(stamina / 100),
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
        7.05 +
        4.75 *
          Math.pow(quality, 2.2)
      ) *
        (maxRowerSpeed() / MAX_SPEED) *
        bodyFactor *
        handFactor *
        crampFactor() *
        (.72 + .28 * rower.speed / 99) *
        boatSpeedFactor() *
        strokePower / 70 *
        raceDayFactor(raceDay) *
        cadenceEfficiency -
      (
        s.wind
          ? windPenalty(
              s.speedLoss,
              0
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
        windPenalty(0, gust),
      0,
      maxRowerSpeed()
    );

  /*
   * Reagoi vetotahdin muutoksiin hieman aiempaa nopeammin.
   * Tämä auttaa erityisesti silloin, kun pelaaja rauhoittaa
   * liian korkean tahdin takaisin normaaliksi.
   */
  speed +=
    (desired - speed) /
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
    raceStats.powerIntegral += strokePower * dt;
    raceStats.cadenceIntegral += currentStrokeRate(now) * dt;
    raceStats.qualityIntegral += quality * dt;
  }

  const previousDistance = distance;
  distance +=
    speed / 3.6 * dt;
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
    stamina,
    energy,
    hydration,
    blisters,
    gutStress,
    gutFluid,
    cramps
  });

  if (distance >= TOTAL) {
    distance = TOTAL;

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

    setProvisions(false);
    cancelStroke();

    running = false;

    updateInventory();
    clearRace();

    document
      .getElementById('finishTime')
      .textContent =
      formatTime(sec);

    showFinishReport(sec, place);

    ui.finish.classList.remove(
      'hidden'
    );
  }

  updateUI(now);
}
