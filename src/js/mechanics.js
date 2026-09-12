const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function isGoldenBoat() {
  return rower.name === 'Heikki Karjaluoto' && selectedBoat.name === 'Lonka' && material === 'mahogany';
}
function maxRowerSpeed() {
  return rower.bestTimeMinutes ? TOTAL / 1000 / (rower.bestTimeMinutes / 60) : MAX_SPEED;
}
function boatWeight() {
  return materials[material].weight;
}
function boatSpeedFactor() {
  return (.90 + .02 * selectedBoat.hull) * (1 + (50 - boatWeight()) * .0015);
}
function windPenalty(head, cross) {
  return (head * (1 + (5 - selectedBoat.headwind) * .18) + cross * (1 + (5 - selectedBoat.stability) * .25)) * materials[material].windMultiplier;
}
function crampFactor() {
  return Math.max(.015, 1 - .985 * Math.pow(cramps / 100, 2.4));
}
function updateCramps(dt, effort) {
  const imbalance = Math.max(0, (80 - hydration) / 80) + Math.max(0, (45 - energy) / 90) + Math.max(0, -sodiumBalance) / 6000;
  const susceptibility = rower.cramp / 99;
  const growth = imbalance * susceptibility * (.25 + effort) * 80;
  const recovery = hydration > 75 && energy > 40 && sodiumBalance > -300 ? effort < .25 ? 32 : 5 : 0;
  cramps = clamp(cramps + (growth - recovery) * dt / 3600, 0, 100);
}
function updateBody(dt, s, raceSec) {
  const hour = dt / 3600,
    effort = clamp((speed - 7.2) / 4.6),
    carbBurn = (48 + 45 * Math.pow(effort, 1.7)) * hour;
  const carbAbsorb = Math.min(gutCarbs, (55 + 35 * rower.stomach / 99) * hour);
  gutCarbs -= carbAbsorb;
  carbs = clamp(carbs + carbAbsorb - carbBurn, 0, 420);
  // Finite absorption: neither water nor sodium is an instant refill.
  const fluidAbsorb = Math.min(gutFluid, (.8 + .3 * rower.stomach / 99) * hour) / (1 + gutStress / 100);
  gutFluid -= fluidAbsorb;
  const sodiumAbsorb = gutSodium * (1 - Math.exp(-dt / 300));
  gutSodium -= sodiumAbsorb;
  sodiumBalance += sodiumAbsorb;
  updateCramps(dt, effort);
  const sweat = (.48 + .34 * effort) * s.sweat * hour;
  fluidBalance += fluidAbsorb - sweat;
  sodiumBalance -= sweat * 780;
  const excessCarbs = Math.max(0, gutCarbs - (40 + 50 * rower.stomach / 99));
  gutStress = clamp(gutStress + excessCarbs / 70 * 5 * hour - Math.min(gutStress, 7 * hour), 0, 100);
  const fluidScore = fluidBalance < 0 ? clamp(1 + fluidBalance / 3.2) : clamp(1 - fluidBalance / 2.0);
  const saltScore = clamp(1 - Math.max(0, -sodiumBalance) / 3000 - Math.max(0, sodiumBalance - 4200) / 5000);
  energy = 100 * clamp((carbs - 25) / 395);
  const lowEnergyPenalty = Math.max(0, (45 - energy) / 90);
  hydration = 100 * clamp(fluidScore * saltScore);
  const strain = (.65 + 7.2 * Math.pow(effort, 3)) * hour,
    damage = (Math.max(0, 55 - energy) + Math.max(0, 60 - hydration)) / 70 * hour * 5;
  stamina = clamp(stamina - strain * (1.7 - rower.endurance / 99) - damage, 0, 100);
  if (rower.blisterImmune) blisters = 0;else if (raceSec >= 1800) {
    const irregularity = clamp(1 - quality);
    blisters = clamp(blisters + 45 * Math.pow(irregularity, 1.35) * hour * (1.4 - rower.hands / 99), 0, 100);
  }
}
