const TOTAL = 58300,
  MAX_SPEED = 14.2,
  RACE_SPEED_FACTOR = .981,
  TARGET_SPM = 21,
  TARGET_DRIVE = 1,
  TARGET_CYCLE = 60 / TARGET_SPM,
  TARGET_RECOVERY = TARGET_CYCLE - TARGET_DRIVE;
const INITIAL_BODY = {
  carbs: 420,
  bloodCarbs: 20,
  gutCarbs: 0,
  fluidBalance: 0,
  gutFluid: 0,
  sodiumBalance: 700,
  gutSodium: 0,
  gutStress: 0,
  wPrime: 100,
  freshness: 100,
  techniqueControl: 1,
  hydration: 100,
  energy: 100,
  blisters: 0,
  cramps: 0
};

const DEFAULT_CREW = {rower: 'Panu Musakka', boat: 'Lonka', material: 'mahogany'};
