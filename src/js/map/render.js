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
let retroMapReady = false;
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
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    let color;
    if (r < 100 && g < 140 && b < 150) color = [22, 30, 60];else if (r > 160 && g < 110) color = [248, 80, 64];else if (g > 140 && r < 120 && b < 130) color = [184, 248, 24];else if (b - r > 25 && g - r > 15) color = [56, 120, 208];else if (g > r + 10 && g > b - 5) color = [136, 192, 72];else if (r > 225 && g > 225 && b > 225) color = [248, 240, 192];else color = [192, 184, 136];
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
  }
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
    const p = pointOnRoute(clamp(distance / TOTAL), 805 * scale, 851 * scale);
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
function draw(now) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    m = mapViewport(w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#182848';
  ctx.fillRect(0, 0, w, h);
  if (retroMapReady) {
    ctx.drawImage(retroMap, m.x, m.y, m.w, m.h);
    const p = pointOnRoute(Math.min(1, distance / TOTAL), m.w, m.h);
    boat(m.x + p.x, m.y + p.y, p.angle, now);
  } else {
    ctx.fillStyle = '#eef4ee';
    ctx.font = '16px system-ui';
    ctx.fillText(mapImage.complete ? 'Kartta ei latautunut. Päivitä sivu.' : 'Kartta latautuu…', 20, 40);
  }
  displayCtx.clearRect(0, 0, w, h);
  displayCtx.drawImage(pixelScene, 0, 0, w, h);
  if (retroMapReady) {
    const p = pointOnRoute(Math.min(1, distance / TOTAL), m.w, m.h);
    p.x += m.x;
    p.y += m.y;
    drawMapLabels(m, w, h, p);
    drawRowerPortrait(p, now);
    drawStartBridge(m, w, h, now);
  }
  const sectionInfo = section();
  document.getElementById('routeSection').textContent = sectionInfo.name;
  document.getElementById('routeProgress').textContent = `${(distance / TOTAL * 100).toFixed(1).replace('.', ',')} % reitistä`;
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
    if (source[i] >= 100 || source[i + 1] >= 140 || source[i + 2] >= 150) continue;
    let nearInk = false;
    for (let dy = -2; dy <= 2 && !nearInk; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && ink[ny * width + nx]) { nearInk = true; break; }
    }
    if (!nearInk) continue;
    // Nearest unmarked water/land colour restores the thin stroke locally.
    let donor = -1, best = Infinity;
    for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
      const nx = x + dx, ny = y + dy, d = dx * dx + dy * dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || d >= best) continue;
      const j = (ny * width + nx) * 4, r = source[j], g = source[j + 1], b = source[j + 2];
      if (g > 160 && ((b - r > 25 && g - r > 15) || (g > r + 10 && g > b - 5))) { donor = j; best = d; }
    }
    if (donor >= 0) data.set(source.subarray(donor, donor + 3), i);
  }
}
