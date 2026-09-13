const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

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
  if (rpm <= 25) return 1;

  const excess = rpm - 25;

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
  if (rpm <= 25) return 0;

  return Math.pow((rpm - 25) / 18, 2.3);
}

/*
 * Ylikovan vetotahdin vaikutus rakkoihin.
 */
function strokeRateBlisterFactor(rpm) {
  if (rpm <= 25) return 1;

  return 1 + 3.5 * Math.pow((rpm - 25) / 25, 1.7);
}

function powerStrain() {
  return Math.pow(effectiveStrokePower() / 70, 2);
}

function overdriveStrain() {
  return Math.max(0, (effectiveStrokePower() - 100) / 10);
}

function rowerSweatRate(r = rower) {
  const sexAdjustment = r.voiceGender === 'female' ? -.08 : .04;
  return .72 + .22 * r.power / 99 + .18 * (1 - r.stomach / 99) + sexAdjustment;
}

/*
 * Critical power is the highest stroke-power setting a rower can maintain
 * over the long race. Stamina is the finite W' reserve above that level.
 */
function criticalStrokePower(r = rower) {
  return 54 + .30 * r.endurance + .08 * r.power;
}

function effectiveStrokePower() {
  const critical = criticalStrokePower();
  if (strokePower <= critical) return strokePower;
  // A nearly empty W' reserve progressively removes unsustainable power.
  return critical + (strokePower - critical) * clamp(stamina / 20);
}

function updateWPrime(dt, active) {
  if (!active) return;

  const critical = criticalStrokePower();
  const requestedExcess = strokePower - critical;
  if (requestedExcess > 0) {
    // 10 percentage points above critical power empties a full reserve in ~15 min.
    stamina = clamp(stamina - requestedExcess * dt / 90, 0, 100);
  } else {
    // Easy rowing restores only part of the reserve, and does so gradually.
    stamina = clamp(stamina + (critical - strokePower) * dt / 160, 0, 100);
  }
}

function updateTechniqueControl(dt, s, effort, active) {
  if (!active) return;

  const fatigueLoad =
    Math.max(0, 65 - energy) / 65 +
    Math.max(0, 75 - hydration) / 75 +
    .8 * (1 - stamina / 100) +
    .55 * Math.max(0, effectiveStrokePower() - criticalStrokePower()) / 15 +
    .25 * strokeRateStrain(currentStrokeRate()) +
    (s.wind ? .22 : 0);
  const skillProtection = .55 + .45 * rower.skill / 99;
  const deterioration = fatigueLoad * (.04 + .10 * effort) / skillProtection;
  const recovery = effort < .48 && fatigueLoad < .45
    ? .09 * (.6 + .4 * rower.skill / 99)
    : .012;

  techniqueControl = clamp(
    techniqueControl + (recovery - deterioration) * dt / 3600,
    .35,
    1
  );
}

function rowingEffort(s, active = true) {
  if (!active) return 0;

  const powerEffort = .35 + .65 * clamp((effectiveStrokePower() - 30) / 80);
  const cadenceEffort = clamp(currentStrokeRate() / TARGET_SPM, .35, 1.45);
  const techniqueCost = 1 + .25 * clamp(1 - quality);
  const resistance = 1 + Math.max(0, s.speedLoss) / 4.6;

  return clamp(powerEffort * cadenceEffort * techniqueCost * resistance);
}

function maxRowerSpeed(r = rower) {
  const speedFactor = r.speed / 99;
  const powerFactor = .65 + .35 * r.power / 99;
  return MAX_SPEED * speedFactor * powerFactor;
}

function boatWeight() {
  return materials[material].weight;
}

function boatSpeedFactor() {
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

function updateCramps(dt, effort, active = true, s = null) {
  const rpm = currentStrokeRate();
  const cadenceStrain = strokeRateStrain(rpm);
  const powerLoad = active ? powerStrain() : 1;
  const overdrive = active ? overdriveStrain() : 0;
  const effectivePower = effectiveStrokePower();
  const overCritical = Math.max(0, effectivePower - criticalStrokePower()) / 15;
  const reserveDepletion = 1 - stamina / 100;
  const windLoad = s?.wind ? .35 + s.speedLoss / 4 : 0;

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
      ? effort < .25 && rpm <= 25
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
  const rpm = currentStrokeRate();

  const effort = rowingEffort(s, active);
  updateWPrime(dt, active);
  updateTechniqueControl(dt, s, effort, active);
  const cadenceStrain = strokeRateStrain(rpm);
  const powerLoad = active ? powerStrain() : 1;
  const overdrive = active ? overdriveStrain() : 0;
  const dayStrain = (raceDay?.strain || 1) * (s.wind ? raceDay?.windStrain || 1 : 1);

  /*
   * Liian suuri vetotahti kuluttaa energiaa,
   * vaikka vene ei enää kulkisi kovempaa.
   */
  const cadenceCarbBurn = 30 * cadenceStrain;

  const carbBurn = active
    ? (
      48 +
      45 * Math.pow(effort, 1.7) +
      cadenceCarbBurn +
      35 * Math.max(0, powerLoad - 1) +
      150 * overdrive
    ) * dayStrain * hour
    : 0;

  const carbAbsorb = Math.min(
    gutCarbs,
    (55 + 35 * rower.stomach / 99) * hour,
    Math.max(0, 45 - bloodCarbs)
  );

  gutCarbs -= carbAbsorb;
  bloodCarbs = clamp(bloodCarbs + carbAbsorb, 0, 45);

  // Competition food first supports blood glucose and only then spares glycogen.
  const bloodBurn = Math.min(bloodCarbs, carbBurn * .35);
  bloodCarbs -= bloodBurn;

  carbs = clamp(
    carbs - (carbBurn - bloodBurn),
    0,
    420
  );

  const fluidAbsorb =
    Math.min(
      gutFluid,
      (.8 + .3 * rower.stomach / 99) * hour
    ) /
    (1 + gutStress / 100);

  gutFluid -= fluidAbsorb;

  const sodiumAbsorb =
    gutSodium * (1 - Math.exp(-dt / 300));

  gutSodium -= sodiumAbsorb;
  sodiumBalance += sodiumAbsorb;

  updateCramps(dt, effort, active, s);

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

  fluidBalance += fluidAbsorb - sweat;
  sodiumBalance -= sweat * 780;

  const excessCarbs = Math.max(
    0,
    gutCarbs - (40 + 50 * rower.stomach / 99)
  );

  gutStress = clamp(
    gutStress +
      excessCarbs / 70 * 5 * hour -
      Math.min(gutStress, 7 * hour),
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
