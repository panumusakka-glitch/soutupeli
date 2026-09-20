const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function targetStrokeRate() {
  return raceType === 'alternating' ? 35 : 28;
}

function targetStrokeCycle() {
  return 60 / targetStrokeRate();
}

function targetStrokeRecovery() {
  return targetStrokeCycle() - TARGET_DRIVE;
}

function optimalStrokeRateCeiling() {
  return raceType === 'alternating' ? 35 : 28;
}

function isGoldenBoat() {
  return rower.name === 'Heikki Karjaluoto' &&
    selectedBoat.name === 'Lonka' &&
    material === 'mahogany';
}

/*
 * Nykyinen vetotahti.
 *
 * Perustuu viimeisimpään vetoväliin ja reagoi heti,
 * jos pelaaja hidastaa tahtia.
 */
function currentStrokeRate(now = performance.now()) {
  if (strokeTimes.length < 2) return 0;

  const last = strokeTimes.at(-1);
  const previous = strokeTimes.at(-2);

  const lastInterval = last - previous;
  const timeSinceLastStroke = now - last;

  const effectiveInterval = Math.max(
    lastInterval,
    timeSinceLastStroke
  );

  return effectiveInterval > 0
    ? 60000 / effectiveInterval
    : 0;
}

/*
 * Vetotahdin hyötysuhde.
 *
 * 25 vetoa/min asti täysi hyötysuhde.
 * Sen jälkeen liian kiireinen soutaminen alkaa
 * nopeasti heikentää veneen etenemistä.
 *
 * Noin:
 * 25 rpm -> 100 %
 * 30 rpm -> ~94 %
 * 35 rpm -> ~83 %
 * 40 rpm -> ~70 %
 * 50 rpm -> ~45 %
 * 60 rpm -> ~27 %
 */
function strokeRateEfficiency(rpm) {
  const ceiling = optimalStrokeRateCeiling();
  if (rpm <= ceiling) return 1;

  const excess = rpm - ceiling;

  return clamp(
    Math.exp(-Math.pow(excess / 29, 1.55)),
    0.18,
    1
  );
}

/*
 * Ylikovan vetotahdin aiheuttama lisärasitus.
 *
 * 25 rpm asti ei erillistä rangaistusta.
 * Yli 25 rpm rasitus kasvaa epälineaarisesti.
 */
function strokeRateStrain(rpm) {
  const ceiling = optimalStrokeRateCeiling();
  if (rpm <= ceiling) return 0;

  return Math.pow((rpm - ceiling) / 18, 2.3);
}

/*
 * Ylikovan vetotahdin vaikutus rakkoihin.
 */
function strokeRateBlisterFactor(rpm) {
  const ceiling = optimalStrokeRateCeiling();
  if (rpm <= ceiling) return 1;

  return 1 + 3.5 * Math.pow((rpm - ceiling) / 25, 1.7);
}

function powerStrain(demand = calculateExerciseDemand()) {
  return demand.powerLoad;
}

function overdriveStrain(demand = calculateExerciseDemand()) {
  return demand.overdrive;
}

function rowerSweatRate(r = rower) {
  const sexAdjustment = r.voiceGender === 'female' ? -.08 : .04;
  return .72 + .22 * r.power / 99 + .18 * (1 - r.stomach / 99) + sexAdjustment;
}

/*
 * Critical power is the highest stroke-power setting a rower can maintain
 * over the long race. W′ is the finite reserve above that level; freshness
 * models the separate, slowly accumulating fatigue of the full race.
 */
function criticalStrokePower(r = rower, currentFreshness = freshness) {
  const endurance = crewStat('endurance', r), power = crewStat('power', r);
  return (54 + .30 * endurance + .08 * power) * (.82 + .18 * currentFreshness / 100);
}

function availableStrokePower() {
  const critical = criticalStrokePower();
  const nicotineFactor = 1 - Math.min(.22, .025 * Math.pow(nicotineLoad, 1.25));
  const digestionFactor = 1 - Math.min(.12, .0012 * Math.pow(digestionLoad, 1.08));
  const fullnessFactor = 1 - Math.min(.4, gutFood / 3300);
  const eatingFactor = raceElapsed < intakeUntil ? intakePowerFactor : 1;
  const substanceFactor = nicotineFactor * digestionFactor * fullnessFactor * eatingFactor;
  if (strokePower <= critical) return strokePower * substanceFactor;
  // A drained W′ reserve also leaves short-term fatigue, so an all-out
  // request cannot turn into an indefinitely sustainable critical effort.
  const depletedLimit = critical * (.86 + .08 * freshness / 100);
  return (depletedLimit + (strokePower - depletedLimit) * clamp(wPrime / 30)) * substanceFactor;
}

