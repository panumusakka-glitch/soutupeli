// Wire inputs only after every system and data file has loaded.
document.getElementById('totalDistance').textContent=(TOTAL/1000).toLocaleString('fi-FI');
renderProvisions();
materialSelect.add(new Option('Valitse materiaali…', ''));
Object.entries(materials).forEach(([id, m]) => materialSelect.add(new Option(`${m.name} · noin ${m.weight} kg`, id)));
rowerSelect.add(new Option('Valitse soutaja…', ''));
boatSelect.add(new Option('Valitse vene…', ''));
rowers.forEach((r, i) => rowerSelect.add(new Option(r.name, i)));
boats.forEach((b, i) => boatSelect.add(new Option(b.name, i)));
selectDefaultCrew();
rowerSelect.onchange = boatSelect.onchange = materialSelect.onchange = selectCrew;
addEventListener('resize', resize);
resize();
document.querySelectorAll('.provision').forEach(b => b.addEventListener('click', () => consume(b.dataset.item)));
provisionsToggle.onclick = () => setProvisions(provisionsToggle.getAttribute('aria-expanded') !== 'true');
document.getElementById('closeProvisions').onclick = () => {
  setProvisions(false);
  provisionsToggle.focus();
};
addEventListener('keydown', e => {
  if (e.code === 'Escape') setProvisions(false);
});
rowButton.addEventListener('pointerdown', down);
rowButton.addEventListener('pointerup', up);
rowButton.addEventListener('pointercancel', cancelStroke);
rowButton.addEventListener('lostpointercapture', cancelStroke);
['contextmenu', 'selectstart', 'dragstart'].forEach(type => rowButton.addEventListener(type, e => e.preventDefault()));
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
addEventListener('keydown', down);
addEventListener('keyup', up);
canvas.addEventListener('pointerdown', down);
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', cancelStroke);
canvas.addEventListener('lostpointercapture', cancelStroke);
addEventListener('blur', () => cancelStroke());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseRace();
});
['contextmenu', 'selectstart', 'dragstart'].forEach(type => canvas.addEventListener(type, e => e.preventDefault()));
document.getElementById('startButton').onclick = start;
document.getElementById('againButton').onclick = start;
document.getElementById('resetButton').onclick = pauseRace;
mapImage.onload = cleanMapImage.onload = prepareMap;
mapImage.src = 'partalansaari-map.png';
cleanMapImage.src = 'map-marker-cleanup.png';
mapToggle.onclick = () => setMapOverview(!mapOverview);
document.getElementById('resumeButton').onclick = resumeRace;
document.getElementById('continueButton').onclick = resumeRace;
document.getElementById('crewMenuButton').onclick = () => {
  reset();
  selectDefaultCrew();
  showSavedRace();
};
addEventListener('pagehide', pauseRace);
function loop(now) {
  const dt = Math.max(0, Math.min(.04, (now - last) / 1000));
  last = now;
  if (document.hidden) pauseRace();
  update(dt, now);
  if (running && now - lastSaveAt >= 5000) saveRace();
  draw(now);
}
selectCrew();
requestAnimationFrame(loop);
reset();
showSavedRace();
