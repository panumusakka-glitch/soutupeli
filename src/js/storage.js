const SAVE_KEY = 'suursoutu-race-v1';
const SAVE_SLOTS = [SAVE_KEY, `${SAVE_KEY}-2`, `${SAVE_KEY}-3`];
let activeSaveSlot = 1,
  pausedSaveSlot = null;
const stateRanges = {
  elapsed: [0, 1e8],
  distance: [0, TOTAL - .00001],
  speed: [0, Math.max(...rowers.map(r => maxRowerSpeed(r)))],
  quality: [0, 1],
  carbs: [0, 420],
  gutCarbs: [0, 2000],
  fluidBalance: [-100, 100],
  gutFluid: [0, 30],
  sodiumBalance: [-1e6, 1e6],
  gutSodium: [0, 1e5],
  gutStress: [0, 100],
  stamina: [0, 100],
  hydration: [0, 100],
  energy: [0, 100],
  blisters: [0, 100],
  cramps: [0, 100]
};
function validRace(s) {
  if (!s || s.version !== 1 || !rowers.some(r => r.name === s.rower) || !boats.some(b => b.name === s.boat) || !Object.hasOwn(materials, s.material)) return false;
  if (boats.find(b => b.name === s.boat).spruceOnly && s.material !== 'spruce') return false;
  if (!Object.entries(stateRanges).every(([k, [lo, hi]]) => Number.isFinite(s[k]) && s[k] >= lo && s[k] <= hi)) return false;
  const max = initialInventory();
  return s.inventory && Object.entries(max).every(([k, n]) => Number.isInteger(s.inventory[k]) && s.inventory[k] >= 0 && s.inventory[k] <= n);
}
function loadRace(slot = activeSaveSlot) {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_SLOTS[slot - 1]));
    return validRace(s) ? s : null;
  } catch {
    return null;
  }
}
function snapshot() {
  return {
    version: 1,
    rower: rower.name,
    boat: selectedBoat.name,
    material,
    elapsed: raceElapsed,
    distance,
    speed,
    quality,
    strokePower,
    raceDay,
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
    cramps,
    inventory: {
      ...inventory
    },
    bots: botRacers.map(bot => ({
      rower: bot.rower.name,
      distance: bot.distance,
      speed: bot.speed,
      stamina: bot.stamina,
      energy: bot.energy,
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
  const saves = savedRaces();
  document.getElementById('resumePanel').hidden = false;
  document.getElementById('selectionPanel').hidden = true;
  document.getElementById('startInstructions').hidden = true;
  document.getElementById('saveStatus').hidden = true;
  document.getElementById('startButton').hidden = true;
  document.getElementById('saveMenuActions').hidden = false;
  document.getElementById('saveSlotPanel').hidden = true;
  document.getElementById('saveMenuTitle').textContent = 'Valitse pelitapa';
  document.getElementById('resumeSummary').textContent = 'Jatka aiempaa soutua tai aloita uusi.';
  document.getElementById('continueMenuButton').disabled = !saves.some(Boolean);
}
function showSaveSlots(mode) {
  const saves = savedRaces();
  document.getElementById('saveMenuActions').hidden = true;
  document.getElementById('saveSlotPanel').hidden = false;
  document.getElementById('saveMenuTitle').textContent = mode === 'continue' ? 'Valitse jatkettava soutu' : 'Valitse tallennuspaikka';
  document.getElementById('resumeSummary').textContent = mode === 'continue' ? 'Valitse tallennus, jota haluat jatkaa.' : 'Uusi soutu tallennetaan valitsemaasi paikkaan.';
  document.getElementById('saveSlots').innerHTML = saves.map((save, index) => {
    const slot = index + 1;
    const details = save ? `${save.rower} · ${(save.distance / 1000).toFixed(1).replace('.', ',')} km · ${formatTime(save.elapsed)}` : 'Tyhjä';
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
  document.getElementById('resumePanel').hidden = true;
  document.getElementById('selectionPanel').hidden = false;
  document.getElementById('startInstructions').hidden = false;
  document.getElementById('saveStatus').hidden = false;
  document.getElementById('startButton').hidden = false;
  document.getElementById('saveStatus').textContent = `Soutu tallentuu paikkaan ${slot}.`;
  document.getElementById('startButton').textContent = 'Lähde Hakovirralta';
}
function resumeRace(slot = activeSaveSlot) {
  activeSaveSlot = slot;
  const s = pausedSaveSlot === slot ? pausedSave : loadRace(slot);
  if (!validRace(s)) return;
  rowingAudio.unlock();
  reset();
  rowerSelect.value = String(rowers.findIndex(r => r.name === s.rower));
  boatSelect.value = String(boats.findIndex(b => b.name === s.boat));
  materialSelect.value = s.material;
  selectCrew();
  raceElapsed = s.elapsed;
  distance = s.distance;
  speed = s.speed;
  quality = s.quality;
  strokePower = Number.isFinite(rower.racePower)
    ? rower.racePower
    : Number.isFinite(s.strokePower) ? clamp(s.strokePower, 30, 110) : 70;
  raceDay = validRaceDay(s.raceDay) ? s.raceDay : randomRaceDay(rower);
  carbs = s.carbs;
  gutCarbs = s.gutCarbs;
  fluidBalance = s.fluidBalance;
  gutFluid = s.gutFluid;
  sodiumBalance = s.sodiumBalance;
  gutSodium = s.gutSodium;
  gutStress = s.gutStress;
  stamina = s.stamina;
  hydration = s.hydration;
  energy = s.energy;
  blisters = s.blisters;
  cramps = s.cramps;
  inventory = {
    ...s.inventory
  };
  if (Array.isArray(s.bots)) {
    botRacers = s.bots.flatMap(saved => {
      const botRower = rowers.find(r => r.name === saved.rower);
      return botRower && Number.isFinite(saved.distance) && Number.isFinite(saved.speed) && Number.isFinite(saved.stamina) && Number.isFinite(saved.energy) ? [{
        rower: botRower,
        distance: clamp(saved.distance, 0, TOTAL),
        speed: clamp(saved.speed, 0, maxRowerSpeed(botRower)),
        stamina: clamp(saved.stamina, 0, 100),
        energy: clamp(saved.energy, 0, 100),
        day: validRaceDay(saved.day) ? saved.day : randomRaceDay(botRower),
        finishedAt: saved.finishedAt === null || Number.isFinite(saved.finishedAt) ? saved.finishedAt : null
      }] : [];
    });
  }
  rowerChatter.restore(s.chatter, rower.name, raceElapsed);
  running = true;
  last = performance.now();
  phaseStart = last - TARGET_RECOVERY * 1000;
  rowerSelect.disabled = boatSelect.disabled = materialSelect.disabled = true;
  document.body.classList.add('race-mode');
  ui.start.classList.add('hidden');
  resize();
  updateInventory();
  updateCramps(0, 0);
  updateUI();
  saveRace();
}