/*
 * Yksi tilannekuva pelaajan tämänhetkisestä suorituksesta. Tämä pitää
 * etenemiseen ja fysiologiaan käytetyt arvot samoina yhden päivityksen ajan.
 * Paluuarvo erottaa pyydetyn, kehon tuottaman ja veneeseen välittyvän tehon,
 * jotta mallia voidaan myöhemmin tarkentaa ilman uusia rinnakkaisia kaavoja.
 */
function calculateExerciseDemand(s = null, active = true, now = performance.now()) {
  const rpm = currentStrokeRate(now);
  const effectivePower = availableStrokePower();
  const criticalPower = criticalStrokePower();
  const cadenceStrain = strokeRateStrain(rpm);
  const powerLoad = active ? Math.pow(effectivePower / 70, 2) : 1;
  const overdrive = active ? Math.max(0, (effectivePower - 100) / 10) : 0;
  const powerEffort = .35 + .65 * clamp((effectivePower - 30) / 80);
  const cadenceEffort = clamp(rpm / targetStrokeRate(), .35, 1.45);
  const techniqueCost = 1 + .25 * clamp(1 - quality);
  const resistance = 1 + Math.max(0, s?.speedLoss || 0) / 4.6;
  const effort = active
    ? clamp(powerEffort * cadenceEffort * techniqueCost * resistance)
    : 0;
  const dayStrain = (raceDay?.strain || 1) *
    (s?.wind ? 1 + ((raceDay?.windStrain || 1) - 1) * (s.windLoad ?? 1) : 1);
  const carbohydrateBurnRate = active
    ? (
      48 +
      45 * Math.pow(effort, 1.7) +
      30 * cadenceStrain +
      35 * Math.max(0, powerLoad - 1) +
      150 * overdrive
    ) * dayStrain
    : 0;

  return {
    requestedPower: strokePower,
    criticalPower,
    effectivePower,
    propulsionPower: effectivePower * strokeRateEfficiency(rpm),
    effort,
    carbohydrateBurnRate,
    anaerobicLoad: Math.max(0, effectivePower - criticalPower) / 15,
    rpm,
    cadenceStrain,
    powerLoad,
    overdrive
  };
}

function effectiveStrokePower() {
  return calculateExerciseDemand().effectivePower;
}

// Stroke power improves boat speed with diminishing returns. A linear power
// multiplier made elite rowers unrealistically faster than the historical
// route record even though the physiological cost was already nonlinear.
function strokePowerSpeedFactor(power = effectiveStrokePower()) {
  return Math.pow(Math.max(0, power) / 70, .35);
}

function updateWPrime(dt, active) {
  if (!active) return;

  const critical = criticalStrokePower();
  const requestedExcess = strokePower - critical;
  if (requestedExcess > 0) {
    // 10 percentage points above critical power empties a full reserve in ~15 min.
    wPrime = clamp(wPrime - requestedExcess * dt / 90, 0, 100);
  } else {
    // Easy rowing restores only part of the reserve, and does so gradually.
    const alcoholRecovery = 1 / (1 + .22 * Math.pow(alcoholLoad, 1.35));
    wPrime = clamp(wPrime + (critical - strokePower) * dt / 160 * alcoholRecovery, 0, 100);
  }
}

function updateFreshness(dt, effort, active, demand = calculateExerciseDemand()) {
  if (!active) return;
  const load = .35 + .65 * effort + .20 * demand.cadenceStrain +
    .35 * demand.anaerobicLoad;
  freshness = clamp(freshness - load * dt / 900, 0, 100);
}

function updateTechniqueControl(dt, s, effort, active, demand = calculateExerciseDemand(s, active)) {
  if (!active) return;

  const fatigueLoad =
    Math.max(0, 65 - energy) / 65 +
    Math.max(0, 75 - hydration) / 75 +
    .45 * (1 - freshness / 100) +
    .35 * (1 - wPrime / 100) +
    .55 * demand.anaerobicLoad +
    .25 * demand.cadenceStrain +
    .16 * Math.pow(alcoholLoad, 1.2) +
    .08 * Math.pow(nicotineLoad, 1.15) +
    .004 * Math.pow(digestionLoad, 1.15) +
    (s.wind ? .22 * (s.windLoad ?? 1) : 0);
  const skillProtection = .55 + .45 * rower.skill / 99;
  const deterioration = fatigueLoad * (.04 + .10 * effort) / skillProtection;
  const recovery = effort < .48 && fatigueLoad < .45
    ? .09 * (.6 + .4 * rower.skill / 99)
    : .012;
  const substanceRecovery = recovery / (1 + .3 * alcoholLoad + .12 * nicotineLoad);

  techniqueControl = clamp(
    techniqueControl + (substanceRecovery - deterioration) * dt / 3600,
    .35,
    1
  );
}

