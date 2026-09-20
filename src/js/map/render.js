const canvas = document.getElementById('lake'),
  displayCtx = canvas.getContext('2d');
let canvasCssWidth = 1,
  canvasCssHeight = 1;
const pixelScene = document.createElement('canvas'),
  ctx = pixelScene.getContext('2d');
function resize() {
  const d = devicePixelRatio || 1,
    r = canvas.getBoundingClientRect();
  canvasCssWidth = r.width;
  canvasCssHeight = r.height;
  strokeTrackWidth = ui.strokeTrack.getBoundingClientRect().width || strokeTrackWidth;
  canvas.width = Math.round(r.width * d);
  canvas.height = Math.round(r.height * d);
  displayCtx.setTransform(d, 0, 0, d, 0, 0);
  displayCtx.imageSmoothingEnabled = false;
  pixelScene.width = Math.max(1, Math.ceil(r.width / 2));
  pixelScene.height = Math.max(1, Math.ceil(r.height / 2));
  ctx.setTransform(pixelScene.width / Math.max(1, r.width), 0, 0, pixelScene.height / Math.max(1, r.height), 0, 0);
  ctx.imageSmoothingEnabled = false;
}
const mapImage = new Image(),
  cleanMapImage = new Image();
const retroMap = document.createElement('canvas');
let retroMapReady = false,
  waterPixels,
  waterRoute,
  waterRoutePixels,
  waterBranches = [];
