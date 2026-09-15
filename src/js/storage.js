const SAVE_KEY = 'suursoutu-race-v1';
const ROUTE_RECORD_KEY = 'suursoutu-route-records-v1';
const SAVE_SLOTS = [SAVE_KEY, `${SAVE_KEY}-2`, `${SAVE_KEY}-3`];
const defaultRouteRecords = {
  male: {name: 'Ari Kankkunen', seconds: 5 * 3600 + 4 * 60 + 50, year: 1991},
  female: {name: 'Hanna Tuominen', seconds: 6 * 3600 + 60 + 11, year: 2009},
  'double-male': {name: 'Jyrki Kiviniemi & Jani Söderlund', seconds: 4 * 3600 + 42 * 60 + 50, year: 2016},
  'double-female': {name: 'Tanja Jantunen & Kaisa Saarimaa', seconds: 5 * 3600 + 23 * 60 + 8, year: 2022},
  'double-mixed': {name: 'Elisa Aunola & Seppo Rellman', seconds: 5 * 3600 + 2 * 60 + 30, year: 2016}
};
const renamedRowers = {'Joey Power': 'Joel Naukkarinen', 'Kankku King': 'Ari Kankkunen', 'Heikki Fjord': 'Heikki Karjaluoto', 'Sauli Niinistö': 'Sale Steel', 'Einari Luukkonen': 'Einari "Leppäsuaren Einar" Luukkonen', 'Juho-Kalle Björn': 'Juho Karhu', 'Lassi Toropainen': 'El Toro'};
let activeSaveSlot = 1,
  pausedSaveSlot = null;