function rowingEffort(s, active = true) {
  return calculateExerciseDemand(s, active).effort;
}

function maxRowerSpeed(r = rower) {
  const speedFactor = crewStat('speed', r) / 99;
  const powerFactor = .65 + .35 * crewStat('power', r) / 99;
  const calculated = MAX_SPEED * speedFactor * powerFactor * (raceType === 'church' && r === rower ? CHURCH_SPEED_FACTOR : ['double', 'alternating'].includes(raceType) && r === rower ? doubleSpeedFactor() : 1);
  return Math.min(calculated, tourSpeedLimit(r));
}

function tourSpeedLimit(r) {
  return isTourRace() && r.name !== 'Ari Kankkunen' ? 10 : Infinity;
}

const CHURCH_SPEED_FACTOR = (5 * 3600 + 4 * 60 + 50) / (3 * 3600 + 51 * 60 + 20);

// Virallisten 60 km reittiennätysten nopeussuhteet: vuorosoutu / yksinsoutu.
const DOUBLE_SPEED_FACTORS = {
  male: (5 * 3600 + 4 * 60 + 50) / (4 * 3600 + 42 * 60 + 50),
  female: (6 * 3600 + 1 * 60 + 11) / (5 * 3600 + 23 * 60 + 8),
  mixed: Math.sqrt((5 * 3600 + 4 * 60 + 50) * (6 * 3600 + 1 * 60 + 11)) / (5 * 3600 + 2 * 60 + 30)
};
function doubleSpeedFactor() {
  return DOUBLE_SPEED_FACTORS[crewCategory()] || DOUBLE_SPEED_FACTORS.mixed;
}

function boatWeight() {
  return selectedBoat.weight || materials[material].weight;
}

function boatSpeedFactor() {
  if (raceType === 'church') return 1.04;
  if (usesKayak()) return 1;
  return (.90 + .02 * selectedBoat.hull) *
    (1 + (50 - boatWeight()) * .0015);
}

function windPenalty(head, cross) {
  return (
    head * (1 + (5 - selectedBoat.headwind) * .18) +
    cross * (1 + (5 - selectedBoat.stability) * .25)
  ) * materials[material].windMultiplier;
}

function crampFactor() {
  return Math.max(
    .015,
    1 - .985 * Math.pow(cramps / 100, 2.4)
  );
}

function updateCramps(dt, effort, active = true, s = null, demand = calculateExerciseDemand(s, active)) {
  const {rpm, cadenceStrain, powerLoad, overdrive} = demand;
  const overCritical = demand.anaerobicLoad;
  const reserveDepletion = 1 - wPrime / 100;
  const windLoad = s?.wind
    ? (.35 + Math.max(0, s.speedLoss) / 4) * (s.windLoad ?? 1)
    : 0;

  if (active) {
    powerSurge = clamp(
      powerSurge + Math.max(0, strokePower - lastPowerSetting) * .45 - dt * .015,
      0,
      100
    );
    lastPowerSetting = strokePower;
  } else {
    powerSurge = clamp(powerSurge - dt * .03, 0, 100);
    lastPowerSetting = strokePower;
  }

  const imbalance =
    Math.max(0, (80 - hydration) / 80) +
    Math.max(0, (45 - energy) / 90) +
    Math.max(0, -sodiumBalance) / 6000;

  const susceptibility = rower.cramp / 99;

  const neuromuscularLoad =
    .08 +
    .60 * overCritical +
    .45 * reserveDepletion +
    .30 * windLoad +
    powerSurge / 80;

  const growth =
    susceptibility *
    (.25 + effort) *
    42 *
    neuromuscularLoad *
    (1 + imbalance * .8) *
    (1 + cadenceStrain * .35) *
    (.55 + .45 * powerLoad) *
    (1 + 1.5 * overdrive);

  const recovery =
    hydration > 75 &&
    energy > 40 &&
    sodiumBalance > -300
      ? effort < .25 && rpm <= optimalStrokeRateCeiling()
        ? 32
        : 5
      : 0;

  cramps = clamp(
    cramps + (growth - recovery) * dt / 3600,
    0,
    100
  );
}

