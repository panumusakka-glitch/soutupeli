// The explicit query flag is the safety boundary. This also supports IDE preview
// servers, LAN addresses and direct file previews whose hostname is not localhost.
const routeEditorEnabled = /(?:^|[?&])routeEditor=1(?:&|$)/.test(location.search);

let routeEditorPoints = [],
  routeEditorDrawing = false,
  routeEditorOutput,
  routeEditorStatus;

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

function routeEditorSimplify(points, tolerance = 3) {
  if (points.length < 3) return points.slice();
  let furthest = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = routeEditorDistanceToSegment(points[i], points[0], points.at(-1));
    if (distance > furthest) { furthest = distance; index = i; }
  }
  if (furthest <= tolerance) return [points[0], points.at(-1)];
  return [
    ...routeEditorSimplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...routeEditorSimplify(points.slice(index), tolerance)
  ];
}

function routeEditorUpdateOutput() {
  if (!routeEditorOutput) return;
  const points = routeEditorSimplify(routeEditorPoints);
  routeEditorOutput.value = points.map(([x, y]) =>
    `[${(x / 805).toFixed(4)}, ${(y / 851).toFixed(4)}]`
  ).join(',\n');
  const landPoints = routeEditorPoints.filter(([x, y]) =>
    waterPixels && !hasWaterClearance(Math.round(x), Math.round(y), 2)
  ).length;
  routeEditorStatus.textContent = !points.length
    ? 'Piirrä kartalle kilpailusuuntaan.'
    : `${points.length} reittipistettä · ${landPoints ? `${landPoints} piirrospistettä liian lähellä maata` : 'koko piirros vesialueella'}`;
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
  for (let i = 1; i < routeEditorPoints.length; i++) {
    const pair = [routeEditorPoints[i - 1], routeEditorPoints[i]],
      invalid = pair.some(([x, y]) => !hasWaterClearance(Math.round(x), Math.round(y), 2));
    drawLine(pair, invalid ? '#ff3048' : '#ffe040', 4);
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
    <strong>REITTIEDITORI</strong>
    <span>Piirrä hiirellä tai sormella lisättävä osuus kilpailusuuntaan. Valkoinen viiva on nykyinen reitti.</span>
    <textarea aria-label="Piirretyt reittipisteet" readonly></textarea>
    <div><button type="button" data-action="copy">Kopioi pisteet</button><button type="button" data-action="clear">Tyhjennä</button></div>
    <output aria-live="polite"></output>`;
  panel.style.cssText = 'box-sizing:border-box;position:absolute;z-index:5;top:12px;right:12px;width:min(330px,calc(100% - 24px));display:grid;gap:8px;padding:12px;background:rgba(16,24,48,.94);border:2px solid #ffe56b;box-shadow:3px 3px #080f20;color:#fff8d8;font:12px "Courier New",monospace';
  lakeWrap.append(panel);
  routeEditorOutput = panel.querySelector('textarea');
  routeEditorStatus = panel.querySelector('output');
  routeEditorOutput.style.cssText = 'box-sizing:border-box;width:100%;height:110px;resize:vertical;background:#08142c;border:1px solid #92b2d8;color:#fff8d8;font:12px "Courier New",monospace';
  routeEditorStatus.style.color = '#a9d8ff';
  panel.querySelectorAll('button').forEach(button => button.style.cssText = 'min-height:34px;padding:6px 10px;background:#c84038;border:2px solid #f8f0c0;color:white;font-weight:700;cursor:pointer');
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
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    routeEditorDrawing = true;
    canvas.setPointerCapture(event.pointerId);
    routeEditorAddPoint(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    routeEditorAddPoint(event);
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, event => {
    if (!routeEditorDrawing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    routeEditorAddPoint(event);
    routeEditorDrawing = false;
  });
  addEventListener('keydown', event => {
    if (event.code === 'Space') { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
}
