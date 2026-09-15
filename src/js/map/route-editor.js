// The explicit query flag is the safety boundary. This also supports IDE preview
// servers, LAN addresses and direct file previews whose hostname is not localhost.
const routeEditorEnabled = /(?:^|[?&])routeEditor=1(?:&|$)/.test(location.search);

const routeEditorPointSets = {
  cabins: SHORE_CABINS.map(([x, y, variant, sizeFactor]) => [x * 805, y * 851, variant, sizeFactor]),
  people: SHORE_PEOPLE.map(([x, y]) => [x * 805, y * 851]),
  piers: SHORE_PIERS.map(([start, end]) => [[start[0] * 805, start[1] * 851], [end[0] * 805, end[1] * 851]]),
  extras: SHORE_EXTRAS.map(([type, x, y, facing]) => [type, x * 805, y * 851, facing]),
  trees: SHORE_TREES.map(([species, x, y, size]) => [species, x * 805, y * 851, size]),
  linnavuori: LINNAVUORI_SHAPE.map(point => point.slice()),
  route: []
};
let routeEditorPoints = routeEditorPointSets.cabins,
  routeEditorMode = 'cabins',
  routeEditorDrawing = false,
  routeEditorDeleting = false,
  routeEditorDragIndex = -1,
  routeEditorPierDrag = null,
  routeEditorPierStart = null,
  routeEditorPierEnd = null,
  routeEditorPanning = false,
  routeEditorPanCandidate = false,
  routeEditorPanStart,
  routeEditorZoom = 1,
  routeEditorCenter = [805 / 2, 851 / 2],
  routeEditorClearance = 2,
  routeEditorExtraType = 'tree',
  routeEditorAnimalFacing = 'right',
  routeEditorTreesLoaded = false,
  routeEditorOutput,
  routeEditorStatus;

function routeEditorViewport(w, h) {
  if (!routeEditorEnabled) return null;
  const fit = Math.max(0, Math.min((w - 24) / 805, (h - 24) / 851)),
    scale = fit * routeEditorZoom;
  return {
    w: 805 * scale,
    h: 851 * scale,
    x: w / 2 - routeEditorCenter[0] * scale,
    y: h / 2 - routeEditorCenter[1] * scale
  };
}

function routeEditorSetZoom(nextZoom, screenX, screenY) {
  const w = canvas.clientWidth, h = canvas.clientHeight,
    before = routeEditorViewport(w, h),
    rawX = (screenX - before.x) / before.w * 805,
    rawY = (screenY - before.y) / before.h * 851;
  routeEditorZoom = clamp(nextZoom, 1, 12);
  const after = routeEditorViewport(w, h), scale = after.w / 805;
  routeEditorCenter = [
    rawX - (screenX - w / 2) / scale,
    rawY - (screenY - h / 2) / scale
  ];
}

function routeEditorFit() {
  routeEditorZoom = 1;
  routeEditorCenter = [805 / 2, 851 / 2];
}

function routeEditorRawPoint(event) {
  const rect = canvas.getBoundingClientRect(),
    m = mapViewport(canvas.clientWidth, canvas.clientHeight),
    x = (event.clientX - rect.left - m.x) / m.w * 805,
    y = (event.clientY - rect.top - m.y) / m.h * 851;
  if (x < 0 || x > 805 || y < 0 || y > 851) return null;
  return [x, y];
}

function routeEditorLinnavuoriPoint(event) {
  const rect = canvas.getBoundingClientRect(),
    m = routeEditorViewport(canvas.clientWidth, canvas.clientHeight),
    scale = clamp(m.w / 805, .55, 1.15) * 7.5,
    centerX = m.x + LINNAVUORI[0] * m.w,
    centerY = m.y + LINNAVUORI[1] * m.h - 23 * scale * .2;
  return [(event.clientX - rect.left - centerX) / scale, (event.clientY - rect.top - centerY) / scale];
}

