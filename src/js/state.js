// Shared live simulation state; defaults are in data/config.js and data/foods.js.
let raceElapsed = 0,
  lastSaveAt = 0,
  pausedSave = null;
let running = false,
  pressing = false,
  previewMode = false,
  previewLastStroke = 0,
  previewPlaybackRate = 180,
  ferryProgress = 0,
  ferryDirection = 1,
  ferryDockWait = 8,
  last = performance.now(),
  startTime = 0,
  phaseStart = 0,
  speed = 0,
  distance = 0,
  strokeTimes = [],
  lastDrive = 0,
  lastRecovery = 0,
  quality = .5,
  strokePower = 70,
  strokePulse = 0,
  feedbackTimer = 0,
  lastPowerSetting = 70,
  powerSurge = 0;
let {
  carbs,
  bloodCarbs,
  gutCarbs,
  fluidBalance,
  gutFluid,
  sodiumBalance,
  gutSodium,
  gutStress,
  wPrime,
  freshness,
  techniqueControl,
  hydration,
  energy,
  blisters,
  cramps
} = INITIAL_BODY;
let activeInput = null,
  activeSurface = null;
let inventory = initialInventory();
let rower = rowers.find(r => r.name === DEFAULT_CREW.rower),
  selectedBoat = boats.find(b => b.name === DEFAULT_CREW.boat),
  material = DEFAULT_CREW.material;
let botRacers = [];
let raceDay = null;
let recordEligible = false;
function newRaceStats() {
  return {
    maxSpeed: 0,
    activeSeconds: 0,
    powerIntegral: 0,
    cadenceIntegral: 0,
    qualityIntegral: 0,
    halfwayAt: null
  };
}
let raceStats = newRaceStats();
