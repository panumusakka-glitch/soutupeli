// The explicit query flag is the safety boundary. This also supports IDE preview
// servers, LAN addresses and direct file previews whose hostname is not localhost.
const routeEditorEnabled = /(?:^|[?&])routeEditor=1(?:&|$)/.test(location.search);

let routeEditorPoints = [],
  routeEditorMode = 'points',
  routeEditorDrawing = false,
  routeEditorPanning = false,
  routeEditorPanStart,
  routeEditorZoom = 1,
  routeEditorCenter = [805 / 2, 851 / 2],
  routeEditorClearance = 2,
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

function routeEditorAddPoint(event) {
  const point = routeEditorRawPoint(event), previous = routeEditorPoints.at(-1);
  if (!point || previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < 3) return;
  routeEditorPoints.push(point);
  routeEditorUpdateOutput();
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
  const points = routeEditorMode === 'route' ? routeEditorSimplify(routeEditorPoints) : routeEditorPoints;
  routeEditorOutput.value = points.map(([x, y]) =>
    `[${(x / 805).toFixed(4)}, ${(y / 851).toFixed(4)}${routeEditorClearance === 2 ? '' : `, ${routeEditorClearance}`}]`
  ).join(',\n');
  const landPoints = routeEditorPoints.filter(([x, y]) =>
    waterPixels && !hasWaterClearance(Math.round(x), Math.round(y), routeEditorClearance)
  ).length;
  routeEditorStatus.textContent = !points.length
    ? routeEditorMode === 'route' ? 'Piirrä kartalle kilpailusuuntaan.' : 'Merkitse mökkipaikat kartalle.'
    : routeEditorMode === 'route'
      ? `${points.length} reittipistettä · ${landPoints ? `${landPoints} piirrospistettä liian lähellä maata` : 'koko piirros vesialueella'}`
      : `${points.length} mökkipaikka${points.length === 1 ? '' : 'a'} merkitty`;
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
  if (routeEditorMode === 'route') {
    for (let i = 1; i < routeEditorPoints.length; i++) {
      const pair = [routeEditorPoints[i - 1], routeEditorPoints[i]],
        invalid = pair.some(([x, y]) => !hasWaterClearance(Math.round(x), Math.round(y), routeEditorClearance));
      drawLine(pair, invalid ? '#ff3048' : '#ffe040', 4);
    }
  } else {
    for (const [x, y] of routeEditorPoints) {
      const px = m.x + x / 805 * m.w, py = m.y + y / 851 * m.h;
      c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2);
      c.fillStyle = '#ffe040'; c.fill();
      c.strokeStyle = '#101830'; c.lineWidth = 2; c.stroke();
    }
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
    <span>Merkitse useita mökkipaikkoja napsauttamalla karttaa. Rulla zoomaa, oikea painike siirtää. Valkoinen viiva on nykyinen reitti.</span>
    <div><button type="button" data-mode="points" aria-pressed="true">Mökkipaikat</button><button type="button" data-mode="route" aria-pressed="false">Reitti</button></div>
    <label>Turvaväli <select data-action="clearance"><option value="2">Normaali · 2 px</option><option value="1">Kapea · 1 px</option><option value="0">Erittäin kapea · 0 px</option></select></label>
    <textarea aria-label="Piirretyt reittipisteet" readonly></textarea>
    <div><button type="button" data-action="zoom-out">−</button><button type="button" data-action="zoom-in">+</button><button type="button" data-action="fit">Sovita</button></div>
    <div><button type="button" data-action="copy">Kopioi pisteet</button><button type="button" data-action="clear">Tyhjennä</button></div>
    <output aria-live="polite"></output>`;
  panel.style.cssText = 'box-sizing:border-box;position:absolute;z-index:5;top:12px;right:12px;width:min(330px,calc(100% - 24px));display:grid;gap:8px;padding:12px;background:rgba(16,24,48,.94);border:2px solid #ffe56b;box-shadow:3px 3px #080f20;color:#fff8d8;font:12px "Courier New",monospace';
  lakeWrap.append(panel);
  routeEditorOutput = panel.querySelector('textarea');
  routeEditorStatus = panel.querySelector('output');
  routeEditorOutput.style.cssText = 'box-sizing:border-box;width:100%;height:110px;resize:vertical;background:#08142c;border:1px solid #92b2d8;color:#fff8d8;font:12px "Courier New",monospace';
  panel.querySelector('select').style.cssText = 'margin-left:8px;padding:4px;background:#08142c;border:1px solid #92b2d8;color:#fff8d8';
  routeEditorStatus.style.color = '#a9d8ff';
  panel.querySelectorAll('button').forEach(button => button.style.cssText = 'min-height:34px;padding:6px 10px;background:#c84038;border:2px solid #f8f0c0;color:white;font-weight:700;cursor:pointer');
  panel.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {
    routeEditorMode = button.dataset.mode;
    routeEditorPoints = [];
    panel.querySelectorAll('[data-mode]').forEach(option => {
      const selected = option === button;
      option.setAttribute('aria-pressed', selected);
      option.style.background = selected ? '#ffe56b' : '#283858';
      option.style.color = selected ? '#101830' : '#fff';
    });
    panel.querySelector('[data-action="clearance"]').closest('label').hidden = routeEditorMode === 'points';
    routeEditorUpdateOutput();
  });
  panel.querySelector('[data-mode="points"]').click();
  routeEditorUpdateOutput();
  panel.querySelector('[data-action="clear"]').onclick = () => {
    routeEditorPoints = [];
    routeEditorUpdateOutput();
  };
  panel.querySelector('[data-action="copy"]').onclick = async () => {
    if (!routeEditorOutput.value) return;
    await navigator.clipboard.writeText(routeEditorOutput.value);
    routeEditorStatus.textContent = 'Pisteet kopioitu leikepöydälle.';
  };
  panel.querySelector('[data-action="zoom-in"]').onclick = () => routeEditorSetZoom(routeEditorZoom * 1.5, canvas.clientWidth / 2, canvas.clientHeight / 2);
  panel.querySelector('[data-action="zoom-out"]').onclick = () => routeEditorSetZoom(routeEditorZoom / 1.5, canvas.clientWidth / 2, canvas.clientHeight / 2);
  panel.querySelector('[data-action="fit"]').onclick = routeEditorFit;
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
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (event.button !== 0) return;
    routeEditorDrawing = routeEditorMode === 'route';
    canvas.setPointerCapture(event.pointerId);
    routeEditorAddPoint(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (routeEditorPanning) {
      event.preventDefault(); event.stopImmediatePropagation();
      const m = routeEditorViewport(canvas.clientWidth, canvas.clientHeight), scale = m.w / 805;
      routeEditorCenter = [
        routeEditorPanStart[2] - (event.clientX - routeEditorPanStart[0]) / scale,
        routeEditorPanStart[3] - (event.clientY - routeEditorPanStart[1]) / scale
      ];
      return;
    }
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    routeEditorAddPoint(event);
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, event => {
    if (routeEditorPanning) {
      event.preventDefault(); event.stopImmediatePropagation();
      routeEditorPanning = false;
      return;
    }
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (routeEditorMode === 'route') routeEditorAddPoint(event);
    routeEditorDrawing = false;
  });
  addEventListener('keydown', event => {
    const editable = event.target?.closest?.('input,textarea,select,[contenteditable]');
    if (!editable && !event.ctrlKey && !event.metaKey && event.code !== 'F5') event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}