function routeEditorCapturePointer(event) {
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Some browsers may end the pointer before capture during a mode switch.
    // Dragging still works through the canvas listeners without capture.
  }
}

function routeEditorPlacePoint(point) {
  routeEditorPoints.push(routeEditorMode === 'extras'
    ? [routeEditorExtraType, ...point, ['moose', 'fox', 'hare'].includes(routeEditorExtraType) ? routeEditorAnimalFacing : undefined]
    : routeEditorMode === 'trees'
      ? [SHORE_TREE_SPECIES[routeEditorPoints.length % SHORE_TREE_SPECIES.length], ...point, 1]
    : routeEditorMode === 'cabins'
      ? [...point, routeEditorPoints.length % 4, [.78, .9, 1, 1.15, 1.28][(routeEditorPoints.length * 3) % 5]]
      : point);
  routeEditorUpdateOutput();
}

function routeEditorAddPoint(event, updateOutput = true) {
  const point = routeEditorRawPoint(event), previous = routeEditorPoints.at(-1);
  if (!point || previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < 3) return;
  routeEditorPoints.push(point);
  if (updateOutput) routeEditorUpdateOutput();
}

function routeEditorNearestPoint(point, radius = 12) {
  const m = routeEditorViewport(canvas.clientWidth, canvas.clientHeight), scale = m.w / 805;
  let nearest = -1, nearestDistance = radius / scale;
  routeEditorPoints.forEach((item, index) => {
    const candidate = routeEditorMode === 'extras' || routeEditorMode === 'trees' ? item.slice(1) : item;
    const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance <= nearestDistance) { nearest = index; nearestDistance = distance; }
  });
  return nearest;
}

function routeEditorHitTest(point) {
  const scale = routeEditorViewport(canvas.clientWidth, canvas.clientHeight).w / 805,
    radius = 12 / scale;
  let hit = null, nearestDistance = radius;
  for (const mode of ['cabins', 'people', 'extras', 'trees']) {
    routeEditorPointSets[mode].forEach((item, index) => {
      const candidate = mode === 'extras' || mode === 'trees' ? item.slice(1) : item,
        distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance <= nearestDistance) { hit = {mode, index}; nearestDistance = distance; }
    });
  }
  routeEditorPointSets.piers.forEach(([start, end], index) => {
    for (const endpoint of [0, 1]) {
      const candidate = endpoint ? end : start,
        distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance <= nearestDistance) { hit = {mode: 'piers', index, endpoint}; nearestDistance = distance; }
    }
  });
  if (hit) return hit;
  routeEditorPointSets.piers.forEach(([start, end], index) => {
    const distance = routeEditorDistanceToSegment(point, start, end);
    if (distance <= nearestDistance) { hit = {mode: 'piers', index, endpoint: null}; nearestDistance = distance; }
  });
  return hit;
}

function routeEditorDistanceToSegment(point, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy));
  return Math.hypot(point[0] - start[0] - t * dx, point[1] - start[1] - t * dy);
}

function routeEditorSegmentIsWater(start, end) {
  if (!waterPixels) return true;
  const steps = Math.max(1, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1])));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps,
      x = Math.round(start[0] + (end[0] - start[0]) * t),
      y = Math.round(start[1] + (end[1] - start[1]) * t);
    if (!hasWaterClearance(x, y, routeEditorClearance)) return false;
  }
  return true;
}

function routeEditorSimplify(points, tolerance = 3) {
  if (points.length < 3) return points.slice();
  let furthest = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = routeEditorDistanceToSegment(points[i], points[0], points.at(-1));
    if (distance > furthest) { furthest = distance; index = i; }
  }
  if (furthest <= tolerance && routeEditorSegmentIsWater(points[0], points.at(-1))) return [points[0], points.at(-1)];
  return [
    ...routeEditorSimplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...routeEditorSimplify(points.slice(index), tolerance)
  ];
}

