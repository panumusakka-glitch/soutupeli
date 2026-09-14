const canvas = document.getElementById('lake'),
  displayCtx = canvas.getContext('2d');
const pixelScene = document.createElement('canvas'),
  ctx = pixelScene.getContext('2d');
function resize() {
  const d = devicePixelRatio || 1,
    r = canvas.getBoundingClientRect();
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
  waterRoutePixels;
const STADIUM_RAW = {x: 395, y: 79};
// Water immediately in front of Soutustadion; this is both the visible gate
// and the single official endpoint used by every racer.
const OFFICIAL_FINISH_RAW = {x: 403, y: 73};
function prepareMap() {
  if (!mapImage.complete || !mapImage.naturalWidth || !cleanMapImage.complete || !cleanMapImage.naturalWidth) return;
  retroMap.width = 805;
  retroMap.height = 851;
  const mapCtx = retroMap.getContext('2d');
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
  if (running && !mapOverview) {
    const scale = Math.min(w, h) / (1000 * routePixels / TOTAL);
    const p = botPointOnWater(distance / TOTAL, 805 * scale, 851 * scale);
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
function buildWaterRoute() {
  // Build a continuous water-only line once. Runtime snapping made the boats
  // visibly judder, while snapping only the sparse authored nodes let the
  // straight segments between them cut across land.
  const denseRoute = [];
  for (let i = 1; i < route.length; i++) {
    const from = [route[i - 1][0] * 805, route[i - 1][1] * 851],
      to = [route[i][0] * 805, route[i][1] * 851],
      steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1])));
    for (let step = i === 1 ? 0 : 1; step <= steps; step++) {
      const t = step / steps;
      denseRoute.push(nearestWaterPoint(
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        2,
        24
      ));
    }
  }
  waterRoute = [denseRoute[0]];
  for (let i = 1; i < denseRoute.length; i++) {
    const previous = waterRoute.at(-1),
      next = denseRoute[i];
    if (previous[0] === next[0] && previous[1] === next[1]) continue;
    const dx = Math.abs(next[0] - previous[0]),
      dy = Math.abs(next[1] - previous[1]),
      diagonalIsClear = !dx || !dy || (hasWaterClearance(next[0], previous[1], 2) && hasWaterClearance(previous[0], next[1], 2));
    if (dx <= 1 && dy <= 1 && diagonalIsClear) waterRoute.push(next);
    else waterRoute.push(...(waterPath(previous, next, 2) || [previous, next]).slice(1));
  }
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
function formationPoint(racerDistance, racerIndex, racerCount, racerLane, m) {
  const release = clamp(racerDistance / 140);
  const p = botPointOnWater(racerDistance / TOTAL, 805, 851);
  const columns = 5;
  const column = racerIndex % columns - (columns - 1) / 2;
  const finishMerge = clamp((TOTAL - racerDistance) / 300);
  const sideways = (column * (1 - release) + racerLane * release) * 4.5 * finishMerge;
  const forwards = 0;
  const offsetX = Math.cos(p.angle) * forwards - Math.sin(p.angle) * sideways;
  const offsetY = Math.sin(p.angle) * forwards + Math.cos(p.angle) * sideways;
  let laneFraction = 1;
  if (!hasWaterClearance(Math.round(p.x + offsetX), Math.round(p.y + offsetY), 2)) {
    // Stay on the current water path and shrink the lane offset smoothly.
    // Do not snap to another lake pixel: that made boats visibly jump.
    let low = 0,
      high = 1;
    for (let i = 0; i < 8; i++) {
      const middle = (low + high) / 2;
      if (hasWaterClearance(Math.round(p.x + offsetX * middle), Math.round(p.y + offsetY * middle), 2)) low = middle;
      else high = middle;
    }
    laneFraction = low;
  }
  return {
    x: (p.x + offsetX * laneFraction) / 805 * m.w,
    y: (p.y + offsetY * laneFraction) / 851 * m.h,
    angle: p.angle
  };
}
function drawFinishMarker(m) {
  const p = botPointOnWater(1, m.w, m.h);
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
  const shoreBuoy = aIsShoreSide ? nearA : nearB;
  const oldLakeBuoy = aIsShoreSide ? nearB : nearA;
  // Keep the stadium-side post fixed and double the gate only lakewards.
  const lakeBuoy = {
    x: shoreBuoy.x + 2 * (oldLakeBuoy.x - shoreBuoy.x),
    y: shoreBuoy.y + 2 * (oldLakeBuoy.y - shoreBuoy.y)
  };
  const buoyA = shoreBuoy, buoyB = lakeBuoy;
  c.save();
  c.translate(stadium.x, stadium.y);
  c.rotate(p.angle);
  // Retro version of the red, veranda-fronted Soutustadion building.
  c.fillStyle = '#f8f0c0'; c.fillRect(-16 * scale, -6 * scale, 32 * scale, 12 * scale);
  c.fillStyle = '#a93632'; c.fillRect(-13 * scale, -13 * scale, 26 * scale, 13 * scale);
  c.fillStyle = '#f8f0c0'; c.fillRect(-16 * scale, -15 * scale, 32 * scale, 4 * scale);
  c.fillStyle = '#802a2d';
  c.beginPath(); c.moveTo(-17 * scale, -15 * scale); c.lineTo(0, -23 * scale); c.lineTo(17 * scale, -15 * scale); c.closePath(); c.fill();
  c.fillStyle = '#b8dcf0'; c.fillRect(-6 * scale, -22 * scale, 12 * scale, 7 * scale);
  c.fillStyle = '#802a2d'; c.fillRect(-8 * scale, -24 * scale, 16 * scale, 3 * scale);
  c.fillStyle = '#182848';
  for (let x = -10; x <= 10; x += 7) c.fillRect(x * scale, -10 * scale, 2 * scale, 10 * scale);
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
  // A compact motorboat: yellow rescue hull, cabin, outboard and OP pennant.
  c.fillStyle = '#f3d36b';
  c.strokeStyle = '#17213c';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -12); c.lineTo(7, 7); c.lineTo(4, 12); c.lineTo(-4, 12); c.lineTo(-7, 7); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#e9f6f2'; c.fillRect(-3, -5, 6, 7);
  c.fillStyle = '#38465e'; c.fillRect(-3, 11, 6, 3);
  c.strokeStyle = '#17213c'; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -25); c.stroke();
  // Large orange OP flag: the white linked rings and centre bar stay legible
  // even on the moving, zoomed-out race map.
  c.fillStyle = '#ff6200';
  c.beginPath();
  c.moveTo(0, -25); c.lineTo(14, -24); c.lineTo(12, -16); c.lineTo(0, -17); c.closePath();
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = 1.25;
  c.beginPath();
  c.arc(4, -20.5, 2.25, 0, Math.PI * 2);
  c.arc(9, -20.2, 2.25, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(6.5, -24.2); c.lineTo(6.5, -16.5); c.stroke();
  c.restore();
}
const KIETAVALA_FERRY_DISTANCE = 27900;
const KIETAVALA_FERRY_STOP_DISTANCE = KIETAVALA_FERRY_DISTANCE - 55;
const KIETAVALA_FERRY_DOCKS = [{x: 379, y: 746}, {x: 378, y: 774}];
function kietavalaFerryState(w, h) {
  return {crossing: ferryProgress * 2 - 1};
}
function updateKietavalaFerry(dt) {
  const [from, to] = KIETAVALA_FERRY_DOCKS;
  const crossingPixels = Math.hypot(to.x - from.x, to.y - from.y);
  const metresPerMapPixel = TOTAL / Math.max(1, waterRoutePixels || 2100);
  const maxPixelsPerSecond = 10 / 3.6 / metresPerMapPixel;
  const nearby = [distance, ...(botRacers || []).map(bot => bot.distance)]
    .some(racerDistance => Math.abs(racerDistance - KIETAVALA_FERRY_DISTANCE) < 150);
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
function ferryLimitedDistance(previousDistance, nextDistance) {
  if (!ferryBlocksRacer(previousDistance) || previousDistance > KIETAVALA_FERRY_STOP_DISTANCE) return nextDistance;
  return Math.min(nextDistance, KIETAVALA_FERRY_STOP_DISTANCE);
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
  const ferryScale = scale * 5;
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
function drawAmbulanceBoat(m, now) {
  const p = botPointOnWater(ambulanceProgress(), m.w, m.h), c = ctx;
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
    ...patrols.map(([base, phase]) => [patrolProgress(base, phase, performance.now()), 'OP-VALVONTA']),
    [ambulanceProgress(), 'AMBULANSSI']
  ]) {
    const p = botPointOnWater(progress, m.w, m.h);
    c.fillStyle = '#17213c';
    c.fillRect(m.x + p.x - 25, m.y + p.y - 25, 50, 11);
    c.fillStyle = '#fff8d8';
    c.fillText(label, m.x + p.x, m.y + p.y - 17);
  }
  c.restore();
}
function drawHirviniemiCrowd(m, now) {
  // Keep this tied to the actual rounding point so it stays in view when the
  // camera follows the boats through Hirviniemi.
  const c = displayCtx;
  const scale = clamp(m.w / 805, .55, 1.1);
  const routePoint = botPointOnWater(26500 / TOTAL, m.w, m.h);
  // Hirviniemen kannustuspaikka is on the north shore, not alongside the
  // racing line in open water.
  const baseX = m.x + routePoint.x;
  const baseY = m.y + routePoint.y - 42 * (m.h / 851);
  const colors = ['#d84838', '#f8d848', '#3888d8', '#f0e8d0', '#c068a0', '#48a878'];
  c.save();
  c.fillStyle = '#17213c';
  c.font = '700 7px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  c.fillText('Hirviniemi', baseX, baseY - 8 * scale);
  for (let i = 0; i < 11; i++) {
    const x = baseX + ((i % 6) - 2.5) * 5.2 * scale + (i > 5 ? 2.5 * scale : 0);
    const y = baseY + (Math.floor(i / 6) * 6 + (i % 2) * 1.5) * scale;
    const size = 2.3 * scale;
    const cheer = .35 + .65 * Math.max(0, Math.sin(now * .008 + i * 1.7));
    c.fillStyle = 'rgba(9,18,35,.3)';
    c.beginPath(); c.ellipse(x, y + size * 2.7, size * .9, size * .35, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = colors[i % colors.length]; c.fillRect(x - size, y, size * 2, size * 2.3);
    c.fillStyle = '#e8b080'; c.beginPath(); c.arc(x, y - size * .8, size * .75, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e8b080'; c.lineWidth = Math.max(1, size * .32); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - size * .7, y + size); c.lineTo(x - size * 1.5, y - size * cheer); c.moveTo(x + size * .7, y + size); c.lineTo(x + size * 1.5, y - size * cheer); c.stroke();
  }
  c.restore();
}
function draw(now) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    m = mapViewport(w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#182848';
  ctx.fillRect(0, 0, w, h);
  if (retroMapReady) {
    ctx.drawImage(retroMap, m.x, m.y, m.w, m.h);
    if (running) {
      for (const [base, phase] of [[.16, 0], [.48, 2.1], [.78, 4.2]]) drawSafetyBoat(m, patrolProgress(base, phase, now), now);
      drawAmbulanceBoat(m, now);
      drawKietavalaFerry(m);
      for (const [index, bot] of botRacers.entries()) {
        const botPoint = formationPoint(bot.distance, index + 1, botRacers.length + 1, bot.lane, m);
        botBoat(m.x + botPoint.x, m.y + botPoint.y, botPoint.angle, bot);
      }
      const p = formationPoint(distance, 0, botRacers.length + 1, 0, m);
      boat(m.x + p.x, m.y + p.y, p.angle, now);
    }
  } else {
    ctx.fillStyle = '#eef4ee';
    ctx.font = '16px system-ui';
    ctx.fillText(mapImage.complete ? 'Kartta ei latautunut. Päivitä sivu.' : 'Kartta latautuu…', 20, 40);
  }
  displayCtx.clearRect(0, 0, w, h);
  displayCtx.drawImage(pixelScene, 0, 0, w, h);
  if (typeof drawRouteEditorOverlay === 'function') drawRouteEditorOverlay(m, w, h);
  if (retroMapReady && running) {
    for (const [index, bot] of botRacers.entries()) {
      const botPoint = formationPoint(bot.distance, index + 1, botRacers.length + 1, bot.lane, m);
      drawBotPortrait({x: m.x + botPoint.x, y: m.y + botPoint.y}, bot);
    }
    const p = formationPoint(distance, 0, botRacers.length + 1, 0, m);
    p.x += m.x;
    p.y += m.y;
    drawMapLabels(m, w, h, p);
    drawSafetyLabels(m);
    drawHirviniemiCrowd(m, now);
    drawFinishMarker(m);
    drawRowerPortrait(p, now);
    if (!mapOverview) drawStartBridge(m, w, h, now);
  }
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