function updateBody(dt, s, raceSec, active) {
  const hour = dt / 3600;
  const alcoholAtStart = alcoholLoad;
  const nicotineAtStart = nicotineLoad;
  // Effort is established before W′ changes, matching the force that caused
  // this time step. Consequences use the post-update power snapshot.
  const effortDemand = calculateExerciseDemand(s, active);
  const effort = effortDemand.effort;
  const carbBurn = effortDemand.carbohydrateBurnRate * hour;
  updateWPrime(dt, active);
  const demand = calculateExerciseDemand(s, active);
  const {rpm, cadenceStrain, powerLoad} = demand;
  updateFreshness(dt, effort, active, demand);
  updateTechniqueControl(dt, s, effort, active, demand);

  const carbAbsorb = Math.min(
    gutCarbs,
    (55 + 35 * rower.stomach / 99) * hour / (1 + gutStress / 120 + digestionLoad / 80),
    Math.max(0, 45 - bloodCarbs)
  );

  gutCarbs -= carbAbsorb;
  bloodCarbs = clamp(bloodCarbs + carbAbsorb, 0, 45);

  // During a long race, regularly ingested carbohydrate supplies a substantial
  // share of working-muscle carbohydrate use and spares limited glycogen.
  const bloodBurn = Math.min(bloodCarbs, carbBurn * INGESTED_CARB_USE_SHARE);
  bloodCarbs -= bloodBurn;

  const substanceBurn = active ? 8 * Math.pow(nicotineAtStart, 1.3) * hour : 0;
  carbs = clamp(
    carbs - (carbBurn + substanceBurn - bloodBurn),
    0,
    420
  );

  const fluidAbsorb =
    Math.min(
      gutFluid,
      (.8 + .3 * rower.stomach / 99) * hour
    ) /
    (1 + gutStress / 100 + digestionLoad / 75);

  gutFluid -= fluidAbsorb;

  const sodiumAbsorb =
    gutSodium * (1 - Math.exp(-dt / 300));

  gutSodium -= sodiumAbsorb;
  sodiumBalance += sodiumAbsorb;

  updateCramps(dt, effort, active, s, demand);

  /*
   * Ylikova vetotahti kasvattaa hieman myös hikoilua.
   */
  const sweat = active
    ? (
      .42 +
      .42 * effort +
      .10 * Math.min(cadenceStrain, 3) +
      .08 * Math.max(0, powerLoad - 1)
    ) *
    rowerSweatRate() *
    (raceDay?.heat || 1) *
    s.sweat *
    hour
    : 0;

  fluidBalance += fluidAbsorb - sweat - .045 * Math.pow(alcoholAtStart, 1.35) * hour;
  sodiumBalance -= sweat * 780;

  const excessCarbs = Math.max(
    0,
    gutCarbs - (40 + 50 * rower.stomach / 99)
  );

  gutStress = clamp(
    gutStress +
      excessCarbs / 70 * 5 * hour -
      Math.min(gutStress, 7 * hour / (1 + digestionLoad / 50)),
    0,
    100
  );

  const fluidScore =
    fluidBalance < 0
      ? clamp(1 + fluidBalance / 3.2)
      : clamp(1 - fluidBalance / 2.0);

  const saltScore = clamp(
    1 -
      Math.max(0, -sodiumBalance) / 6000 -
      Math.max(0, sodiumBalance - 4200) / 10000
  );

  energy = 100 * clamp(
    .85 * (carbs - 25) / 395 +
    .15 * bloodCarbs / 25
  );

  hydration = 100 * clamp(
    fluidScore * saltScore
  );

  alcoholLoad = Math.max(0, alcoholLoad - .18 * hour);
  nicotineLoad = Math.max(0, nicotineLoad - 1.25 * hour);
  digestionLoad = Math.max(0, digestionLoad - 3 * hour);
  gutFood = Math.max(0, gutFood - 250 * hour);

  /*
   * Normaali fyysinen rasitus +
   * liian suuren vetotahdin rasitus.
   */
  if (rower.blisterImmune) {
    blisters = 0;
  } else if (raceSec >= 1800) {
    const irregularity = clamp(1 - quality);

    const cadenceBlisterFactor =
      strokeRateBlisterFactor(rpm);

    const techniqueLoad =
      .15 + .85 * Math.pow(irregularity, 1.35);

    blisters = clamp(
      blisters +
        45 *
        techniqueLoad *
        hour *
        (1.4 - rower.hands / 99) *
        cadenceBlisterFactor,
      0,
      100
    );
  }
}