function routeEditorUpdateOutput() {
  if (!routeEditorOutput) return;
  if (routeEditorMode === 'linnavuori') {
    routeEditorOutput.value = routeEditorPoints.map(([x, y]) => `[${x.toFixed(2)}, ${y.toFixed(2)}]`).join(',\n');
    routeEditorStatus.textContent = routeEditorPoints.length >= 3
      ? `${routeEditorPoints.length} Linnavuoren ääriviivapistettä`
      : 'Piirrä Linnavuoren suljettu ääriviiva vetämällä.';
    return;
  }
  if (routeEditorMode === 'piers') {
    routeEditorOutput.value = routeEditorPoints.map(([start, end]) =>
      `[[${(start[0] / 805).toFixed(4)}, ${(start[1] / 851).toFixed(4)}], [${(end[0] / 805).toFixed(4)}, ${(end[1] / 851).toFixed(4)}]]`
    ).join(',\n');
    routeEditorStatus.textContent = routeEditorPoints.length ? `${routeEditorPoints.length} laituria piirretty` : 'Vedä laituri rannasta veteen.';
    return;
  }
  if (routeEditorMode === 'extras') {
    routeEditorOutput.value = routeEditorPoints.map(([type, x, y, facing]) =>
      `['${type}', ${(x / 805).toFixed(4)}, ${(y / 851).toFixed(4)}${facing ? `, '${facing}'` : ''}]`
    ).join(',\n');
    routeEditorStatus.textContent = routeEditorPoints.length ? `${routeEditorPoints.length} muuta elementtiä sijoitettu` : 'Sijoita valittu elementti kartalle.';
    return;
  }
  if (routeEditorMode === 'trees') {
    routeEditorOutput.value = routeEditorPoints.map(([species, x, y, size]) =>
      `['${species}', ${(x / 805).toFixed(4)}, ${(y / 851).toFixed(4)}, ${size.toFixed(2)}]`
    ).join(',\n');
    routeEditorStatus.textContent = routeEditorPoints.length ? `${routeEditorPoints.length} puuta sijoitettu` : 'Puita ei ole sijoitettu.';
    return;
  }
  const points = routeEditorMode === 'route' ? routeEditorSimplify(routeEditorPoints) : routeEditorPoints;
  routeEditorOutput.value = points.map(([x, y, variant, sizeFactor]) =>
    `[${(x / 805).toFixed(4)}, ${(y / 851).toFixed(4)}${routeEditorMode === 'cabins' ? `, ${variant}, ${sizeFactor}` : routeEditorMode === 'route' && routeEditorClearance !== 2 ? `, ${routeEditorClearance}` : ''}]`
  ).join(',\n');
  const landPoints = routeEditorPoints.filter(([x, y]) =>
    waterPixels && !hasWaterClearance(Math.round(x), Math.round(y), routeEditorClearance)
  ).length;
  routeEditorStatus.textContent = !points.length
    ? routeEditorMode === 'route' ? 'Piirrä kartalle kilpailusuuntaan.' : `Sijoita ${routeEditorMode === 'cabins' ? 'mökit' : 'ihmiset'} kartalle.`
    : routeEditorMode === 'route'
      ? `${points.length} reittipistettä · ${landPoints ? `${landPoints} piirrospistettä liian lähellä maata` : 'koko piirros vesialueella'}`
      : `${points.length} ${routeEditorMode === 'cabins' ? 'mökkiä' : 'ihmistä'} sijoitettu`;
}