function routeRecord(gender, type = 'single') {
  const key = type === 'double' ? `double-${gender}` : gender;
  const fallback = defaultRouteRecords[key];
  try {
    const saved = JSON.parse(localStorage.getItem(ROUTE_RECORD_KEY));
    const record = saved?.[key];
    return record && typeof record.name === 'string' && Number.isFinite(record.seconds) && record.seconds > 0
      ? record
      : fallback;
  } catch {
    return fallback;
  }
}
function routeRecordLabel(gender, type = 'single') {
  const record = routeRecord(gender, type);
  const doubleTitle = gender === 'female' ? 'Naisten parisoudun reittiennätys' : gender === 'mixed' ? 'Sekaparisoudun reittiennätys' : 'Miesten parisoudun reittiennätys';
  const title = type === 'double' ? doubleTitle : gender === 'female' ? 'Naisten reittiennätys' : 'Reittiennätys';
  const time = formatTime(record.seconds).replaceAll(':', '.');
  return `${title}: ${record.name} – ${time}${record.year ? ` (${record.year})` : ''}`;
}
function updateRouteRecord(gender, name, seconds, type = 'single') {
  const key = type === 'double' ? `double-${gender}` : gender;
  const current = routeRecord(gender, type);
  if (seconds >= current.seconds) return false;
  try {
    const saved = JSON.parse(localStorage.getItem(ROUTE_RECORD_KEY)) || {};
    saved[key] = {name, seconds};
    localStorage.setItem(ROUTE_RECORD_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}
const stateRanges = {
  elapsed: [0, 1e8],
  distance: [0, TOTAL - .00001],
  speed: [0, Math.max(...rowers.map(r => maxRowerSpeed(r))) * Math.max(...Object.values(DOUBLE_SPEED_FACTORS))],
  quality: [0, 1],
  carbs: [0, 420],
  bloodCarbs: [0, 60],
  gutCarbs: [0, 2000],
  fluidBalance: [-100, 100],
  gutFluid: [0, 30],
  sodiumBalance: [-1e6, 1e6],
  gutSodium: [0, 1e5],
  gutStress: [0, 100],
  digestionLoad: [0, 100],
  gutFood: [0, 5000],
  alcoholLoad: [0, 20],
  nicotineLoad: [0, 20],
  wPrime: [0, 100],
  freshness: [0, 100],
  techniqueControl: [0, 1],
  hydration: [0, 100],
  energy: [0, 100],
  blisters: [0, 100],
  cramps: [0, 100]
};
function migrateRaceDay(day) {
  if (day && !Object.hasOwn(day, 'tactic')) day.tactic = 'steady';
  if (day && !Number.isFinite(day.windIntensity)) day.windIntensity = 1;
  if (day && !Object.hasOwn(day, 'weather')) day.weather = 'normal';
  if (day && !['head', 'cross', 'tail'].includes(day.windDirection)) day.windDirection = 'head';
  return day;
}
function validRace(s) {
  if (!s || s.version !== 1 || !rowers.some(r => r.name === s.rower) || !boats.some(b => b.name === s.boat) || !Object.hasOwn(materials, s.material)) return false;
  if (!Object.hasOwn(provisionPacks, s.provisionPack)) return false;
  if (!['single', 'double'].includes(s.raceType)) return false;
  if (s.raceType === 'double' && (!doubleRowerNames.includes(s.rower) || !doubleRowerNames.includes(s.partnerRower) || s.partnerRower === s.rower)) return false;
  if (s.raceType === 'double' && s.partnerRower === 'Seppo Räty' && s.provisionPack !== 'fun') return false;
  if (s.rower === 'Seppo Räty' && s.provisionPack !== 'fun') return false;
  if (boats.find(b => b.name === s.boat).spruceOnly && s.material !== 'spruce') return false;
  if (!Object.entries(stateRanges).every(([k, [lo, hi]]) => Number.isFinite(s[k]) && s[k] >= lo && s[k] <= hi)) return false;
  const max = initialInventory(s.provisionPack);
  return s.inventory && Object.entries(max).every(([k, n]) => Number.isInteger(s.inventory[k]) && s.inventory[k] >= 0 && s.inventory[k] <= n);
}
function loadRace(slot = activeSaveSlot) {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_SLOTS[slot - 1]));
    if (s && !Object.hasOwn(s, 'raceType')) s.raceType = 'single';
    if (s && !Object.hasOwn(s, 'provisionPack')) s.provisionPack = 'legacy';
    if (s?.inventory) for (const key of Object.keys(foods)) if (!Number.isInteger(s.inventory[key])) s.inventory[key] = 0;
    if (s?.rower === 'Seppo Räty' && s.provisionPack !== 'fun') {
      s.provisionPack = 'fun';
      s.inventory = initialInventory('fun');
    }
    if (s && !Number.isFinite(s.bloodCarbs)) s.bloodCarbs = 20;
    if (s && !Number.isFinite(s.alcoholLoad)) s.alcoholLoad = 0;
    if (s && !Number.isFinite(s.digestionLoad)) s.digestionLoad = 0;
    if (s && !Number.isFinite(s.gutFood)) s.gutFood = 0;
    if (s && !Number.isFinite(s.intakeRemaining)) s.intakeRemaining = 0;
    if (s && !Number.isFinite(s.intakePowerFactor)) s.intakePowerFactor = 1;
    if (!Object.hasOwn(foods, s?.intakeKey)) s.intakeKey = null;
    if (s && !Number.isFinite(s.intakeDuration)) s.intakeDuration = 0;
    if (s && typeof s.intakeMessage !== 'string') s.intakeMessage = '';
    if (s && !Number.isFinite(s.nicotineLoad)) s.nicotineLoad = 0;
    if (s && !Number.isFinite(s.techniqueControl)) s.techniqueControl = 1;
    if (s && !Number.isFinite(s.wPrime)) s.wPrime = Number.isFinite(s.stamina) ? s.stamina : 100;
    if (s && !Number.isFinite(s.freshness)) s.freshness = 100;
    if (s?.raceDay && !Number.isFinite(s.raceDay.freshness)) s.raceDay.freshness = Number.isFinite(s.raceDay.stamina) ? s.raceDay.stamina : 100;
    if (s?.raceDay && !Number.isFinite(s.raceDay.heat)) s.raceDay.heat = 1;
    migrateRaceDay(s?.raceDay);
    if (Array.isArray(s?.bots)) s.bots.forEach(bot => {
      if (bot.day && !Number.isFinite(bot.day.heat)) bot.day.heat = 1;
      if (!Number.isFinite(bot.wPrime)) bot.wPrime = Number.isFinite(bot.stamina) ? bot.stamina : 100;
      if (!Number.isFinite(bot.freshness)) bot.freshness = 100;
      if (bot.day && !Number.isFinite(bot.day.freshness)) bot.day.freshness = Number.isFinite(bot.day.stamina) ? bot.day.stamina : 100;
      migrateRaceDay(bot.day);
    });
    if (s?.rower && renamedRowers[s.rower]) s.rower = renamedRowers[s.rower];
    if (s?.partnerRower && renamedRowers[s.partnerRower]) s.partnerRower = renamedRowers[s.partnerRower];
    if (Array.isArray(s?.bots)) s.bots.forEach(bot => {
      if (renamedRowers[bot.rower]) bot.rower = renamedRowers[bot.rower];
    });
    return validRace(s) ? s : null;
  } catch {
    return null;
  }
}
function snapshot() {
  return {
    version: 1,
    raceType,
    rower: rower.name,
    partnerRower: partnerRower?.name || null,
    boat: selectedBoat.name,
    material,
    provisionPack: selectedProvisionPack,
    elapsed: raceElapsed,
    distance,
    speed,
    quality,
    strokePower,
    raceDay,
    raceStats: {...raceStats},
    routeChoice: playerRouteChoice,
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
    intakeRemaining: Math.max(0, intakeUntil - raceElapsed),
    intakeDuration: Math.max(0, intakeUntil - intakeStartedAt),
    intakePowerFactor,
    intakeKey,
    intakeMessage,
    alcoholLoad,
    nicotineLoad,
    wPrime,
    freshness,
    techniqueControl,
    hydration,
    energy,
    blisters,
    cramps,
    inventory: {
      ...inventory
    },
    bots: botRacers.map(bot => ({
      rower: bot.rower.name,
      distance: bot.distance,
      speed: bot.speed,
      lane: bot.lane,
      laneTarget: bot.laneTarget,
      routeBias: bot.routeBias,
      routeChoice: bot.routeChoice,
      wPrime: bot.wPrime,
      freshness: bot.freshness,
      energy: bot.energy,
      fluidBalance: bot.fluidBalance,
      gutFluid: bot.gutFluid,
      gutCarbs: bot.gutCarbs,
      gutStress: bot.gutStress,
      sodiumBalance: bot.sodiumBalance,
      hydration: bot.hydration,
      cramps: bot.cramps,
      nextFuelAt: bot.nextFuelAt,
      day: bot.day,
      finishedAt: bot.finishedAt
    })),
    chatter: rowerChatter.snapshot()
  };
}
function saveRace() {
  if (!running || distance >= TOTAL) return false;
  pausedSave = snapshot();
  pausedSaveSlot = activeSaveSlot;
  lastSaveAt = performance.now();
  try {
    localStorage.setItem(SAVE_SLOTS[activeSaveSlot - 1], JSON.stringify(pausedSave));
    document.getElementById('saveWarning').hidden = true;
    document.getElementById('pauseStatus').textContent = 'Tallennettu. Voit sulkea pelin ja jatkaa myöhemmin samalla laitteella ja selaimella.';
    return true;
  } catch {
    document.getElementById('saveWarning').hidden = false;
    document.getElementById('saveWarning').textContent = 'Tallennus ei onnistu. Älä sulje sivua.';
    const message = 'Tallennus ei onnistu tässä selaimessa. Älä sulje sivua, jos haluat jatkaa tätä soutua.';
    document.getElementById('saveStatus').textContent = message;
    document.getElementById('pauseStatus').textContent = message;
    return false;
  }
}
function clearRace() {
  pausedSave = null;
  pausedSaveSlot = null;
  try {
    localStorage.removeItem(SAVE_SLOTS[activeSaveSlot - 1]);
  } catch {}
}
function savedRaces() {
  return SAVE_SLOTS.map((_, index) => loadRace(index + 1));
}
function showSavedRace() {
  rowingAudio.startMenuMusic();
  const saves = savedRaces();
  document.body.classList.add('start-menu');
  document.getElementById('resumePanel').hidden = false;
  document.getElementById('selectionPanel').hidden = true;
  document.getElementById('startInstructions').hidden = true;
  document.getElementById('saveStatus').hidden = true;
  document.getElementById('startButton').hidden = true;
  document.getElementById('saveMenuActions').hidden = false;
  document.getElementById('previewButton').hidden = !developerMode;
  document.getElementById('saveSlotPanel').hidden = true;
  document.getElementById('saveMenuTitle').textContent = 'Valitse pelitapa';
  document.getElementById('resumeSummary').textContent = 'Jatka aiempaa soutua tai aloita uusi.';
  document.getElementById('continueMenuButton').disabled = !saves.some(Boolean);
}
function showSaveSlots(mode) {
  const saves = savedRaces();
  document.getElementById('saveMenuActions').hidden = true;
  document.getElementById('previewButton').hidden = true;
  document.getElementById('saveSlotPanel').hidden = false;
  document.getElementById('saveMenuTitle').textContent = mode === 'continue' ? 'Valitse jatkettava soutu' : 'Valitse tallennuspaikka';
  document.getElementById('resumeSummary').textContent = mode === 'continue' ? 'Valitse tallennus, jota haluat jatkaa.' : 'Uusi soutu tallennetaan valitsemaasi paikkaan.';
  document.getElementById('saveSlots').innerHTML = saves.map((save, index) => {
    const slot = index + 1;
    const savedCrew = save?.raceType === 'double' ? `${save.rower} & ${save.partnerRower}` : save?.rower;
    const details = save ? `${savedCrew} · ${save.raceType === 'double' ? 'Parisoutu' : 'Yksinsoutu'} · ${(save.distance / 1000).toFixed(1).replace('.', ',')} km · ${formatTime(save.elapsed)}` : 'Tyhjä';
    const action = mode === 'continue' ? 'Jatka' : save ? 'Korvaa' : 'Valitse';
    return `<button class="save-slot" type="button" data-mode="${mode}" data-slot="${slot}"${mode === 'continue' && !save ? ' disabled' : ''}><b>Paikka ${slot}</b><span>${details}</span><em>${action}</em></button>`;
  }).join('');
}
function chooseSaveSlot(mode, slot) {
  if (!SAVE_SLOTS[slot - 1]) return;
  activeSaveSlot = slot;
  if (mode === 'continue') {
    pausedSave = loadRace(slot);
    pausedSaveSlot = slot;
    resumeRace(slot);
    return;
  }
  pausedSave = null;
  pausedSaveSlot = null;
  provisionPackSelect.value = 'athlete';
  selectCrew();
  document.getElementById('resumePanel').hidden = true;
  document.getElementById('selectionPanel').hidden = false;
  showSelectionStep(1);
  document.getElementById('startInstructions').hidden = false;
  document.getElementById('saveStatus').hidden = false;
  document.getElementById('saveStatus').textContent = `Soutu tallentuu paikkaan ${slot}.`;
  document.getElementById('startButton').textContent = 'Lähde Hakovirralta';
}
function resumeRace(slot = activeSaveSlot) {
  activeSaveSlot = slot;
  const s = pausedSaveSlot === slot ? pausedSave : loadRace(slot);
  if (!validRace(s)) return;
  rowingAudio.unlock();
  reset();
  const savedRowerIndex = rowers.findIndex(r => r.name === s.rower);
  selectRowerGender(rowers[savedRowerIndex]?.voiceGender, savedRowerIndex);
  const savedPartnerIndex = rowers.findIndex(r => r.name === s.partnerRower);
  setRaceType(s.raceType, savedPartnerIndex);
  boatSelect.value = String(boats.findIndex(b => b.name === s.boat));
  materialSelect.value = s.material;
  provisionPackSelect.value = s.provisionPack;
  selectCrew();
  raceElapsed = s.elapsed;
  distance = s.distance;
  speed = s.speed;
  quality = s.quality;
  playerRouteChoice = s.routeChoice === 'alternative' ? 'alternative' : 'primary';
  strokePower = Number.isFinite(rower.racePower)
    ? rower.racePower
    : Number.isFinite(s.strokePower) ? clamp(s.strokePower, 30, 110) : 70;
  raceDay = validRaceDay(s.raceDay) ? s.raceDay : randomRaceDay(rower);
  raceStats = s.raceStats &&
    ['maxSpeed', 'activeSeconds', 'powerIntegral', 'cadenceIntegral', 'qualityIntegral'].every(key => Number.isFinite(s.raceStats[key])) &&
    (s.raceStats.halfwayAt === null || Number.isFinite(s.raceStats.halfwayAt))
      ? {...s.raceStats}
      : newRaceStats();
  carbs = s.carbs;
  bloodCarbs = s.bloodCarbs;
  gutCarbs = s.gutCarbs;
  fluidBalance = s.fluidBalance;
  gutFluid = s.gutFluid;
  sodiumBalance = s.sodiumBalance;
  gutSodium = s.gutSodium;
  gutStress = s.gutStress;
  digestionLoad = s.digestionLoad;
  gutFood = s.gutFood;
  intakeUntil = raceElapsed + clamp(s.intakeRemaining, 0, 120);
  intakeStartedAt = raceElapsed - Math.max(0, clamp(s.intakeDuration, 0, 120) - clamp(s.intakeRemaining, 0, 120));
  intakePowerFactor = clamp(s.intakePowerFactor, .4, 1);
  intakeKey = s.intakeRemaining > 0 ? s.intakeKey : null;
  intakeMessage = intakeKey ? (s.intakeMessage || randomIntakeMessage(intakeKey, foods[intakeKey])) : '';
  alcoholLoad = s.alcoholLoad;
  nicotineLoad = s.nicotineLoad;
  wPrime = s.wPrime;
  freshness = s.freshness;
  techniqueControl = s.techniqueControl;
  hydration = s.hydration;
  energy = s.energy;
  blisters = s.blisters;
  cramps = s.cramps;
  inventory = {
    ...s.inventory
  };
  if (Array.isArray(s.bots)) {
    botRacers = s.bots.flatMap((saved, index) => {
      const botRower = rowers.find(r => r.name === saved.rower);
      return botRower && Number.isFinite(saved.distance) && Number.isFinite(saved.speed) && Number.isFinite(saved.wPrime) && Number.isFinite(saved.freshness) && Number.isFinite(saved.energy) ? [{
        rower: botRower,
        distance: clamp(saved.distance, 0, TOTAL),
        speed: clamp(saved.speed, 0, maxRowerSpeed(botRower)),
        lane: Number.isFinite(saved.lane) ? clamp(saved.lane, -2, 2) : initialRaceLane(index),
        laneTarget: Number.isFinite(saved.laneTarget) ? clamp(saved.laneTarget, -2, 2) : initialRaceLane(index),
        routeBias: Number.isFinite(saved.routeBias) ? clamp(saved.routeBias, -2, 2) : initialRaceLane(index),
        routeChoice: saved.routeChoice === 'alternative' ? 'alternative' : 'primary',
        wPrime: clamp(saved.wPrime, 0, 100),
        freshness: clamp(saved.freshness, 0, 100),
        energy: clamp(saved.energy, 0, 100),
        fluidBalance: Number.isFinite(saved.fluidBalance) ? clamp(saved.fluidBalance, -100, 100) : (validRaceDay(saved.day) ? (saved.day.hydration - 100) / 31.25 : 0),
        gutFluid: Number.isFinite(saved.gutFluid) ? clamp(saved.gutFluid, 0, 30) : 0,
        gutCarbs: Number.isFinite(saved.gutCarbs) ? clamp(saved.gutCarbs, 0, 2000) : 0,
        gutStress: Number.isFinite(saved.gutStress) ? clamp(saved.gutStress, 0, 100) : 0,
        sodiumBalance: Number.isFinite(saved.sodiumBalance) ? clamp(saved.sodiumBalance, -1e6, 1e6) : 700,
        hydration: Number.isFinite(saved.hydration) ? clamp(saved.hydration, 0, 100) : (validRaceDay(saved.day) ? saved.day.hydration : 100),
        cramps: Number.isFinite(saved.cramps) ? clamp(saved.cramps, 0, 100) : (validRaceDay(saved.day) ? saved.day.cramps : 0),
        nextFuelAt: Number.isFinite(saved.nextFuelAt) ? Math.max(0, saved.nextFuelAt) : s.elapsed + (720 - s.elapsed % 720),
        day: validRaceDay(saved.day) ? saved.day : randomRaceDay(botRower),
        finishedAt: saved.finishedAt === null || Number.isFinite(saved.finishedAt) ? saved.finishedAt : null
      }] : [];
    });
  }
  rowerChatter.restore(s.chatter, rower.name, raceElapsed);
  running = true;
  recordEligible = true;
  document.body.classList.remove('start-menu');
  rowingAudio.stopMenuMusic();
  last = performance.now();
  phaseStart = last - TARGET_RECOVERY * 1000;
  rowerSelect.disabled = partnerRowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = provisionPackSelect.disabled = true;
  document.body.classList.add('race-mode');
  ui.start.classList.add('hidden');
  resize();
  updateInventory();
  updateCramps(0, 0);
  updateUI();
  saveRace();
}
