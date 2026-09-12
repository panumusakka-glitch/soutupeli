const SAVE_KEY = 'suursoutu-race-v1';
const stateRanges = {
  elapsed: [0, 1e8],
  distance: [0, TOTAL - .00001],
  speed: [0, MAX_SPEED],
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
function loadRace() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
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
    chatter: rowerChatter.snapshot()
  };
}
function saveRace() {
  if (!running || distance >= TOTAL) return false;
  pausedSave = snapshot();
  lastSaveAt = performance.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(pausedSave));
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
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}
function showSavedRace() {
  const s = pausedSave || loadRace();
  document.getElementById('resumePanel').hidden = !s;
  document.getElementById('resumeSummary').textContent = s ? `${s.rower} · ${(s.distance / 1000).toFixed(1).replace('.', ',')} km · ${formatTime(s.elapsed)}` : '';
  document.getElementById('startButton').textContent = s ? 'Aloita uusi soutu' : 'Lähde Hakovirralta';
}
function resumeRace() {
  const s = pausedSave || loadRace();
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