function drawRouteEditorOverlay(m) {
  if (!routeEditorEnabled || !retroMapReady) return;
  const c = displayCtx;
  function drawLine(points, color, width) {
    if (points.length < 2) return;
    c.beginPath();
    points.forEach(([x, y], index) => {
      const px = m.x + x / 805 * m.w, py = m.y + y / 851 * m.h;
      if (index) c.lineTo(px, py); else c.moveTo(px, py);
    });
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  }
  c.save();
  drawLine(route.map(([x, y]) => [x * 805, y * 851]), 'rgba(255,255,255,.7)', 2);
  drawFinishMarker(m);
  const mapScale = m.w / 805,
    decorationScale = clamp(mapScale, .55, 1.15),
    cabinSize = 9 * decorationScale,
    spectatorSize = .38 * mapScale;

  const linnavuoriScale = decorationScale * 7.5;
  drawLinnavuori(
    c,
    m.x + LINNAVUORI[0] * m.w,
    m.y + LINNAVUORI[1] * m.h - 23 * linnavuoriScale * .2,
    linnavuoriScale,
    routeEditorPointSets.linnavuori
  );

  // Show the whole composed scene while the active tool only controls edits.
  if (!routeEditorTreesLoaded && waterPixels) {
    if (!SHORE_TREES_SAVED && !SHORE_TREES.length) buildShoreTrees();
    if (!routeEditorPointSets.trees.length) routeEditorPointSets.trees.push(...SHORE_TREES.map(([species, x, y, size]) => [species, x * 805, y * 851, size]));
    routeEditorTreesLoaded = true;
  }
  for (const [species, x, y, size] of routeEditorPointSets.trees) {
    drawShoreTree(c, species, m.x + x / 805 * m.w, m.y + y / 851 * m.h, decorationScale * size);
  }
  for (const [[startX, startY], [endX, endY]] of routeEditorPointSets.piers) {
    drawShorePier(c, m.x + startX / 805 * m.w, m.y + startY / 851 * m.h, m.x + endX / 805 * m.w, m.y + endY / 851 * m.h, decorationScale);
  }
  for (let i = 0; i < routeEditorPointSets.cabins.length; i++) {
    const [x, y, variant, sizeFactor] = routeEditorPointSets.cabins[i];
    drawShoreCabin(c, m.x + x / 805 * m.w, m.y + y / 851 * m.h, cabinSize * sizeFactor, SHORE_CABIN_COLORS[i % SHORE_CABIN_COLORS.length], variant);
  }
  for (let i = 0; i < routeEditorPointSets.people.length; i++) {
    const [x, y] = routeEditorPointSets.people[i];
    drawShoreSpectator(c, m.x + x / 805 * m.w, m.y + y / 851 * m.h, spectatorSize, '#f8d848', performance.now(), i);
  }
  for (const [type, x, y, facing] of routeEditorPointSets.extras) {
    drawMapExtra(c, type, m.x + x / 805 * m.w, m.y + y / 851 * m.h, decorationScale, performance.now(), facing);
  }

  if (routeEditorMode === 'route') {
    for (let i = 1; i < routeEditorPoints.length; i++) {
      const pair = [routeEditorPoints[i - 1], routeEditorPoints[i]],
        invalid = pair.some(([x, y]) => !hasWaterClearance(Math.round(x), Math.round(y), routeEditorClearance));
      drawLine(pair, invalid ? '#ff3048' : '#ffe040', 4);
    }
  } else if (routeEditorMode === 'piers') {
    if (routeEditorPierStart && routeEditorPierEnd) drawShorePier(
      c,
      m.x + routeEditorPierStart[0] / 805 * m.w,
      m.y + routeEditorPierStart[1] / 851 * m.h,
      m.x + routeEditorPierEnd[0] / 805 * m.w,
      m.y + routeEditorPierEnd[1] / 851 * m.h,
      decorationScale,
      true
    );
  } else if (routeEditorMode === 'linnavuori' && routeEditorPoints.length) {
    const centerX = m.x + LINNAVUORI[0] * m.w,
      centerY = m.y + LINNAVUORI[1] * m.h - 23 * linnavuoriScale * .2;
    c.strokeStyle = '#ffe040'; c.fillStyle = '#ffe040'; c.lineWidth = 2;
    c.beginPath();
    routeEditorPoints.forEach(([x, y], index) => {
      const screenX = centerX + x * linnavuoriScale, screenY = centerY + y * linnavuoriScale;
      if (index) c.lineTo(screenX, screenY); else c.moveTo(screenX, screenY);
      c.fillRect(screenX - 2, screenY - 2, 4, 4);
    });
    c.closePath(); c.stroke();
  }
  c.restore();
}

