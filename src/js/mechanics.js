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
  return Math.pow(strokePower / 70, 2);
}

function overdriveStrain() {
  return Math.max(0, (strokePower - 100) / 10);
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

function updateCramps(dt, effort, active = true) {
  const rpm = currentStrokeRate();
  const cadenceStrain = strokeRateStrain(rpm);
  const powerLoad = active ? powerStrain() : 1;
  const overdrive = active ? overdriveStrain() : 0;

  const imbalance =
    Math.max(0, (80 - hydration) / 80) +
    Math.max(0, (45 - energy) / 90) +
    Math.max(0, -sodiumBalance) / 6000;

  const susceptibility = rower.cramp / 99;

  const growth =
    imbalance *
    susceptibility *
    (.25 + effort) *
    80 *
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

  const effort = clamp((speed - 7.2) / 4.6);
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
    (55 + 35 * rower.stomach / 99) * hour
  );

  gutCarbs -= carbAbsorb;

  carbs = clamp(
    carbs + carbAbsorb - carbBurn,
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

  updateCramps(dt, effort, active);

  /*
   * Ylikova vetotahti kasvattaa hieman myös hikoilua.
   */
  const sweat = active
    ? (
      .48 +
      .34 * effort +
      .10 * Math.min(cadenceStrain, 3) +
      .08 * Math.max(0, powerLoad - 1)
    ) *
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
      Math.max(0, -sodiumBalance) / 3000 -
      Math.max(0, sodiumBalance - 4200) / 5000
  );

  energy = 100 * clamp((carbs - 25) / 395);

  hydration = 100 * clamp(
    fluidScore * saltScore
  );

  /*
   * Normaali fyysinen rasitus +
   * liian suuren vetotahdin rasitus.
   */
  const strain = active
    ? (
      .65 +
      7.2 * Math.pow(effort, 3) +
      12 * cadenceStrain +
      90 * overdrive
    ) *
    powerLoad *
    dayStrain *
    hour
    : 0;

  const damage = active
    ? (
      Math.max(0, 55 - energy) +
      Math.max(0, 60 - hydration)
    ) /
    70 *
    hour *
    5
    : 0;

  stamina = clamp(
    stamina -
      strain * (1.7 - rower.endurance / 99) -
      damage,
    0,
    100
  );

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
