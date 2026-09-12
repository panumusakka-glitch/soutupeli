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
  strokeTimes = [];
  lastDrive = lastRecovery = 0;
  quality = .5;
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
  rowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = false;
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
function start() {
  if (rowerSelect.value === '' || boatSelect.value === '' || materialSelect.value === '') return;
  if (loadRace() && !confirm('Aloitetaanko uusi soutu? Aiempi tallennus korvataan.')) return;
  rowingAudio.unlock();
  reset();
  selectCrew();
  rowerChatter.arm(rower.name, true);
  rowingAudio.cheerStart();
  running = true;
  document.body.classList.add('race-mode');
  resize();
  rowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = true;
  startTime = performance.now();
  phaseStart = startTime;
  last = startTime;
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
  document.getElementById('pauseOverlay').classList.remove('hidden');
  updateUI();
}

// Per-frame orchestration: physics, dialogue, finish handling and HUD.
function update(dt, now) {
  if (!running) return;
  raceElapsed += dt;
  const s = section(),
    raceSec = raceElapsed;
  updateBody(dt, s, raceSec);
  strokePulse = Math.max(0, strokePulse - dt * 1.8);
  feedbackTimer = Math.max(0, feedbackTimer - dt);
  const active = strokeTimes.length && now - strokeTimes.at(-1) < 4500;
  const bodyFactor = .48 + .52 * Math.pow(clamp(hydration / 100) * clamp(energy / 100) * clamp(stamina / 100), .22),
    handFactor = 1 - .0015 * blisters;
  const ideal = active ? (7.05 + 4.75 * Math.pow(quality, 2.2)) * (maxRowerSpeed() / MAX_SPEED) * bodyFactor * handFactor * crampFactor() * (.72 + .28 * rower.speed / 99) * boatSpeedFactor() - (s.wind ? windPenalty(s.speedLoss, 0) : s.speedLoss) : 0;
  const gust = s.wind ? Math.max(0, Math.sin(now * .0017) * .28 + Math.sin(now * .0041) * .16) : 0;
  const desired = clamp(ideal - windPenalty(0, gust), 0, maxRowerSpeed());
  speed += (desired - speed) / (active ? 8 : 3) * dt;
  speed = clamp(speed, 0, maxRowerSpeed());
  distance += speed / 3.6 * dt;
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
    rowerChatter.cancel();
    setProvisions(false);
    cancelStroke();
    running = false;
    updateInventory();
    clearRace();
    const sec = raceElapsed;
    document.getElementById('finishTime').textContent = formatTime(sec);
    document.getElementById('finishSummary').textContent = `Maalissa Sulkavan soutustadionilla. Keskivauhti ${(3.6 * TOTAL / sec).toFixed(1).replace('.', ',')} km/h. Energiaa ${Math.round(energy)} %, nestetasapainoa ${Math.round(hydration)} % ja rakkoja ${Math.round(blisters)} %.`;
    ui.finish.classList.remove('hidden');
  }
  updateUI(now);
}
