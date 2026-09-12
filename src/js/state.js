// Shared live simulation state; defaults are in data/config.js and data/foods.js.
let raceElapsed = 0,
  lastSaveAt = 0,
  pausedSave = null;
let running = false,
  pressing = false,
  last = performance.now(),
  startTime = 0,
  phaseStart = 0,
  speed = 0,
  distance = 0,
  strokeTimes = [],
  lastDrive = 0,
  lastRecovery = 0,
  quality = .5,
  strokePulse = 0,
  feedbackTimer = 0;
let {
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
} = INITIAL_BODY;
let activeInput = null,
  activeSurface = null;
let inventory = initialInventory();
let rower = rowers.find(r => r.name === DEFAULT_CREW.rower),
  selectedBoat = boats.find(b => b.name === DEFAULT_CREW.boat),
  material = DEFAULT_CREW.material;
let botRacers = [];