const DISTANCE_MAP_POINTS = {
  5000: [[.1949, .2105], [.1929, .2075]],
  10000: [[.1701, .3886], [.1673, .3862]],
  15000: [[.1907, .6092], [.1876, .6072]],
  55000: [[.5511, .1549], [.5518, .1499]]
};
let distanceMapAnchors = [[0, 0], [TOTAL, 1]];
const STADIUM_RAW = {x: 395, y: 79};
// Water immediately in front of Soutustadion; this is both the visible gate
// and the single official endpoint used by every racer.
const OFFICIAL_FINISH_RAW = {x: 403, y: 73};
function prepareMap() {
  if (!mapImage.complete || !mapImage.naturalWidth || !cleanMapImage.complete || !cleanMapImage.naturalWidth) return;
  retroMap.width = 805;
  retroMap.height = 851;
  const mapCtx = retroMap.getContext('2d', {willReadFrequently: true});
  mapCtx.drawImage(mapImage, 0, 0);
  // Only replace the two edited marker regions; preserve every other source pixel.
  for (const [x, y, w, h] of [[308, 193, 44, 44], [363, 40, 38, 38]]) mapCtx.drawImage(cleanMapImage, x / 805 * cleanMapImage.naturalWidth, y / 851 * cleanMapImage.naturalHeight, w / 805 * cleanMapImage.naturalWidth, h / 851 * cleanMapImage.naturalHeight, x, y, w, h);
  const pixels = mapCtx.getImageData(0, 0, 805, 851),
    data = pixels.data;
  removeVisibleRoute(data, 805, 851);
  waterPixels = new Uint8Array(805 * 851);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    let color;
    if (r < 100 && g < 140 && b < 150) color = [22, 30, 60];else if (r > 160 && g < 110) color = [248, 80, 64];else if (g > 140 && r < 120 && b < 130) color = [184, 248, 24];else if (b - r > 25 && g - r > 15) color = [56, 120, 208];else if (g > r + 10 && g > b - 5) color = [136, 192, 72];else if (r > 225 && g > 225 && b > 225) color = [248, 240, 192];else color = [192, 184, 136];
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    if (color[0] === 56 && color[1] === 120 && color[2] === 208) waterPixels[i / 4] = 1;
  }
  clearFerryGuideMarkers(data);
  buildWaterRoute();
  mapCtx.putImageData(pixels, 0, 0);
  retroMapReady = true;
}
let mapOverview = false;
const mapToggle = document.getElementById('mapToggle');
function setMapOverview(value) {
  mapOverview = value;
  mapToggle.textContent = value ? 'Takaisin soutuun' : 'Kartta';
  mapToggle.setAttribute('aria-pressed', String(value));
}
function mapViewport(w, h) {
  if (typeof routeEditorViewport === 'function') {
    const editorViewport = routeEditorViewport(w, h);
    if (editorViewport) return editorViewport;
  }
  if (running && !mapOverview) {
    const scale = Math.min(w, h) / (1000 * routePixels / TOTAL);
    const p = racerPointOnWater(raceMapProgressForDistance(distance), 805 * scale, 851 * scale, playerRouteChoice);
    return {
      w: 805 * scale,
      h: 851 * scale,
      x: w / 2 - p.x,
      y: h / 2 - p.y
    };
  }
  const scale = Math.max(0, Math.min((w - 24) / 805, (h - 24) / 851));
  return {
    w: 805 * scale,
    h: 851 * scale,
    x: (w - 805 * scale) / 2,
    y: (h - 851 * scale) / 2
  };
}
function drawMapLabels(m, w, h, boatPoint) {
  const c = displayCtx,
    occupied = [{
      x: boatPoint.x - 18,
      y: boatPoint.y - 24,
      w: 36,
      h: 44
    }];
  c.save();
  c.font = '600 12px system-ui';
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  for (const [name, mx, my] of mapLabels) {
    const width = c.measureText(name).width + 8,
      height = 19;
    const rawX = m.x + mx / 805 * m.w,
      y = m.y + my / 851 * m.h;
    if (rawX < 0 || rawX > w) continue;
    const x = clamp(rawX, width / 2 + 3, w - width / 2 - 3);
    const box = {
      x: x - width / 2,
      y: y - height / 2,
      w: width,
      h: height
    };
    if (box.y < 2 || box.y + height > h - 2 || occupied.some(b => box.x < b.x + b.w + 3 && box.x + width + 3 > b.x && box.y < b.y + b.h + 3 && box.y + height + 3 > b.y)) continue;
    occupied.push(box);
    c.fillStyle = 'rgba(16,24,48,.88)';
    c.fillRect(box.x, box.y, width, height);
    c.fillStyle = '#fff8d8';
    c.fillText(name, x, y);
  }
  c.restore();
}
function hasWaterClearance(x, y, clearance) {
  for (let dy = -clearance; dy <= clearance; dy++) for (let dx = -clearance; dx <= clearance; dx++) {
    if (x + dx < 0 || x + dx >= 805 || y + dy < 0 || y + dy >= 851 || !waterPixels[(y + dy) * 805 + x + dx]) return false;
  }
  return true;
}
function clearFerryGuideMarkers(data) {
  for (const [cx, cy] of [[379, 746], [378, 774]]) for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) {
    const index = y * 805 + x, i = index * 4;
    data[i] = 56; data[i + 1] = 120; data[i + 2] = 208;
    waterPixels[index] = 1;
  }
}
function nearestWaterPoint(x, y, clearance = 0, maxRadius = 120) {
  for (let radius = 0; radius <= maxRadius; radius++) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < 805 && ny >= 0 && ny < 851 && hasWaterClearance(nx, ny, clearance)) return [nx, ny];
  }
  let nearest = null,
    nearestDistance = Infinity;
  for (let ny = clearance; ny < 851 - clearance; ny++) for (let nx = clearance; nx < 805 - clearance; nx++) {
    const distance = (nx - x) ** 2 + (ny - y) ** 2;
    if (distance < nearestDistance && hasWaterClearance(nx, ny, clearance)) {
      nearest = [nx, ny];
      nearestDistance = distance;
    }
  }
  return nearest || [x, y];
}
function waterPath(from, to, clearance = 0) {
  const start = from[1] * 805 + from[0], end = to[1] * 805 + to[0], size = 805 * 851;
  if (!hasWaterClearance(from[0], from[1], clearance) || !hasWaterClearance(to[0], to[1], clearance)) return null;
  const queue = new Int32Array(size), previous = new Int32Array(size), seen = new Uint8Array(size);
  let head = 0, tail = 0;
  queue[tail++] = start;
  seen[start] = 1;
  while (head < tail) {
    const current = queue[head++];
    if (current === end) break;
    const x = current % 805, y = Math.floor(current / 805);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const nx = x + dx, ny = y + dy, next = ny * 805 + nx;
      if (nx < 0 || nx >= 805 || ny < 0 || ny >= 851 || seen[next] || !hasWaterClearance(nx, ny, clearance)) continue;
      if (dx && dy && (!hasWaterClearance(x + dx, y, clearance) || !hasWaterClearance(x, y + dy, clearance))) continue;
      seen[next] = 1;
      previous[next] = current;
      queue[tail++] = next;
    }
  }
  if (!seen[end]) return null;
  const path = [];
  for (let current = end;; current = previous[current]) {
    path.push([current % 805, Math.floor(current / 805)]);
    if (current === start) return path.reverse();
  }
}
// Permanent movement invariant: every displayed racer path is built as one
// continuous chain of adjacent water pixels. Never replace this with runtime
// snapping or straight shortcuts between sparse route points: both make boats
// jump, and the latter can carry them across islands.
function continuousWaterRoute(points) {
  const denseRoute = [];
  for (let i = 1; i < points.length; i++) {
    const from = [points[i - 1][0] * 805, points[i - 1][1] * 851],
      to = [points[i][0] * 805, points[i][1] * 851],
      clearance = Math.min(points[i - 1][2] ?? 2, points[i][2] ?? 2),
      steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1])));
    for (let step = i === 1 ? 0 : 1; step <= steps; step++) {
      const t = step / steps,
        waterPoint = nearestWaterPoint(
          Math.round(from[0] + (to[0] - from[0]) * t),
          Math.round(from[1] + (to[1] - from[1]) * t),
          clearance,
          24
        );
      denseRoute.push([...waterPoint, clearance]);
    }
  }
  const result = denseRoute.length ? [denseRoute[0]] : [];
  for (let i = 1; i < denseRoute.length; i++) {
    const previous = result.at(-1), next = denseRoute[i];
    if (previous[0] === next[0] && previous[1] === next[1]) continue;
    const dx = Math.abs(next[0] - previous[0]),
      dy = Math.abs(next[1] - previous[1]),
      clearance = Math.min(previous[2] ?? 2, next[2] ?? 2),
      diagonalIsClear = !dx || !dy || (hasWaterClearance(next[0], previous[1], clearance) && hasWaterClearance(previous[0], next[1], clearance));
    if (dx <= 1 && dy <= 1 && diagonalIsClear) result.push(next);
    else {
      const connectingPath = waterPath(previous, next, clearance) || waterPath(previous, next, 0);
      if (!connectingPath) throw new Error('Soutureitti ei ole yhtenäinen vesireitti.');
      result.push(...connectingPath.slice(1).map(point => [point[0], point[1], clearance]));
    }
  }
  return result;
}
function buildWaterRoute() {
  // Build a continuous water-only line once. Runtime snapping made the boats
  // visibly judder, while snapping only the sparse authored nodes let the
  // straight segments between them cut across land.
  waterRoute = continuousWaterRoute(route);
  let finishIndex = 1, finishDistance = Infinity;
  for (let i = 1; i < waterRoute.length; i++) {
    const candidateDistance = Math.hypot(waterRoute[i][0] - OFFICIAL_FINISH_RAW.x, waterRoute[i][1] - OFFICIAL_FINISH_RAW.y);
    if (candidateDistance < finishDistance) {
      finishIndex = i;
      finishDistance = candidateDistance;
    }
  }
  waterRoute = waterRoute.slice(0, finishIndex + 1);
  waterRoutePixels = waterRoute.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - waterRoute[i][0], point[1] - waterRoute[i][1]), 0);
  buildDistanceMapAnchors();
  buildWaterBranches();
  calibrateKietavalaFerryDistance();
}
function waterRouteProgressAt(rawX, rawY) {
  let travelled = 0, nearestProgress = 0, nearestDistance = Infinity;
  for (let i = 1; i < waterRoute.length; i++) {
    const a = waterRoute[i - 1], b = waterRoute[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    const t = length ? clamp(((rawX - a[0]) * dx + (rawY - a[1]) * dy) / (length * length)) : 0;
    const x = a[0] + dx * t, y = a[1] + dy * t;
    const separation = Math.hypot(rawX - x, rawY - y);
    if (separation < nearestDistance) {
      nearestDistance = separation;
      nearestProgress = (travelled + length * t) / waterRoutePixels;
    }
    travelled += length;
  }
  return nearestProgress;
}
function buildDistanceMapAnchors() {
  distanceMapAnchors = [[0, 0], ...Object.entries(DISTANCE_MAP_POINTS).map(([metres, [a, b]]) => [
    Number(metres),
    waterRouteProgressAt((a[0] + b[0]) / 2 * 805, (a[1] + b[1]) / 2 * 851)
  ]), [TOTAL, 1]].sort((a, b) => a[0] - b[0]);
}
function mapProgressForDistance(metres) {
  const value = clamp(metres / TOTAL) * TOTAL;
  for (let i = 1; i < distanceMapAnchors.length; i++) {
    const from = distanceMapAnchors[i - 1], to = distanceMapAnchors[i];
    if (value <= to[0]) return from[1] + (to[1] - from[1]) * (value - from[0]) / (to[0] - from[0]);
  }
  return 1;
}
function raceMapProgressForDistance(metres) {
  return raceUsesReverseRoute()
    // Stadionilta lähtevä suunta käyttää koko vahvistettua vesireittiä
    // tasaisesti. Vanhan suunnan etäisyysankkurien kääntäminen teki
    // ensimmäisistä kilometreistä kartalla selvästi liian hitaita.
    ? 1 - clamp(metres / TOTAL)
    : mapProgressForDistance(metres);
}
function distanceForMapProgress(progress) {
  const value = clamp(progress);
  for (let i = 1; i < distanceMapAnchors.length; i++) {
    const from = distanceMapAnchors[i - 1], to = distanceMapAnchors[i];
    if (value <= to[1]) return from[0] + (to[0] - from[0]) * (value - from[1]) / (to[1] - from[1]);
  }
  return TOTAL;
}
function nearestWaterRouteIndex(point) {
  let bestIndex = 0, bestDistance = Infinity;
  for (let i = 0; i < waterRoute.length; i++) {
    const candidate = waterRoute[i], distance = Math.hypot(candidate[0] - point[0] * 805, candidate[1] - point[1] * 851);
    if (distance < bestDistance) { bestIndex = i; bestDistance = distance; }
  }
  return bestIndex;
}
function buildWaterBranches() {
  waterBranches = routeBranches.map(branch => {
    const startIndex = nearestWaterRouteIndex(branch.start), endIndex = nearestWaterRouteIndex(branch.end);
    let before = 0, through = 0;
    for (let i = 1; i <= endIndex; i++) {
      const length = Math.hypot(waterRoute[i][0] - waterRoute[i - 1][0], waterRoute[i][1] - waterRoute[i - 1][1]);
      if (i <= startIndex) before += length; else through += length;
    }
    return {
      ...branch,
      from: before / waterRoutePixels,
      to: (before + through) / waterRoutePixels,
      path: continuousWaterRoute([
        [waterRoute[startIndex][0] / 805, waterRoute[startIndex][1] / 851, waterRoute[startIndex][2]],
        ...branch.alternative.slice(1, -1),
        [waterRoute[endIndex][0] / 805, waterRoute[endIndex][1] / 851, waterRoute[endIndex][2]]
      ]).map(point => point.slice(0, 2))
    };
  });
}
function pointOnRawPath(path, progress, w, h) {
  const lengths = path.slice(1).map((point, i) => Math.hypot(point[0] - path[i][0], point[1] - path[i][1])),
    total = lengths.reduce((sum, length) => sum + length, 0);
  let target = clamp(progress) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i]) {
      const a = path[i], b = path[i + 1], t = target / lengths[i],
        tangentFrom = path[Math.max(0, i - 6)],
        tangentTo = path[Math.min(path.length - 1, i + 7)];
      return {x: (a[0] + (b[0] - a[0]) * t) / 805 * w, y: (a[1] + (b[1] - a[1]) * t) / 851 * h,
        angle: Math.atan2((tangentTo[1] - tangentFrom[1]) / 851 * h, (tangentTo[0] - tangentFrom[0]) / 805 * w)};
    }
    target -= lengths[i];
  }
  const end = path.at(-1), before = path.at(-2) || end;
  return {x: end[0] / 805 * w, y: end[1] / 851 * h,
    angle: Math.atan2((end[1] - before[1]) / 851 * h, (end[0] - before[0]) / 805 * w)};
}
function racerPointOnWater(progress, w, h, choice = 'primary') {
  // The map and boats are not drawn before this fallback is replaced by the
  // validated water route, so no unvalidated position is ever shown.
  if (!waterRoutePixels) return pointOnRoute(clamp(progress), w, h);
  const branch = choice === 'alternative' && waterBranches.find(candidate => progress >= candidate.from && progress <= candidate.to);
  const point = branch ? pointOnRawPath(branch.path, (progress - branch.from) / (branch.to - branch.from), w, h) : botPointOnWater(progress, w, h);
  if (raceUsesReverseRoute()) point.angle += Math.PI;
  return point;
}
function botPointOnWater(progress, w, h) {
  if (!waterRoutePixels) return pointOnRoute(clamp(progress), w, h);
  let target = clamp(progress) * waterRoutePixels;
  for (let i = 1; i < waterRoute.length; i++) {
    const a = waterRoute[i - 1], b = waterRoute[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (target <= length) {
      const t = target / length,
        tangentFrom = waterRoute[Math.max(0, i - 6)],
        tangentTo = waterRoute[Math.min(waterRoute.length - 1, i + 5)];
      return {
        x: (a[0] + (b[0] - a[0]) * t) / 805 * w,
        y: (a[1] + (b[1] - a[1]) * t) / 851 * h,
        angle: Math.atan2((tangentTo[1] - tangentFrom[1]) * h, (tangentTo[0] - tangentFrom[0]) * w)
      };
    }
    target -= length;
  }
  const p = waterRoute.at(-1);
  const before = waterRoute.at(-2) || p;
  return {
    x: p[0] / 805 * w,
    y: p[1] / 851 * h,
    angle: Math.atan2((p[1] - before[1]) / 851 * h, (p[0] - before[0]) / 805 * w)
  };
}
/*
 * Lähtöruudukko on vain kartan esitystapa: kaikki kilpailijat ovat heti
 * nähtävissä sillan jälkeen viidessä rinnakkaisessa lähtökaistassa.
 * Muodostelma sulautuu varsinaiseen reittisijaintiin ensimmäisten metrien
 * aikana, joten kilpailun mittaus ja sijoitukset eivät muutu.
 */
function availableLaneFraction(point, sideways) {
  const offsetX = -Math.sin(point.angle) * sideways, offsetY = Math.cos(point.angle) * sideways;
  const steps = Math.max(1, Math.ceil(Math.abs(sideways) * 2));
  let safeFraction = 0;
  // Check the whole corridor from the route to the requested lane. Checking
  // only the end point allowed a racer to jump over a strip of land to water
  // on the other side of an island.
  for (let step = 1; step <= steps; step++) {
    const fraction = step / steps;
    if (!hasWaterClearance(
      Math.round(point.x + offsetX * fraction),
      Math.round(point.y + offsetY * fraction),
      3
    )) break;
    safeFraction = fraction;
  }
  return Math.min(safeFraction, availablePierFormationFraction(point, sideways));
}
function availablePierFormationFraction(point, sideways) {
  if (!sideways) return 1;
  // Compress every lane on the obstructed side by the same ratio. Capping each
  // lane at the pier edge separately would stack several racers on one point.
  const formationSideways = Math.sign(sideways) * Math.max(Math.abs(sideways), 13.5),
    offsetX = -Math.sin(point.angle) * formationSideways,
    offsetY = Math.cos(point.angle) * formationSideways,
    steps = Math.max(1, Math.ceil(Math.abs(formationSideways) * 2));
  let safeFraction = 0;
  for (let step = 1; step <= steps; step++) {
    const fraction = step / steps;
    if (!hasPierClearance(point.x + offsetX * fraction, point.y + offsetY * fraction)) break;
    safeFraction = fraction;
  }
  return safeFraction;
}
function hasPierClearance(x, y) {
  const clearance = 7;
  for (const [[startX, startY], [endX, endY]] of SHORE_PIERS) {
    const ax = startX * 805, ay = startY * 851,
      bx = endX * 805, by = endY * 851,
      dx = bx - ax, dy = by - ay,
      lengthSquared = dx * dx + dy * dy,
      t = lengthSquared ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared) : 0,
      nearestX = ax + dx * t, nearestY = ay + dy * t;
    if ((x - nearestX) ** 2 + (y - nearestY) ** 2 < clearance ** 2) return false;
  }
  return true;
}
function anticipatedLaneFraction(racerDistance, sideways, routeChoice) {
  const lookAhead = 700, step = 100;
  let fraction = 1;
  for (let ahead = 0; ahead <= lookAhead; ahead += step) {
    const futureDistance = Math.min(TOTAL, racerDistance + ahead),
      point = racerPointOnWater(raceMapProgressForDistance(futureDistance), 805, 851, routeChoice),
      available = availableLaneFraction(point, sideways),
      urgency = 1 - ahead / (lookAhead + step);
    fraction = Math.min(fraction, 1 - (1 - available) * urgency);
  }
  return fraction;
}
function formationPoint(racerDistance, racerIndex, racerCount, racerLane, m, routeChoice = 'primary') {
  const release = clamp(racerDistance / 140), p = racerPointOnWater(raceMapProgressForDistance(racerDistance), 805, 851, routeChoice);
  const columns = 5;
  const column = racerIndex % columns - (columns - 1) / 2;
  const finishMerge = clamp((TOTAL - racerDistance) / 300);
  const sideways = (column * (1 - release) + racerLane * release) * 4.5 * finishMerge;
  const laneFraction = anticipatedLaneFraction(racerDistance, sideways, routeChoice),
    offsetX = -Math.sin(p.angle) * sideways * laneFraction,
    offsetY = Math.cos(p.angle) * sideways * laneFraction,
    tangentDistance = Math.min(TOTAL, racerDistance + 35),
    tangent = racerPointOnWater(raceMapProgressForDistance(tangentDistance), 805, 851, routeChoice),
    tangentSideways = (column * (1 - clamp(tangentDistance / 140)) + racerLane * clamp(tangentDistance / 140)) * 4.5 * clamp((TOTAL - tangentDistance) / 300),
    tangentFraction = anticipatedLaneFraction(tangentDistance, tangentSideways, routeChoice),
    tangentX = tangent.x - Math.sin(tangent.angle) * tangentSideways * tangentFraction,
    tangentY = tangent.y + Math.cos(tangent.angle) * tangentSideways * tangentFraction,
    angle = Math.hypot(tangentX - p.x - offsetX, tangentY - p.y - offsetY) > .01
      ? Math.atan2(tangentY - p.y - offsetY, tangentX - p.x - offsetX)
      : p.angle;
  return {
    x: (p.x + offsetX * laneFraction) / 805 * m.w,
    y: (p.y + offsetY * laneFraction) / 851 * m.h,
    angle
  };
}
function raceStartGridPositions() {
  const points = START_GRID_POINTS.length ? START_GRID_POINTS : START_GRID_POSITIONS;
  const reverse = raceUsesReverseRoute(), matching = points.filter(point => {
    const hakovirtaDistance = Math.hypot(point[0] - route[0][0], point[1] - route[0][1]),
      stadiumDistance = Math.hypot(point[0] - route.at(-1)[0], point[1] - route.at(-1)[1]);
    return reverse ? stadiumDistance < hakovirtaDistance : hakovirtaDistance <= stadiumDistance;
  });
  return matching.length || reverse ? matching : START_GRID_POSITIONS;
}
function startGridFormationPoint(racerDistance, racerIndex, racerCount, racerLane, m, routeChoice = 'primary', launchBaseDistance = racerDistance) {
  const initialDistance = racerIndex
      ? START_GRID_DISTANCE + (Math.floor((racerIndex - 1) / RACE_LANES.length) - 2) * START_GRID_ROW_GAP
      : START_GRID_DISTANCE,
    travelled = Math.max(0, launchBaseDistance - initialDistance),
    // Boat sprites are deliberately much larger than the geographic map
    // scale. Give the start a short visual surge so a moving church boat does
    // not appear stuck on its authored grid point for half a minute. The lead
    // is blended away while the grid merges into the normal race formation.
    launchLead = 160 * (1 - Math.exp(-travelled / 12)),
    launchDistance = racerDistance + launchLead,
    formed = formationPoint(racerDistance, racerIndex, racerCount, racerLane, m, routeChoice),
    launched = formationPoint(launchDistance, racerIndex, racerCount, racerLane, m, routeChoice),
    authored = raceStartGridPositions()[racerIndex],
    linearMerge = clamp((travelled - 500) / 700),
    merge = linearMerge * linearMerge * (3 - 2 * linearMerge);
  if (!authored) {
    const angleDelta = Math.atan2(Math.sin(formed.angle - launched.angle), Math.cos(formed.angle - launched.angle));
    return {
      x: launched.x + (formed.x - launched.x) * merge,
      y: launched.y + (formed.y - launched.y) * merge,
      angle: launched.angle + angleDelta * merge
    };
  }
  const
    initialRoutePoint = racerPointOnWater(raceMapProgressForDistance(initialDistance), 805, 851, routeChoice),
    currentRoutePoint = racerPointOnWater(raceMapProgressForDistance(launchDistance), 805, 851, routeChoice),
    angleChange = currentRoutePoint.angle - initialRoutePoint.angle,
    authoredOffsetX = authored[0] * 805 - initialRoutePoint.x,
    authoredOffsetY = authored[1] * 851 - initialRoutePoint.y,
    rotatedOffsetX = authoredOffsetX * Math.cos(angleChange) - authoredOffsetY * Math.sin(angleChange),
    rotatedOffsetY = authoredOffsetX * Math.sin(angleChange) + authoredOffsetY * Math.cos(angleChange),
    movingGridX = (currentRoutePoint.x + rotatedOffsetX) / 805 * m.w,
    movingGridY = (currentRoutePoint.y + rotatedOffsetY) / 851 * m.h,
    startAngle = currentRoutePoint.angle,
    angleDelta = Math.atan2(Math.sin(formed.angle - startAngle), Math.cos(formed.angle - startAngle));
  return {
    x: movingGridX + (formed.x - movingGridX) * merge,
    y: movingGridY + (formed.y - movingGridY) * merge,
    angle: startAngle + angleDelta * merge
  };
}
function strokeMotionOffset(phase) {
  const driveFraction = TARGET_DRIVE / targetStrokeCycle();
  if (phase < driveFraction) {
    const t = clamp(phase / driveFraction);
    return 1.15 * (.5 - .5 * Math.cos(Math.PI * t));
  }
  const t = clamp((phase - driveFraction) / (1 - driveFraction));
  return 1.15 * (.5 + .5 * Math.cos(Math.PI * t));
}
function playerMotionDistance(now) {
  // The hull follows the continuous physics distance. Stroke phase is already
  // visible in the rower and oars; adding it to map position made the whole
  // boat surge and recoil once per stroke.
  return distance;
}
function botMotionDistance(bot, index, now) {
  return bot.distance;
}
const DISTANCE_BUOYS = [5000, 10000, 15000, 20000, 25000, 29000, 30000, 35000, 40000, 45000, 50000, 55000];
function distanceBuoyPoints(buoyDistance) {
  if (!raceUsesReverseRoute() && DISTANCE_MAP_POINTS[buoyDistance]) {
    const [a, b] = DISTANCE_MAP_POINTS[buoyDistance];
    return [{x: (a[0] + b[0]) / 2 * 805, y: (a[1] + b[1]) / 2 * 851}];
  }
  const progress = raceUsesReverseRoute() ? buoyDistance / TOTAL : mapProgressForDistance(buoyDistance);
  const p = botPointOnWater(progress, 805, 851);
  const [x, y] = nearestWaterPoint(Math.round(p.x), Math.round(p.y), 0, 4);
  return [{x, y}];
}
function drawDistanceBuoys(m) {
  const c = displayCtx;
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const buoyDistance of DISTANCE_BUOYS) {
    const halfway = buoyDistance === 29000;
    const displayDistance = raceUsesReverseRoute() ? TOTAL - buoyDistance : buoyDistance;
    const label = halfway ? 'PUOLIVÄLI' : `${Math.round(displayDistance / 1000)}km`;
    const height = halfway ? 16 : 12;
    const halfWidth = halfway ? 20 : 10;
    for (const point of distanceBuoyPoints(buoyDistance)) {
      const x = m.x + point.x / 805 * m.w;
      const y = m.y + point.y / 851 * m.h - (buoyDistance === 25000 ? height : 0);
      c.fillStyle = halfway ? '#f8d848' : '#fff';
      c.strokeStyle = '#17213c';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y - height / 2);
      c.lineTo(x - halfWidth, y + height / 2);
      c.lineTo(x + halfWidth, y + height / 2);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#17213c';
      c.font = '700 7px monospace';
      c.fillText(label, x, y + height * .2);
    }
  }
  c.restore();
}
function drawFinishMarker(m) {
  const reverse = raceUsesReverseRoute(), p = botPointOnWater(raceMapProgressForDistance(TOTAL), m.w, m.h);
  if (reverse) p.angle += Math.PI;
  const c = displayCtx;
  // Landmark dimensions are screen-sized: the close-up camera must not turn
  // a buoy or the stadium into a building-sized obstruction on the lake.
  const scale = clamp(m.w / 805, .5, 1.15);
  // Shoreline directly below the map's built-in Soutustadion label.
  const stadium = {
    x: m.x + STADIUM_RAW.x / 805 * m.w,
    y: m.y + STADIUM_RAW.y / 851 * m.h
  };
  const halfWidth = 24 * scale;
  const normal = {x: -Math.sin(p.angle), y: Math.cos(p.angle)};
  const finish = {x: m.x + p.x, y: m.y + p.y};
  const nearA = {x: finish.x + normal.x * halfWidth, y: finish.y + normal.y * halfWidth};
  const nearB = {x: finish.x - normal.x * halfWidth, y: finish.y - normal.y * halfWidth};
  const aIsShoreSide = Math.hypot(nearA.x - stadium.x, nearA.y - stadium.y) < Math.hypot(nearB.x - stadium.x, nearB.y - stadium.y);
  const shoreBuoy = reverse ? nearA : aIsShoreSide ? nearA : nearB;
  const oldLakeBuoy = reverse ? nearB : aIsShoreSide ? nearB : nearA;
  // Keep the stadium-side post fixed and double the gate only lakewards.
  const lakeBuoy = {
    x: shoreBuoy.x + (reverse ? 1 : 2) * (oldLakeBuoy.x - shoreBuoy.x),
    y: shoreBuoy.y + (reverse ? 1 : 2) * (oldLakeBuoy.y - shoreBuoy.y)
  };
  const buoyA = shoreBuoy, buoyB = lakeBuoy;
  c.save();
  c.translate(stadium.x, stadium.y);
  c.rotate(p.angle);
  // Retro version of the red, veranda-fronted Soutustadion building.
  c.fillStyle = '#f8f0c0'; c.fillRect(-32 * scale, -6 * scale, 64 * scale, 12 * scale);
  c.fillStyle = '#a93632'; c.fillRect(-26 * scale, -13 * scale, 52 * scale, 13 * scale);
  c.fillStyle = '#f8f0c0'; c.fillRect(-32 * scale, -15 * scale, 64 * scale, 4 * scale);
  c.fillStyle = '#802a2d';
  c.beginPath(); c.moveTo(-34 * scale, -15 * scale); c.lineTo(0, -23 * scale); c.lineTo(34 * scale, -15 * scale); c.closePath(); c.fill();
  c.fillStyle = '#b8dcf0'; c.fillRect(-12 * scale, -22 * scale, 24 * scale, 7 * scale);
  c.fillStyle = '#802a2d'; c.fillRect(-16 * scale, -24 * scale, 32 * scale, 3 * scale);
  c.fillStyle = '#182848';
  for (let x = -22; x <= 22; x += 8.8) c.fillRect(x * scale, -10 * scale, 2 * scale, 10 * scale);
  c.restore();
  c.save();
  c.strokeStyle = '#fff8d8'; c.lineWidth = Math.max(1, 1.5 * scale); c.setLineDash([3 * scale, 3 * scale]);
  c.beginPath(); c.moveTo(buoyA.x, buoyA.y); c.lineTo(buoyB.x, buoyB.y); c.stroke(); c.setLineDash([]);
  for (const buoy of [buoyA, buoyB]) {
    const size = 11 * scale;
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(buoy.x, buoy.y - size); c.lineTo(buoy.x - size, buoy.y + size); c.lineTo(buoy.x + size, buoy.y + size); c.closePath(); c.fill();
    c.strokeStyle = '#17213c'; c.lineWidth = Math.max(1, scale); c.stroke();
    const labelSize = Math.max(8, 8 * scale), labelWidth = labelSize * 3.4;
    c.fillStyle = '#17213c'; c.fillRect(buoy.x - labelWidth / 2, buoy.y - labelSize / 2 - 1, labelWidth, labelSize + 2);
    c.fillStyle = '#fff8d8'; c.font = `700 ${labelSize}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MAALI', buoy.x, buoy.y + .25 * scale);
  }
  c.restore();
}
function patrolProgress(base, phase, now) {
  return clamp(base + Math.sin(now / 28000 + phase) * .075, .04, .96);
}
function drawSafetyBoat(m, progress, now) {
  const p = botPointOnWater(progress, m.w, m.h), c = ctx;
  c.save();
  c.translate(m.x + p.x, m.y + p.y);
  c.rotate(p.angle + Math.PI / 2);
  // A compact motorboat: yellow rescue hull, cabin and outboard.
  c.fillStyle = '#f3d36b';
  c.strokeStyle = '#17213c';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -12); c.lineTo(7, 7); c.lineTo(4, 12); c.lineTo(-4, 12); c.lineTo(-7, 7); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#e9f6f2'; c.fillRect(-3, -5, 6, 7);
  c.fillStyle = '#38465e'; c.fillRect(-3, 11, 6, 3);
  c.strokeStyle = '#17213c'; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -25); c.stroke();
  c.restore();
}
function drawSafetyFlag(m, progress) {
  const p = botPointOnWater(progress, m.w, m.h), c = displayCtx;
  c.save();
  c.translate(m.x + p.x, m.y + p.y);
  c.rotate(p.angle + Math.PI / 2);
  // Draw the small pennant at display resolution so its OP mark stays crisp.
  c.fillStyle = '#ff6200';
  c.strokeStyle = '#17213c';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -25); c.lineTo(14, -24); c.lineTo(12, -16); c.lineTo(0, -17); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#fff';
  c.font = '700 7px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('OP', 6.5, -20.25);
  c.restore();
}
const KIETAVALA_FERRY_DOCKS = [{x: 379, y: 746}, {x: 378, y: 774}];
const KIETAVALA_FERRY_CLEARANCE = 90;
let KIETAVALA_FERRY_DISTANCE = 27350;
let KIETAVALA_FERRY_STOP_DISTANCE = KIETAVALA_FERRY_DISTANCE - KIETAVALA_FERRY_CLEARANCE;
function calibrateKietavalaFerryDistance() {
  if (!waterRoute?.length || !waterRoutePixels) return;
  const midpoint = {
    x: (KIETAVALA_FERRY_DOCKS[0].x + KIETAVALA_FERRY_DOCKS[1].x) / 2,
    y: (KIETAVALA_FERRY_DOCKS[0].y + KIETAVALA_FERRY_DOCKS[1].y) / 2
  };
  let travelled = 0, crossingTravel = 0, nearest = Infinity;
  for (let i = 1; i < waterRoute.length; i++) {
    travelled += Math.hypot(
      waterRoute[i][0] - waterRoute[i - 1][0],
      waterRoute[i][1] - waterRoute[i - 1][1]
    );
    const separation = Math.hypot(waterRoute[i][0] - midpoint.x, waterRoute[i][1] - midpoint.y);
    if (separation < nearest) {
      nearest = separation;
      crossingTravel = travelled;
    }
  }
  KIETAVALA_FERRY_DISTANCE = distanceForMapProgress(crossingTravel / waterRoutePixels);
  KIETAVALA_FERRY_STOP_DISTANCE = KIETAVALA_FERRY_DISTANCE - KIETAVALA_FERRY_CLEARANCE;
}
function kietavalaFerryState(w, h) {
  return {crossing: ferryProgress * 2 - 1};
}
function updateKietavalaFerry(dt) {
  const [from, to] = KIETAVALA_FERRY_DOCKS;
  const crossingPixels = Math.hypot(to.x - from.x, to.y - from.y);
  const metresPerMapPixel = TOTAL / Math.max(1, waterRoutePixels || 2100);
  const maxPixelsPerSecond = 10 / 3.6 / metresPerMapPixel;
  const nearby = [distance, ...(botRacers || []).map(bot => bot.distance)]
    .some(racerDistance => Math.abs(racerDistance - KIETAVALA_FERRY_DISTANCE) < KIETAVALA_FERRY_CLEARANCE);
  if (ferryDockWait > 0) {
    ferryDockWait = Math.max(0, ferryDockWait - dt);
    return;
  }
  // A ferry already in a berth waits for the approaching field; a ferry that
  // is under way completes its slow crossing instead of teleporting aside.
  if (nearby && (ferryProgress <= 0 || ferryProgress >= 1)) return;
  ferryProgress += ferryDirection * maxPixelsPerSecond / crossingPixels * dt;
  if (ferryProgress <= 0 || ferryProgress >= 1) {
    ferryProgress = clamp(ferryProgress, 0, 1);
    ferryDirection *= -1;
    ferryDockWait = 12;
  }
}
function ferryBlocksRacer(racerDistance) {
  const ferry = kietavalaFerryState(805, 851);
  return racerDistance >= KIETAVALA_FERRY_STOP_DISTANCE - 120 &&
    racerDistance <= KIETAVALA_FERRY_DISTANCE &&
    Math.abs(ferry.crossing) < .7;
}
function ferryAvoidanceLane() {
  // Pass on the side the ferry is moving away from instead of waiting for it.
  return kietavalaFerryState().crossing < 0 ? 2 : -2;
}
function ferrySpeedFactor(racerDistance) {
  return ferryBlocksRacer(racerDistance) ? .72 : 1;
}
function ferryLimitedDistance(previousDistance, nextDistance) {
  return nextDistance;
}
function drawKietavalaFerry(m) {
  const ferry = kietavalaFerryState(), c = ctx;
  const [dockA, dockB] = KIETAVALA_FERRY_DOCKS;
  const t = (ferry.crossing + 1) / 2;
  const rawX = dockA.x + (dockB.x - dockA.x) * t;
  const rawY = dockA.y + (dockB.y - dockA.y) * t;
  const x = m.x + rawX / 805 * m.w;
  const y = m.y + rawY / 851 * m.h;
  const angle = Math.atan2((dockB.y - dockA.y) * m.h / 851, (dockB.x - dockA.x) * m.w / 805);
  const scale = clamp(m.w / 805, .45, 1.05);
  const ferryScale = scale * 2;
  c.save(); c.translate(x, y); c.rotate(angle);
  c.fillStyle = '#17213c'; c.fillRect(-9 * ferryScale, -5 * ferryScale, 18 * ferryScale, 10 * ferryScale);
  c.fillStyle = '#f3d36b'; c.fillRect(-8 * ferryScale, -4 * ferryScale, 16 * ferryScale, 8 * ferryScale);
  c.fillStyle = '#d9473f'; c.fillRect(-10 * ferryScale, -3 * ferryScale, 3 * ferryScale, 6 * ferryScale); c.fillRect(7 * ferryScale, -3 * ferryScale, 3 * ferryScale, 6 * ferryScale);
  c.fillStyle = '#f4f0df'; c.fillRect(-3 * ferryScale, -7 * ferryScale, 6 * ferryScale, 5 * ferryScale);
  c.fillStyle = '#68c8ff'; c.fillRect(-2 * ferryScale, -6 * ferryScale, 4 * ferryScale, 2 * ferryScale);
  c.restore();
}
function ambulanceProgress() {
  const racers = [
    {distance, hydration, cramps},
    ...botRacers.filter(bot => bot.finishedAt === null)
  ];
  const lastRacer = Math.min(...racers.map(racer => racer.distance));
  const mostAtRisk = racers.reduce((worst, racer) => {
    const risk = Math.max(0, 100 - racer.hydration) + 1.5 * racer.cramps;
    return risk > worst.risk ? {racer, risk} : worst;
  }, {racer: null, risk: 0});
  // With no notable medical strain it patrols the tail. Once dehydration or
  // cramping becomes meaningful, it stays close to that particular rower.
  const target = mostAtRisk.risk >= 35 ? mostAtRisk.racer.distance : lastRacer;
  return clamp((target - 140) / TOTAL, 0, 1);
}
const AMBULANCE_START_RAW = {x: 318, y: 204};
function ambulancePoint(m) {
  const patrolDistance = ambulanceProgress() * TOTAL;
  const routePoint = botPointOnWater(raceMapProgressForDistance(patrolDistance), m.w, m.h);
  if (raceUsesReverseRoute()) routePoint.angle += Math.PI;
  const start = raceUsesReverseRoute() ? OFFICIAL_FINISH_RAW : AMBULANCE_START_RAW;
  const merge = clamp(patrolDistance / 600);
  return {
    x: start.x / 805 * m.w + (routePoint.x - start.x / 805 * m.w) * merge,
    y: start.y / 851 * m.h + (routePoint.y - start.y / 851 * m.h) * merge,
    angle: routePoint.angle
  };
}
function drawAmbulanceBoat(m, now) {
  const p = ambulancePoint(m), c = ctx;
  c.save();
  c.translate(m.x + p.x, m.y + p.y);
  c.rotate(p.angle + Math.PI / 2);
  c.fillStyle = '#f4f0df';
  c.strokeStyle = '#17213c';
  c.lineWidth = 1.5;
  c.fillRect(-7, -12, 14, 24);
  c.strokeRect(-7, -12, 14, 24);
  c.fillStyle = '#d9473f';
  c.fillRect(-2, -9, 4, 13);
  c.fillRect(-5, -5, 10, 4);
  c.fillStyle = Math.sin(now / 120) > 0 ? '#68c8ff' : '#d8f0ff';
  c.fillRect(-3, -15, 6, 3);
  c.restore();
}
function drawSafetyLabels(m) {
  if (!mapOverview) return;
  const c = displayCtx;
  c.save();
  c.font = '700 9px monospace';
  c.textAlign = 'center';
  const patrols = [[.16, 0], [.48, 2.1], [.78, 4.2]];
  for (const [progress, label] of [
    ...patrols.map(([base, phase]) => [patrolProgress(base, phase, performance.now()), 'VALVONTA']),
    [ambulanceProgress(), 'AMBULANSSI']
  ]) {
    const p = label === 'AMBULANSSI' ? ambulancePoint(m) : botPointOnWater(progress, m.w, m.h);
    c.fillStyle = '#17213c';
    c.fillRect(m.x + p.x - 25, m.y + p.y - 25, 50, 11);
    c.fillStyle = '#fff8d8';
    c.fillText(label, m.x + p.x, m.y + p.y - 17);
  }
  c.restore();
}
const MAP_DECORATIONS_KEY = 'suursoutu-map-decorations-v1';
const LINNAVUORI = [.3283, .2181];
let LINNAVUORI_SHAPE = [
  [-16, 5], [-12, -5], [-6, -11], [-1, -18], [5, -13], [10, -8], [16, 5],
  [13, 4], [10, 6], [6, 4], [2, 6], [-2, 4], [-6, 6], [-10, 4], [-13, 6]
];
let SHORE_CABINS = [
  [.3089, .2304], [.1948, .2145], [.1363, .2611], [.1397, .3159],
  [.1720, .3563], [.1631, .2918], [.1713, .4414], [.1890, .4814],
  [.1941, .5274], [.1964, .5881], [.1744, .7445], [.1669, .7780],
  [.2049, .7912], [.2590, .8743], [.2134, .8362], [.3285, .9023],
  [.3529, .9341], [.4013, .8954], [.4557, .9165], [.4813, .9071],
  [.6982, .8614], [.6686, .8640], [.6212, .8643], [.7554, .8513],
  [.7590, .8773], [.8210, .8254], [.7817, .7507], [.7877, .7288],
  [.7890, .7163], [.8077, .6769], [.7965, .6373], [.7850, .6159],
  [.7397, .5111], [.7400, .4327], [.7236, .4086], [.7435, .4205],
  [.7074, .3543], [.7007, .3339], [.6930, .3203], [.6876, .2850],
  [.6828, .2799], [.6661, .2772], [.6479, .2807], [.6295, .2759],
  [.6157, .2847], [.5981, .2656], [.6253, .2633], [.6442, .2643],
  [.5549, .2588], [.5549, .2479], [.5562, .2371], [.5600, .2199],
  [.5371, .2175], [.5247, .2078], [.5238, .1932], [.5281, .1747],
  [.5387, .1615], [.5366, .1362], [.5283, .1276], [.5203, .1190],
  [.5126, .1122], [.5060, .1047], [.5001, .0994], [.5710, .1626],
  [.5768, .1563], [.5585, .1884], [.5611, .1995], [.5582, .1725],
  [.1706, .3218], [.2551, .2304], [.3437, .2163], [.3829, .2296],
  [.3834, .2465]
];
function shoreCabinRandom(index, salt = 0) {
  let value = Math.imul(index + 1, 1103515245) + Math.imul(salt + 17, 12345);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}
function shoreCabinSpectatorCount(index) {
  const value = shoreCabinRandom(index);
  if (value < .18) return 0;
  if (value < .53) return 1;
  if (value < .83) return 2;
  if (value < .96) return 3;
  return 5;
}
let SHORE_PEOPLE = [];
for (let cabinIndex = 0; cabinIndex < SHORE_CABINS.length; cabinIndex++) {
  const [mapX, mapY] = SHORE_CABINS[cabinIndex],
    count = shoreCabinSpectatorCount(cabinIndex),
    side = shoreCabinRandom(cabinIndex, 1) < .5 ? -1 : 1,
    cabinSize = 9,
    spectatorSize = .38,
    spectatorWidth = spectatorSize * 3.1;
  for (let person = 0; person < count; person++) SHORE_PEOPLE.push([
    mapX + side * (cabinSize * 1.3 + spectatorWidth * (1 + person * 1.15)) / 805,
    mapY + cabinSize * (1.05 + (person % 2) * .16) / 851
  ]);
}
// Authored in the map editor. Keep the Hakovirta start crowd in source data so
// it is present in the actual game even when editor and game use different
// browser origins (localStorage is origin-specific).
const HAKOVIRTA_SPECTATORS = [
  [.4210, .2448], [.4218, .2471], [.4222, .2498], [.4191, .2431],
  [.4246, .2508], [.4280, .2530], [.4118, .2592], [.4135, .2619],
  [.4061, .2557], [.4060, .2426], [.4100, .2389], [.3995, .2541],
  [.4090, .2542], [.4113, .2512], [.4132, .2497], [.4126, .2472],
  [.4137, .2465], [.4145, .2443], [.4159, .2450], [.4162, .2432],
  [.4141, .2481], [.4115, .2529], [.4100, .2553], [.4077, .2564],
  [.4118, .2489], [.4124, .2518], [.4136, .2451], [.4149, .2426],
  [.4149, .2461], [.4092, .2566], [.4121, .2504], [.4104, .2520],
  [.4103, .2537], [.4027, .2556], [.4075, .2413], [.4256, .2521],
  [.4262, .2502], [.4243, .2486]
];
function addMissingHakovirtaSpectators() {
  for (const point of HAKOVIRTA_SPECTATORS) {
    if (!SHORE_PEOPLE.some(existing => Math.hypot(existing[0] - point[0], existing[1] - point[1]) < .0005)) {
      SHORE_PEOPLE.push(point);
    }
  }
}
let SHORE_PIERS = [], SHORE_EXTRAS = [], SHORE_TREES = [], SHORE_TREES_SAVED = false, MAP_DECORATIONS_SAVED = false,
  START_GRID_POINTS = [];
function applyMapDecorations(decorations) {
  if (!decorations || typeof decorations !== 'object') return false;
  MAP_DECORATIONS_SAVED = true;
  if (Array.isArray(decorations.cabins)) SHORE_CABINS = decorations.cabins;
  if (Array.isArray(decorations.people)) SHORE_PEOPLE = decorations.people;
  if (Array.isArray(decorations.piers)) SHORE_PIERS = decorations.piers;
  if (Array.isArray(decorations.extras)) SHORE_EXTRAS = decorations.extras;
  if (Array.isArray(decorations.trees)) {
    SHORE_TREES = decorations.trees;
    SHORE_TREES_SAVED = true;
  }
  if (Array.isArray(decorations.linnavuoriShape) && decorations.linnavuoriShape.length >= 3) LINNAVUORI_SHAPE = decorations.linnavuoriShape;
  if (Array.isArray(decorations.startGrid)) START_GRID_POINTS = decorations.startGrid;
  return true;
}
try {
  const savedDecorations = JSON.parse(localStorage.getItem(MAP_DECORATIONS_KEY));
  applyMapDecorations(savedDecorations);
} catch {}
addMissingHakovirtaSpectators();
SHORE_CABINS = SHORE_CABINS.map((cabin, index) => [
  cabin[0], cabin[1], cabin[2] ?? index % 4, cabin[3] ?? [.78, .9, 1, 1.15, 1.28][(index * 3) % 5]
]);
const SHORE_CABIN_COLORS = ['#b94738', '#d47438', '#8f3f32', '#c45b34', '#a85a42'];
function drawShoreCabin(c, x, y, size, wallColor, variant = 0) {
  const halfWidth = size * (variant === 1 ? 1.28 : variant === 2 ? .86 : 1),
    wallHeight = size * (variant === 3 ? 1.8 : 1.45),
    roofHeight = size * (variant === 2 ? .72 : 1);
  c.fillStyle = 'rgba(9,18,35,.25)';
  c.fillRect(x - halfWidth * .9, y + wallHeight * .86, halfWidth * 2.2, size * .45);
  c.fillStyle = wallColor;
  c.fillRect(x - halfWidth, y, halfWidth * 2, wallHeight);
  c.fillStyle = '#f8d848';
  c.fillRect(x - halfWidth * .62, y + size * .35, size * .48, size * .5);
  c.fillStyle = '#5b3428';
  c.fillRect(x + halfWidth * .28, y + size * .45, size * .45, wallHeight - size * .45);
  c.fillStyle = '#17213c';
  c.beginPath();
  c.moveTo(x - halfWidth * 1.3, y); c.lineTo(x, y - roofHeight); c.lineTo(x + halfWidth * 1.3, y); c.closePath();
  c.fill();
  c.fillStyle = '#d8d0b0';
  const chimneySide = variant === 3 ? -.72 : .55;
  c.fillRect(x + halfWidth * chimneySide, y - roofHeight * .72, size * .28, roofHeight * .72);
  if (variant === 1) {
    c.fillStyle = '#8b633e'; c.fillRect(x - halfWidth * 1.2, y + wallHeight, halfWidth * 2.4, size * .22);
  } else if (variant === 2) {
    c.strokeStyle = '#d8d0b0'; c.lineWidth = Math.max(1, size * .12);
    c.strokeRect(x - halfWidth * .72, y + size * .22, halfWidth * .48, size * .68);
  }
}
function shoreSpectatorSize(mapScale) {
  return Math.max(2.4, .38 * mapScale);
}
function drawShoreSpectator(c, x, y, size, color, now, index) {
  const bodyWidth = size * 1.7,
    bodyHeight = size * 2.15,
    clap = Math.sin(now * .016 + index) > .2 ? 1.55 : .25;
  c.fillStyle = 'rgba(9,18,35,.25)';
  c.beginPath(); c.ellipse(x + size * .18, y + size * 1.7, bodyWidth * .8, size * .42, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = color;
  c.beginPath(); c.roundRect(x - bodyWidth / 2, y - size * .1, bodyWidth, bodyHeight, size * .45); c.fill();
  c.fillStyle = '#e8b080';
  c.beginPath(); c.arc(x, y - size * 1.05, size * .72, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#e8b080';
  c.lineWidth = Math.max(1, size * .38);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - bodyWidth * .42, y + size * .4); c.lineTo(x - size * 1.55, y - size * clap);
  c.moveTo(x + bodyWidth * .42, y + size * .4); c.lineTo(x + size * 1.55, y - size * clap);
  c.moveTo(x - size * .34, y + bodyHeight); c.lineTo(x - size * .58, y + bodyHeight + size * .75);
  c.moveTo(x + size * .34, y + bodyHeight); c.lineTo(x + size * .58, y + bodyHeight + size * .75);
  c.stroke();
}
const SHORE_TREE_SPECIES = ['pine', 'birch', 'spruce', 'alder', 'rowan', 'aspen'];
function shoreTreeRandom(x, y, salt = 0) {
  let value = Math.imul(x + 37, 374761393) ^ Math.imul(y + 91, 668265263) ^ Math.imul(salt + 13, 1274126177);
  value ^= value >>> 13;
  return (value >>> 0) / 4294967296;
}
function buildShoreTrees() {
  SHORE_TREES = [];
  // The follow camera only exposes a narrow strip around the rowing route.
  // Do not decorate remote shores which the player can never see while racing.
  const cameraCorridor = 56,
    routeStep = Math.max(1, Math.floor(waterRoute.length / 700)),
    insideCameraCorridor = (x, y) => {
      for (let i = 0; i < waterRoute.length; i += routeStep) {
        if ((x - waterRoute[i][0]) ** 2 + (y - waterRoute[i][1]) ** 2 <= cameraCorridor ** 2) return true;
      }
      return false;
    },
    isLand = (x, y) => x >= 0 && x < 805 && y >= 0 && y < 851 && !waterPixels[y * 805 + x],
    nearWater = (x, y) => {
      for (let radius = 3; radius <= 8; radius++) for (const [dx, dy] of [[-radius, 0], [radius, 0], [0, -radius], [0, radius], [-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]]) {
        if (!isLand(x + dx, y + dy)) return true;
      }
      return false;
    };
  for (let gridY = 8; gridY < 843; gridY += 13) for (let gridX = 8; gridX < 797; gridX += 13) {
    const x = gridX + Math.floor(shoreTreeRandom(gridX, gridY, 0) * 9) - 4,
      y = gridY + Math.floor(shoreTreeRandom(gridX, gridY, 1) * 9) - 4;
    if (shoreTreeRandom(gridX, gridY, 2) > .7 || !insideCameraCorridor(x, y) || !nearWater(x, y)) continue;
    let firmlyOnLand = true;
    for (let dy = 0; dy <= 6 && firmlyOnLand; dy += 3) for (let dx = -1; dx <= 1; dx += 2) {
      if (!isLand(x + dx, y + dy)) { firmlyOnLand = false; break; }
    }
    if (!firmlyOnLand || SHORE_CABINS.some(([cx, cy]) => Math.hypot(x - cx * 805, y - cy * 851) < 18)) continue;
    SHORE_TREES.push([
      SHORE_TREE_SPECIES[SHORE_TREES.length % SHORE_TREE_SPECIES.length],
      x / 805,
      y / 851,
      .72 + shoreTreeRandom(gridX, gridY, 4) * .5
    ]);
  }
}
function drawShoreTree(c, species, x, y, scale) {
  const deciduous = !['pine', 'spruce'].includes(species),
    trunkColor = species === 'birch' || species === 'aspen' ? '#e8dfbf' : '#684329',
    leafColors = {pine: '#315f38', spruce: '#214d35', birch: '#6f9b3f', alder: '#477a3b', rowan: '#56893b', aspen: '#79a84a'},
    leafColor = leafColors[species] || '#2f733d';
  c.fillStyle = 'rgba(9,18,35,.2)'; c.fillRect(x - 4 * scale, y + 5 * scale, 10 * scale, 2 * scale);
  c.fillStyle = trunkColor; c.fillRect(x - scale, y - 1 * scale, scale * 2, scale * 8);
  if (species === 'birch') {
    c.fillStyle = '#5b5141';
    for (const stripe of [1, 4]) c.fillRect(x - scale, y + stripe * scale, scale * 1.4, scale);
  }
  c.fillStyle = leafColor;
  if (!deciduous) {
    const width = species === 'spruce' ? 6.5 : 5.5;
    for (const [top, halfWidth] of [[-11, width * .55], [-7, width], [-3, width * .8]]) {
      c.beginPath(); c.moveTo(x, y + top * scale); c.lineTo(x - halfWidth * scale, y + (top + 8) * scale); c.lineTo(x + halfWidth * scale, y + (top + 8) * scale); c.closePath(); c.fill();
    }
  } else {
    const crown = species === 'alder' ? [[0, -6, 5], [-4, -3, 4], [4, -3, 4]] : [[0, -7, 5], [-3.5, -4, 4], [3.5, -4, 4]];
    for (const [dx, dy, radius] of crown) { c.beginPath(); c.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2); c.fill(); }
    if (species === 'rowan') {
      c.fillStyle = '#d85838';
      for (const [dx, dy] of [[-4, -4], [2, -8], [4, -3]]) { c.beginPath(); c.arc(x + dx * scale, y + dy * scale, 1.1 * scale, 0, Math.PI * 2); c.fill(); }
    }
  }
}
function drawLinnavuori(c, x, y, scale, shape = LINNAVUORI_SHAPE) {
  if (shape.length < 3) return;
  c.save();
  c.fillStyle = 'rgba(9,18,35,.28)';
  c.beginPath();
  c.ellipse(x + 2 * scale, y + 5 * scale, 17 * scale, 5 * scale, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#6f787a';
  c.beginPath();
  shape.forEach(([shapeX, shapeY], index) => {
    const pointX = x + shapeX * scale, pointY = y + shapeY * scale;
    if (index) c.lineTo(pointX, pointY); else c.moveTo(pointX, pointY);
  });
  c.closePath();
  c.fill();
  c.clip();
  c.fillStyle = '#a4acad';
  c.beginPath();
  c.moveTo(x - 12 * scale, y - 5 * scale);
  c.lineTo(x - 6 * scale, y - 11 * scale);
  c.lineTo(x - 1 * scale, y - 18 * scale);
  c.lineTo(x + 1 * scale, y - 8 * scale);
  c.lineTo(x - 4 * scale, y - 3 * scale);
  c.closePath();
  c.fill();
  c.strokeStyle = '#4f595c';
  c.lineWidth = Math.max(1, scale);
  c.beginPath();
  c.moveTo(x + 4 * scale, y - 11 * scale);
  c.lineTo(x + 1 * scale, y - 4 * scale);
  c.lineTo(x + 5 * scale, y + 3 * scale);
  c.moveTo(x + 10 * scale, y - 7 * scale);
  c.lineTo(x + 7 * scale, y);
  c.stroke();
  c.restore();
}
function drawMapExtra(c, type, x, y, scale, now = performance.now(), facing = 'right') {
  c.save();
  if (facing === 'left' && (type === 'moose' || type === 'fox' || type === 'hare')) {
    c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0);
  }
  c.lineWidth = Math.max(1, scale);
  if (type === 'tree') {
    drawShoreTree(c, 'pine', x, y, scale);
  } else if (type === 'rock') {
    c.fillStyle = '#7b8586'; c.beginPath();
    c.moveTo(x - 6 * scale, y + 4 * scale); c.lineTo(x - 4 * scale, y - 2 * scale);
    c.lineTo(x + 2 * scale, y - 5 * scale); c.lineTo(x + 6 * scale, y + 4 * scale); c.closePath(); c.fill();
  } else if (type === 'campfire') {
    const flicker = Math.sin(now * .013 + x * .1) * scale;
    c.fillStyle = '#7b8586';
    for (let i = 0; i < 7; i++) {
      const angle = i / 7 * Math.PI * 2;
      c.beginPath(); c.arc(x + Math.cos(angle) * 5.5 * scale, y + 3 * scale + Math.sin(angle) * 2.4 * scale, 1.7 * scale, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#4b2d20'; c.lineWidth = Math.max(2, 2.4 * scale); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 5 * scale, y + 5 * scale); c.lineTo(x + 5 * scale, y + scale); c.moveTo(x + 5 * scale, y + 5 * scale); c.lineTo(x - 5 * scale, y + scale); c.stroke();
    c.fillStyle = '#e85030'; c.beginPath();
    c.moveTo(x - 4 * scale, y + 3 * scale); c.quadraticCurveTo(x - 3 * scale, y - 4 * scale, x + flicker, y - 9 * scale);
    c.quadraticCurveTo(x + 5 * scale, y - 3 * scale, x + 4 * scale, y + 3 * scale); c.closePath(); c.fill();
    c.fillStyle = '#ffe040'; c.beginPath();
    c.moveTo(x - 2 * scale, y + 3 * scale); c.quadraticCurveTo(x, y - 2 * scale, x - flicker * .35, y - 5 * scale);
    c.quadraticCurveTo(x + 3 * scale, y, x + 2 * scale, y + 3 * scale); c.closePath(); c.fill();
    for (let i = 0; i < 4; i++) {
      const cycle = ((now * .000055 + i * .24 + (x + y) * .0007) % 1 + 1) % 1,
        smokeX = x + Math.sin(cycle * Math.PI * 3 + i) * (2 + cycle * 5) * scale,
        smokeY = y - (11 + cycle * 25) * scale;
      c.fillStyle = `rgba(190,196,192,${.32 * (1 - cycle)})`;
      c.beginPath(); c.arc(smokeX, smokeY, (1.8 + cycle * 3) * scale, 0, Math.PI * 2); c.fill();
    }
  } else if (type === 'moose' || type === 'fox' || type === 'hare') {
    const animalScale = scale * (type === 'moose' ? 1.18 : type === 'fox' ? .92 : .82);
    c.fillStyle = 'rgba(9,18,35,.22)';
    c.beginPath(); c.ellipse(x, y + 6 * animalScale, 11 * animalScale, 2 * animalScale, 0, 0, Math.PI * 2); c.fill();
    if (type === 'moose') {
      c.fillStyle = '#5b3b26';
      c.beginPath();
      c.moveTo(x - 10 * animalScale, y - animalScale); c.quadraticCurveTo(x - 4 * animalScale, y - 8 * animalScale, x + 3 * animalScale, y - 5 * animalScale);
      c.lineTo(x + 7 * animalScale, y + animalScale); c.quadraticCurveTo(x, y + 5 * animalScale, x - 10 * animalScale, y + 3 * animalScale); c.closePath(); c.fill();
      c.fillStyle = '#684329';
      c.beginPath(); c.moveTo(x + 2 * animalScale, y - 5 * animalScale); c.lineTo(x + 8 * animalScale, y - 11 * animalScale); c.lineTo(x + 11 * animalScale, y - 8 * animalScale); c.lineTo(x + 7 * animalScale, y); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(x + 12 * animalScale, y - 10 * animalScale, 5.5 * animalScale, 3 * animalScale, .12, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3e2b20'; c.fillRect(x + 15 * animalScale, y - 9 * animalScale, 3 * animalScale, 1.8 * animalScale);
      c.strokeStyle = '#49301f'; c.lineWidth = Math.max(1, 1.35 * animalScale); c.lineCap = 'round';
      c.beginPath();
      for (const legX of [-7, -3, 3, 6]) { c.moveTo(x + legX * animalScale, y + 2 * animalScale); c.lineTo(x + (legX - .5) * animalScale, y + 12 * animalScale); }
      c.stroke();
      c.strokeStyle = '#745033'; c.lineWidth = Math.max(1, 1.15 * animalScale);
      c.beginPath();
      c.moveTo(x + 10 * animalScale, y - 13 * animalScale); c.lineTo(x + 7 * animalScale, y - 19 * animalScale); c.lineTo(x + 2 * animalScale, y - 21 * animalScale);
      c.moveTo(x + 8 * animalScale, y - 18 * animalScale); c.lineTo(x + 5 * animalScale, y - 16 * animalScale);
      c.moveTo(x + 10 * animalScale, y - 13 * animalScale); c.lineTo(x + 13 * animalScale, y - 19 * animalScale); c.lineTo(x + 18 * animalScale, y - 21 * animalScale);
      c.moveTo(x + 14 * animalScale, y - 18 * animalScale); c.lineTo(x + 17 * animalScale, y - 16 * animalScale); c.stroke();
      c.fillStyle = '#101820'; c.fillRect(x + 13 * animalScale, y - 12 * animalScale, 1.2 * animalScale, 1.2 * animalScale);
    } else if (type === 'fox') {
      c.fillStyle = '#c65a2c';
      c.beginPath(); c.ellipse(x, y, 9 * animalScale, 3.8 * animalScale, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x + 6 * animalScale, y - 2 * animalScale); c.lineTo(x + 11 * animalScale, y - 7 * animalScale); c.lineTo(x + 17 * animalScale, y - 3 * animalScale); c.lineTo(x + 11 * animalScale, y + animalScale); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + 8 * animalScale, y - 5 * animalScale); c.lineTo(x + 9 * animalScale, y - 11 * animalScale); c.lineTo(x + 12 * animalScale, y - 6 * animalScale); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + 11 * animalScale, y - 6 * animalScale); c.lineTo(x + 14 * animalScale, y - 10 * animalScale); c.lineTo(x + 15 * animalScale, y - 4 * animalScale); c.closePath(); c.fill();
      c.strokeStyle = '#b74c25'; c.lineWidth = 5 * animalScale; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 8 * animalScale, y); c.quadraticCurveTo(x - 17 * animalScale, y - 5 * animalScale, x - 18 * animalScale, y + 4 * animalScale); c.stroke();
      c.strokeStyle = '#f2e5cc'; c.lineWidth = 2.8 * animalScale; c.beginPath(); c.moveTo(x - 17 * animalScale, y + 2 * animalScale); c.lineTo(x - 18 * animalScale, y + 4 * animalScale); c.stroke();
      c.fillStyle = '#f2e5cc'; c.beginPath(); c.moveTo(x + 11 * animalScale, y - 3 * animalScale); c.lineTo(x + 17 * animalScale, y - 3 * animalScale); c.lineTo(x + 11 * animalScale, y + animalScale); c.closePath(); c.fill();
      c.strokeStyle = '#412a22'; c.lineWidth = Math.max(1, 1.1 * animalScale); c.beginPath();
      c.moveTo(x - 4 * animalScale, y + 2 * animalScale); c.lineTo(x - 5 * animalScale, y + 7 * animalScale);
      c.moveTo(x + 5 * animalScale, y + 2 * animalScale); c.lineTo(x + 7 * animalScale, y + 7 * animalScale); c.stroke();
      c.fillStyle = '#101820'; c.beginPath(); c.arc(x + 17 * animalScale, y - 3 * animalScale, animalScale, 0, Math.PI * 2); c.fill();
      c.fillRect(x + 12 * animalScale, y - 5 * animalScale, animalScale, animalScale);
    } else {
      c.fillStyle = '#938875';
      c.beginPath(); c.ellipse(x - 3 * animalScale, y + animalScale, 7 * animalScale, 5.5 * animalScale, -.15, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 4 * animalScale, y - 2 * animalScale, 4 * animalScale, 3.5 * animalScale, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 3 * animalScale, y - 10 * animalScale, 1.8 * animalScale, 7 * animalScale, -.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 7 * animalScale, y - 10 * animalScale, 1.8 * animalScale, 7.5 * animalScale, .12, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9bfa9';
      c.beginPath(); c.ellipse(x - 7 * animalScale, y + 4 * animalScale, 5 * animalScale, 2.8 * animalScale, -.15, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f0e8d0'; c.beginPath(); c.arc(x - 9 * animalScale, y, 2.3 * animalScale, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#101820'; c.fillRect(x + 5 * animalScale, y - 4 * animalScale, animalScale, animalScale);
    }
  } else {
    c.strokeStyle = '#d8d0b0'; c.beginPath(); c.moveTo(x, y + 7 * scale); c.lineTo(x, y - 7 * scale); c.stroke();
    c.fillStyle = '#d83838'; c.fillRect(x, y - 7 * scale, 8 * scale, 5 * scale);
  }
  c.restore();
}
function drawShorePier(c, startX, startY, endX, endY, scale, preview = false) {
  const dx = endX - startX, dy = endY - startY,
    length = Math.hypot(dx, dy);
  if (length < 2) return;
  const nx = -dy / length, ny = dx / length,
    width = Math.max(5, 8 * scale),
    plankStep = Math.max(5, 6 * scale);
  c.save();
  c.lineCap = 'butt';
  c.strokeStyle = 'rgba(9,18,35,.38)';
  c.lineWidth = width + Math.max(3, 3 * scale);
  c.beginPath(); c.moveTo(startX + 2, startY + 2); c.lineTo(endX + 2, endY + 2); c.stroke();
  c.strokeStyle = '#5b3428'; c.lineWidth = width + Math.max(2, 2 * scale);
  c.beginPath(); c.moveTo(startX, startY); c.lineTo(endX, endY); c.stroke();
  c.strokeStyle = '#b88a50'; c.lineWidth = width;
  c.beginPath(); c.moveTo(startX, startY); c.lineTo(endX, endY); c.stroke();
  c.strokeStyle = '#76502f'; c.lineWidth = Math.max(1, scale);
  for (let distance = plankStep; distance < length; distance += plankStep) {
    const x = startX + dx * distance / length, y = startY + dy * distance / length;
    c.beginPath();
    c.moveTo(x - nx * width * .48, y - ny * width * .48);
    c.lineTo(x + nx * width * .48, y + ny * width * .48);
    c.stroke();
  }
  c.fillStyle = '#4b3022';
  const postSize = Math.max(2, 2.4 * scale);
  for (const side of [-1, 1]) c.fillRect(endX + nx * width * .48 * side - postSize / 2, endY + ny * width * .48 * side - postSize / 2, postSize, postSize);
  if (preview) {
    c.strokeStyle = '#ffe040'; c.lineWidth = Math.max(1, scale); c.setLineDash([4 * scale, 3 * scale]);
    c.beginPath(); c.moveTo(startX, startY); c.lineTo(endX, endY); c.stroke();
  }
  c.restore();
}
function drawShoreLife(m, now) {
  const c = displayCtx;
  const scale = clamp(m.w / 805, .55, 1.15);
  const cabinSize = 9 * scale;
  // Match the people on the Hakovirta starting bridge.
  const spectatorSize = shoreSpectatorSize(m.w / 805);
  const colors = ['#d84838', '#f8d848', '#3888d8', '#f0e8d0', '#c068a0', '#48a878'];
  c.save();
  const linnavuoriScale = scale * 7.5;
  drawLinnavuori(c, m.x + LINNAVUORI[0] * m.w, m.y + LINNAVUORI[1] * m.h - 23 * linnavuoriScale * .2, linnavuoriScale);
  if (!SHORE_TREES_SAVED && !SHORE_TREES.length) buildShoreTrees();
  for (const [species, mapX, mapY, size] of SHORE_TREES) drawShoreTree(c, species, m.x + mapX * m.w, m.y + mapY * m.h, scale * size);
  for (const [[startX, startY], [endX, endY]] of SHORE_PIERS) {
    drawShorePier(c, m.x + startX * m.w, m.y + startY * m.h, m.x + endX * m.w, m.y + endY * m.h, scale);
  }
  for (let i = 0; i < SHORE_CABINS.length; i++) {
    const [mapX, mapY, variant, sizeFactor] = SHORE_CABINS[i];
    drawShoreCabin(c, m.x + mapX * m.w, m.y + mapY * m.h, cabinSize * sizeFactor, SHORE_CABIN_COLORS[i % SHORE_CABIN_COLORS.length], variant);
  }
  if (MAP_DECORATIONS_SAVED) {
    for (let i = 0; i < SHORE_PEOPLE.length; i++) {
      const [mapX, mapY] = SHORE_PEOPLE[i];
      if (pointIsNearStartBridge(mapX * 805, mapY * 851)) continue;
      drawShoreSpectator(c, m.x + mapX * m.w, m.y + mapY * m.h, spectatorSize, colors[i % colors.length], now, i);
    }
  } else {
    let spectatorIndex = 0;
    for (let cabinIndex = 0; cabinIndex < SHORE_CABINS.length; cabinIndex++) {
      const [mapX, mapY] = SHORE_CABINS[cabinIndex], count = shoreCabinSpectatorCount(cabinIndex),
        side = shoreCabinRandom(cabinIndex, 1) < .5 ? -1 : 1, spectatorWidth = spectatorSize * 3.1;
      for (let person = 0; person < count; person++) {
        const offset = side * (cabinSize * 1.3 + spectatorWidth * (1 + person * 1.15));
        const personX = mapX + offset / m.w,
          personY = mapY + cabinSize * (1.05 + (person % 2) * .16) / m.h;
        drawShoreSpectator(c, m.x + personX * m.w, m.y + personY * m.h, spectatorSize, colors[spectatorIndex % colors.length], now, spectatorIndex);
        spectatorIndex++;
      }
    }
  }
  for (const [type, mapX, mapY, facing] of SHORE_EXTRAS) drawMapExtra(c, type, m.x + mapX * m.w, m.y + mapY * m.h, scale, now, facing);
  c.restore();
}
function drawHirviniemiLabel(m) {
  const c = displayCtx;
  c.save();
  c.fillStyle = '#17213c';
  c.font = '700 21px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  c.fillText('Hirviniemi', m.x + .542 * m.w, m.y + .8835 * m.h);
  c.restore();
}
function drawWaterSurface(m, now) {
  if (!waterPixels) return;
  const currentSection = section(),
    wind = currentSection.wind ? clamp(raceDay?.windIntensity ?? 1, 0, 1.35) : .04,
    direction = raceDay?.windDirection || 'head',
    drift = {head: [-1, .32], cross: [.35, 1], tail: [1, -.22]}[direction],
    density = currentSection.wind ? .38 + wind * .38 : .13,
    speed = .000004 + wind * .000022,
    crestLength = 2.4 + wind * 4.2,
    rows = 25,
    columns = 24;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(.65, m.w / 805 * (.65 + wind * .22));
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const seed = (column * 73 + row * 151) % 997,
      visibility = ((seed * 47) % 101) / 100;
    if (visibility > density) continue;
    const phase = now * speed + seed * .013,
      rawX = ((column + .25 + ((seed * 17) % 53) / 70 + drift[0] * phase) / columns % 1 + 1) % 1 * 805,
      rawY = ((row + .2 + ((seed * 29) % 47) / 62 + drift[1] * phase) / rows % 1 + 1) % 1 * 851,
      half = crestLength * (.65 + ((seed * 11) % 31) / 50),
      tilt = direction === 'cross' ? .42 : direction === 'tail' ? -.15 : .15,
      x1 = Math.round(rawX - half), y1 = Math.round(rawY - half * tilt),
      x2 = Math.round(rawX + half), y2 = Math.round(rawY + half * tilt);
    if (x1 < 0 || x2 >= 805 || y1 < 0 || y1 >= 851 || y2 < 0 || y2 >= 851 ||
      !waterPixels[Math.round(rawY) * 805 + Math.round(rawX)] ||
      !waterPixels[y1 * 805 + x1] || !waterPixels[y2 * 805 + x2]) continue;
    const x = m.x + rawX / 805 * m.w,
      y = m.y + rawY / 851 * m.h,
      dx = half / 805 * m.w,
      dy = half * tilt / 851 * m.h,
      lift = (1.1 + wind * 1.5) * m.h / 851;
    ctx.strokeStyle = `rgba(184,224,248,${.10 + wind * .18})`;
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.quadraticCurveTo(x, y - lift, x + dx, y + dy);
    ctx.stroke();
    if (wind > .65 && visibility < density * .34) {
      ctx.strokeStyle = `rgba(16,72,144,${.08 + wind * .08})`;
      ctx.beginPath();
      ctx.moveTo(x - dx * .72, y - dy + lift * 1.35);
      ctx.lineTo(x + dx * .55, y + dy + lift * 1.35);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function nightfallAmount() {
  if (!running || raceType !== 'church' || churchStart !== 'night') return 0;
  // Lähtö on klo 21. Hämärä alkaa selvästi noin klo 22 ja
  // syvenee tasaisesti puolenyön yli, mutta kartta pysyy pelattavana.
  return .58 * clamp((raceElapsed - 3600) / (3 * 3600));
}
function drawNightfall(w, h) {
  const darkness = nightfallAmount();
  if (!darkness) return;
  displayCtx.save();
  displayCtx.fillStyle = `rgba(7,14,42,${darkness})`;
  displayCtx.fillRect(0, 0, w, h);
  displayCtx.restore();
}
function draw(now) {
  const w = canvasCssWidth,
    h = canvasCssHeight,
    m = mapViewport(w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#182848';
  ctx.fillRect(0, 0, w, h);
  if (retroMapReady) {
    ctx.drawImage(retroMap, m.x, m.y, m.w, m.h);
    if (running) {
      drawWaterSurface(m, now);
      for (const [base, phase] of [[.16, 0], [.48, 2.1], [.78, 4.2]]) drawSafetyBoat(m, patrolProgress(base, phase, now), now);
      drawAmbulanceBoat(m, now);
      drawKietavalaFerry(m);
      for (const [index, bot] of botRacers.entries()) {
        const botPoint = startGridFormationPoint(botMotionDistance(bot, index, now), index + 1, botRacers.length + 1, bot.lane, m, bot.routeChoice, bot.distance);
        botBoat(m.x + botPoint.x, m.y + botPoint.y, botPoint.angle, bot, now);
      }
      const p = startGridFormationPoint(playerMotionDistance(now), 0, botRacers.length + 1, playerLane, m, playerRouteChoice, distance);
      boat(m.x + p.x, m.y + p.y, p.angle, now);
    }
  } else {
    ctx.fillStyle = '#eef4ee';
    ctx.font = '16px system-ui';
    ctx.fillText(mapImage.complete ? 'Kartta ei latautunut. Päivitä sivu.' : 'Kartta latautuu…', 20, 40);
  }
  displayCtx.clearRect(0, 0, w, h);
  displayCtx.drawImage(pixelScene, 0, 0, w, h);
  if (retroMapReady && running && !mapOverview) drawShoreLife(m, now);
  if (retroMapReady && running) {
    for (const [base, phase] of [[.16, 0], [.48, 2.1], [.78, 4.2]]) drawSafetyFlag(m, patrolProgress(base, phase, now));
  }
  if (typeof drawRouteEditorOverlay === 'function') drawRouteEditorOverlay(m, w, h);
  if (retroMapReady && running) {
    for (const [index, bot] of botRacers.entries()) {
      const botPoint = startGridFormationPoint(botMotionDistance(bot, index, now), index + 1, botRacers.length + 1, bot.lane, m, bot.routeChoice, bot.distance);
      drawBotPortrait({x: m.x + botPoint.x, y: m.y + botPoint.y, angle: botPoint.angle}, bot);
    }
    const p = startGridFormationPoint(playerMotionDistance(now), 0, botRacers.length + 1, playerLane, m, playerRouteChoice, distance);
    p.x += m.x;
    p.y += m.y;
    drawDistanceBuoys(m);
    drawMapLabels(m, w, h, p);
    drawSafetyLabels(m);
    drawHirviniemiLabel(m);
    drawFinishMarker(m);
    drawRowerPortrait(p, now);
    if (!mapOverview) drawStartBridge(m, w, h, now);
  }
  if (retroMapReady) drawVekaraBridge(m, w, h);
  drawNightfall(w, h);
  const sectionInfo = section();
  document.getElementById('routeSection').textContent = sectionInfo.name;
  requestAnimationFrame(loop);
}

// Remove the ink baked into the display bitmap, never the simulation route.
function removeVisibleRoute(data, width, height) {
  const source = new Uint8ClampedArray(data);
  const ink = new Uint8Array(width * height);
  for (let p = 0; p < ink.length; p++) {
    const i = p * 4;
    if (source[i] < 60 && source[i + 1] < 70 && source[i + 2] < 80) ink[p] = 1;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const darkInk = source[i] < 100 && source[i + 1] < 140 && source[i + 2] < 150;
    const paleLabelHalo = source[i] > 205 && source[i + 1] > 205 && source[i + 2] > 175;
    if (!darkInk && !paleLabelHalo) continue;
    let nearInk = false;
    for (let dy = -4; dy <= 4 && !nearInk; dy++) for (let dx = -4; dx <= 4; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && ink[ny * width + nx]) { nearInk = true; break; }
    }
    if (!nearInk) continue;
    // Nearest unmarked water/land colour restores the thin stroke locally.
    let donor = -1, best = Infinity;
    for (let dy = -11; dy <= 11; dy++) for (let dx = -11; dx <= 11; dx++) {
      const nx = x + dx, ny = y + dy, d = dx * dx + dy * dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || d >= best) continue;
      const j = (ny * width + nx) * 4, r = source[j], g = source[j + 1], b = source[j + 2];
      if (g > 160 && ((b - r > 25 && g - r > 15) || (g > r + 10 && g > b - 5))) { donor = j; best = d; }
    }
    if (donor >= 0) data.set(source.subarray(donor, donor + 3), i);
  }
}