if (routeEditorEnabled) {
  document.body.classList.add('route-editor-mode');
  mapOverview = true;
  const lakeWrap = document.querySelector('.lake-wrap');
  // Keep the editor usable even in IDE previews that fail to load styles.css.
  document.body.style.cssText = 'margin:0;background:#101830;overflow:hidden';
  document.querySelectorAll('main > :not(.lake-wrap)').forEach(element => element.style.display = 'none');
  lakeWrap.querySelectorAll(':scope > :not(#lake)').forEach(element => element.style.display = 'none');
  lakeWrap.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;overflow:hidden;background:#101830';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
  const panel = document.createElement('section');
  panel.className = 'route-editor-panel';
  panel.innerHTML = `
    <strong>KARTTATYÖKALU</strong>
    <span>Napsauta tyhjää kohtaa lisätäksesi. Vedä vedestä tai maasta siirtääksesi karttaa. Elementtiin tarttuminen siirtää sitä. Laituri ja reitti piirretään vetämällä.</span>
    <div><button type="button" data-mode="cabins" aria-pressed="true">Mökit</button><button type="button" data-mode="people" aria-pressed="false">Ihmiset</button><button type="button" data-mode="piers" aria-pressed="false">Laiturit</button><button type="button" data-mode="extras" aria-pressed="false">Muut</button><button type="button" data-mode="trees" aria-pressed="false">Puut</button><button type="button" data-mode="linnavuori" aria-pressed="false">Linnavuori</button><button type="button" data-mode="route" aria-pressed="false">Reitti</button></div>
    <label data-extra-picker hidden>Elementti <select data-action="extra-type"><option value="tree">Puu</option><option value="rock">Kivi</option><option value="campfire">Nuotio</option><option value="flag">Lippu</option><option value="moose">Hirvi</option><option value="fox">Kettu</option><option value="hare">Jänis</option></select></label>
    <label data-animal-facing hidden>Suunta <select data-action="animal-facing"><option value="right">Oikealle</option><option value="left">Vasemmalle</option></select></label>
    <label>Turvaväli <select data-action="clearance"><option value="2">Normaali · 2 px</option><option value="1">Kapea · 1 px</option><option value="0">Erittäin kapea · 0 px</option></select></label>
    <textarea aria-label="Sijoitettujen kohteiden pisteet" readonly></textarea>
    <div><button type="button" data-action="zoom-out">−</button><button type="button" data-action="zoom-in">+</button><button type="button" data-action="fit">Sovita</button></div>
    <div><button type="button" data-action="copy">Kopioi pisteet</button><button type="button" data-action="delete" aria-pressed="false">Poista kohde</button><button type="button" data-action="undo">Kumoa viimeinen</button><button type="button" data-action="clear">Tyhjennä</button></div>
    <button type="button" data-action="save">Tallenna peliin</button>
    <output aria-live="polite"></output>`;
  panel.style.cssText = 'box-sizing:border-box;position:absolute;z-index:5;top:12px;right:12px;width:min(360px,calc(100% - 24px));max-height:calc(100vh - 24px);overflow:auto;display:grid;gap:8px;padding:12px;background:rgba(16,24,48,.94);border:2px solid #ffe56b;box-shadow:3px 3px #080f20;color:#fff8d8;font:12px "Courier New",monospace;overflow-wrap:anywhere';
  lakeWrap.append(panel);
  routeEditorOutput = panel.querySelector('textarea');
  routeEditorStatus = panel.querySelector('output');
  routeEditorOutput.style.cssText = 'box-sizing:border-box;width:100%;height:110px;resize:vertical;background:#08142c;border:1px solid #92b2d8;color:#fff8d8;font:12px "Courier New",monospace';
  panel.querySelectorAll('select').forEach(select => select.style.cssText = 'margin-left:8px;padding:4px;background:#08142c;border:1px solid #92b2d8;color:#fff8d8');
  routeEditorStatus.style.color = '#a9d8ff';
  panel.querySelectorAll('div').forEach(group => group.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px');
  panel.querySelectorAll('button').forEach(button => button.style.cssText = 'box-sizing:border-box;min-height:34px;max-width:100%;padding:6px 10px;background:#c84038;border:2px solid #f8f0c0;color:white;font:700 12px "Courier New",monospace;cursor:pointer;white-space:normal');
  panel.querySelectorAll('[data-mode]').forEach(button => button.style.flex = '1 1 62px');
  panel.querySelector('[data-action="save"]').style.width = '100%';
  panel.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {
    routeEditorMode = button.dataset.mode;
    routeEditorPoints = routeEditorPointSets[routeEditorMode];
    routeEditorDragIndex = -1;
    routeEditorPierDrag = null;
    routeEditorPierStart = routeEditorPierEnd = null;
    panel.querySelectorAll('[data-mode]').forEach(option => {
      const selected = option === button;
      option.setAttribute('aria-pressed', selected);
      option.style.background = selected ? '#ffe56b' : '#283858';
      option.style.color = selected ? '#101830' : '#fff';
    });
    panel.querySelector('[data-action="clearance"]').closest('label').hidden = routeEditorMode !== 'route';
    panel.querySelector('[data-extra-picker]').hidden = routeEditorMode !== 'extras';
    panel.querySelector('[data-animal-facing]').hidden = routeEditorMode !== 'extras' || !['moose', 'fox', 'hare'].includes(routeEditorExtraType);
    routeEditorUpdateOutput();
  });
  panel.querySelector('[data-mode="cabins"]').click();
  routeEditorUpdateOutput();
  panel.querySelector('[data-action="clear"]').onclick = () => {
    routeEditorPoints.length = 0;
    routeEditorUpdateOutput();
  };
  panel.querySelector('[data-action="undo"]').onclick = () => {
    routeEditorPoints.pop();
    routeEditorUpdateOutput();
  };
  panel.querySelector('[data-action="delete"]').onclick = event => {
    routeEditorDeleting = !routeEditorDeleting;
    event.currentTarget.setAttribute('aria-pressed', routeEditorDeleting);
    event.currentTarget.style.background = routeEditorDeleting ? '#ffe56b' : '#c84038';
    event.currentTarget.style.color = routeEditorDeleting ? '#101830' : '#fff';
    routeEditorStatus.textContent = routeEditorDeleting ? 'Napsauta poistettavaa kohdetta.' : 'Poistotila suljettu.';
  };
  panel.querySelector('[data-action="copy"]').onclick = async () => {
    if (!routeEditorOutput.value) return;
    await navigator.clipboard.writeText(routeEditorOutput.value);
    routeEditorStatus.textContent = 'Pisteet kopioitu leikepöydälle.';
  };
  panel.querySelector('[data-action="zoom-in"]').onclick = () => routeEditorSetZoom(routeEditorZoom * 1.5, canvas.clientWidth / 2, canvas.clientHeight / 2);
  panel.querySelector('[data-action="zoom-out"]').onclick = () => routeEditorSetZoom(routeEditorZoom / 1.5, canvas.clientWidth / 2, canvas.clientHeight / 2);
  panel.querySelector('[data-action="fit"]').onclick = routeEditorFit;
  panel.querySelector('[data-action="extra-type"]').onchange = event => {
    routeEditorExtraType = event.target.value;
    panel.querySelector('[data-animal-facing]').hidden = !['moose', 'fox', 'hare'].includes(routeEditorExtraType);
  };
  panel.querySelector('[data-action="animal-facing"]').onchange = event => routeEditorAnimalFacing = event.target.value;
  panel.querySelector('[data-action="save"]').onclick = () => {
    const decorations = {
      cabins: routeEditorPointSets.cabins.map(([x, y, variant, sizeFactor]) => [x / 805, y / 851, variant, sizeFactor]),
      people: routeEditorPointSets.people.map(([x, y]) => [x / 805, y / 851]),
      piers: routeEditorPointSets.piers.map(([start, end]) => [[start[0] / 805, start[1] / 851], [end[0] / 805, end[1] / 851]]),
      extras: routeEditorPointSets.extras.map(([type, x, y, facing]) => facing ? [type, x / 805, y / 851, facing] : [type, x / 805, y / 851]),
      trees: routeEditorPointSets.trees.map(([species, x, y, size]) => [species, x / 805, y / 851, size]),
      linnavuoriShape: routeEditorPointSets.linnavuori.map(point => point.slice())
    };
    localStorage.setItem(MAP_DECORATIONS_KEY, JSON.stringify(decorations));
    routeEditorStatus.textContent = 'Mökit, ihmiset, laiturit, puut ja muut elementit tallennettu peliin.';
  };
  panel.querySelector('[data-action="clearance"]').onchange = event => {
    routeEditorClearance = Number(event.target.value);
    routeEditorUpdateOutput();
  };
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    routeEditorSetZoom(routeEditorZoom * Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
  }, {passive: false});
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.button === 2) {
      routeEditorPanning = true;
      routeEditorPanStart = [event.clientX, event.clientY, ...routeEditorCenter];
      routeEditorCapturePointer(event);
      return;
    }
    if (event.button !== 0) return;
    const point = routeEditorRawPoint(event);
    if (!point) return;
    const hit = routeEditorMode === 'linnavuori' ? null : routeEditorHitTest(point);
    if (event.shiftKey || routeEditorDeleting) {
      if (hit) routeEditorPointSets[hit.mode].splice(hit.index, 1);
      routeEditorDeleting = false;
      const deleteButton = panel.querySelector('[data-action="delete"]');
      deleteButton.setAttribute('aria-pressed', 'false');
      deleteButton.style.background = '#c84038';
      deleteButton.style.color = '#fff';
      routeEditorUpdateOutput();
      return;
    }
    if (hit) {
      panel.querySelector(`[data-mode="${hit.mode}"]`).click();
      routeEditorCapturePointer(event);
      if (hit.mode === 'piers') {
        const pier = routeEditorPoints[hit.index];
        routeEditorPierDrag = {index: hit.index, endpoint: hit.endpoint, pointer: point, original: pier.map(endpoint => endpoint.slice())};
      } else {
        routeEditorDragIndex = hit.index;
      }
      return;
    }
    routeEditorDrawing = routeEditorMode === 'route' || routeEditorMode === 'piers' || routeEditorMode === 'linnavuori';
    routeEditorCapturePointer(event);
    if (routeEditorMode === 'piers') {
      routeEditorPierStart = routeEditorPierEnd = point;
    } else if (routeEditorMode === 'route') {
      routeEditorAddPoint(event);
    } else if (routeEditorMode === 'linnavuori') {
      routeEditorPoints.length = 0;
      routeEditorPoints.push(routeEditorLinnavuoriPoint(event));
    } else {
      routeEditorPanCandidate = true;
      routeEditorPanStart = [event.clientX, event.clientY, ...routeEditorCenter];
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (routeEditorPanCandidate && Math.hypot(event.clientX - routeEditorPanStart[0], event.clientY - routeEditorPanStart[1]) > 4) {
      routeEditorPanCandidate = false;
      routeEditorPanning = true;
    }
    if (routeEditorPanning) {
      event.preventDefault(); event.stopImmediatePropagation();
      const m = routeEditorViewport(canvas.clientWidth, canvas.clientHeight), scale = m.w / 805;
      routeEditorCenter = [
        routeEditorPanStart[2] - (event.clientX - routeEditorPanStart[0]) / scale,
        routeEditorPanStart[3] - (event.clientY - routeEditorPanStart[1]) / scale
      ];
      return;
    }
    if (routeEditorDragIndex >= 0) {
      event.preventDefault(); event.stopImmediatePropagation();
      const point = routeEditorRawPoint(event);
      if (point) routeEditorPoints[routeEditorDragIndex] = routeEditorMode === 'trees'
        ? [routeEditorPoints[routeEditorDragIndex][0], ...point, routeEditorPoints[routeEditorDragIndex][3]]
        : routeEditorMode === 'extras'
        ? [routeEditorPoints[routeEditorDragIndex][0], ...point, routeEditorPoints[routeEditorDragIndex][3]]
        : routeEditorMode === 'cabins'
          ? [...point, ...routeEditorPoints[routeEditorDragIndex].slice(2)]
          : point;
      return;
    }
    if (routeEditorPierDrag) {
      event.preventDefault(); event.stopImmediatePropagation();
      const point = routeEditorRawPoint(event);
      if (point) {
        const drag = routeEditorPierDrag;
        if (drag.endpoint === null) {
          const dx = point[0] - drag.pointer[0], dy = point[1] - drag.pointer[1];
          routeEditorPoints[drag.index] = drag.original.map(([x, y]) => [x + dx, y + dy]);
        } else routeEditorPoints[drag.index][drag.endpoint] = point;
      }
      return;
    }
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (routeEditorMode === 'piers') routeEditorPierEnd = routeEditorRawPoint(event) || routeEditorPierEnd;
    else if (routeEditorMode === 'linnavuori') {
      const point = routeEditorLinnavuoriPoint(event), previous = routeEditorPoints.at(-1);
      if (!previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= .6) routeEditorPoints.push(point);
    } else routeEditorAddPoint(event, false);
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, event => {
    if (routeEditorPanning) {
      event.preventDefault(); event.stopImmediatePropagation();
      routeEditorPanning = false;
      return;
    }
    if (routeEditorPanCandidate) {
      event.preventDefault(); event.stopImmediatePropagation();
      routeEditorPanCandidate = false;
      if (type === 'pointerup') {
        const point = routeEditorRawPoint(event);
        if (point) routeEditorPlacePoint(point);
      }
      return;
    }
    if (routeEditorDragIndex >= 0) {
      event.preventDefault(); event.stopImmediatePropagation();
      const point = routeEditorRawPoint(event);
      if (point) routeEditorPoints[routeEditorDragIndex] = routeEditorMode === 'trees'
        ? [routeEditorPoints[routeEditorDragIndex][0], ...point, routeEditorPoints[routeEditorDragIndex][3]]
        : routeEditorMode === 'extras'
        ? [routeEditorPoints[routeEditorDragIndex][0], ...point, routeEditorPoints[routeEditorDragIndex][3]]
        : routeEditorMode === 'cabins'
          ? [...point, ...routeEditorPoints[routeEditorDragIndex].slice(2)]
          : point;
      routeEditorDragIndex = -1;
      routeEditorUpdateOutput();
      return;
    }
    if (routeEditorPierDrag) {
      event.preventDefault(); event.stopImmediatePropagation();
      routeEditorPierDrag = null;
      routeEditorUpdateOutput();
      return;
    }
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (routeEditorMode === 'route') routeEditorAddPoint(event);
    else if (routeEditorMode === 'linnavuori') routeEditorUpdateOutput();
    else if (routeEditorMode === 'piers') {
      routeEditorPierEnd = routeEditorRawPoint(event) || routeEditorPierEnd;
      if (routeEditorPierStart && routeEditorPierEnd && Math.hypot(routeEditorPierEnd[0] - routeEditorPierStart[0], routeEditorPierEnd[1] - routeEditorPierStart[1]) >= 3) {
        routeEditorPoints.push([routeEditorPierStart, routeEditorPierEnd]);
      }
      routeEditorPierStart = routeEditorPierEnd = null;
      routeEditorUpdateOutput();
    }
    routeEditorDrawing = false;
  });
  addEventListener('keydown', event => {
    const editable = event.target?.closest?.('input,textarea,select,[contenteditable]');
    if (!editable && !event.ctrlKey && !event.metaKey && event.code !== 'F5') event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}
