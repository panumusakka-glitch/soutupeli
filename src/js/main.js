// Wire inputs only after every system and data file has loaded.
const developerMode = /(?:^|[?&])dev=1(?:&|$)/.test(globalThis.location?.search || '');
document.getElementById('totalDistance').textContent=(TOTAL/1000).toLocaleString('fi-FI');
renderProvisions();
materialSelect.add(new Option('Valitse materiaali…', ''));
Object.entries(materials).forEach(([id, m]) => materialSelect.add(new Option(`${m.name} · noin ${m.weight} kg`, id)));
provisionPackSelect.add(new Option('Valitse eväspaketti…', ''));
Object.entries(provisionPacks).filter(([id]) => id !== 'legacy').forEach(([id, pack]) => provisionPackSelect.add(new Option(pack.name, id)));
provisionPackSelect.value = 'athlete';
boatSelect.add(new Option('Valitse vene…', ''));
function populateBoats(preferredName) {
  boatSelect.innerHTML = '';
  boatSelect.add(new Option('Valitse vene…', ''));
  boats.forEach((b, i) => {
    if (raceType === 'church' ? b.churchOnly : usesKayak() ? b.canoeOnly : !b.churchOnly && !b.canoeOnly) boatSelect.add(new Option(`${boatDisplayName(b)} · ${materials[b.material].name}`, i));
  });
  const allowed = b => raceType === 'church' ? b.churchOnly : usesKayak() ? b.canoeOnly : !b.churchOnly && !b.canoeOnly;
  const preferredIndex = boats.findIndex(b => b.name === preferredName && allowed(b));
  const fallbackIndex = boats.findIndex(allowed);
  boatSelect.value = String(preferredIndex >= 0 ? preferredIndex : fallbackIndex);
}
populateBoats(DEFAULT_CREW.boat);
selectDefaultCrew();
document.getElementById('fullRace').onclick = () => setRaceLength('full');
document.getElementById('quickRace').onclick = () => setRaceLength('quick');
document.getElementById('maleRowers').onclick = () => { selectRowerGender('male'); if (isCrewRace()) populatePartnerRowers(); selectCrew(); };
document.getElementById('femaleRowers').onclick = () => { selectRowerGender('female'); selectCrew(); };
document.getElementById('mixedRowers').onclick = () => {
  if (raceType !== 'double') return;
  selectRowerGender('mixed');
  populatePartnerRowers();
  selectCrew();
};
document.getElementById('singleRace').onclick = () => { setRaceType('single'); showSelectionStep('single-start'); };
document.getElementById('doubleRace').onclick = () => { setRaceType('double'); showSelectionStep('double-start'); };
document.getElementById('alternatingRace').onclick = () => { setRaceType('alternating'); showSelectionStep('alternating-start'); };
document.getElementById('churchRace').onclick = () => { setRaceType('church'); showSelectionStep('church'); };
document.getElementById('canoeRace').hidden = true;
document.getElementById('canoeRace').disabled = true;
for (const [id, start] of [['churchThursdayTour', 'thursday'], ['churchFridayNight', 'night'], ['churchSaturday', 'saturday']]) {
  document.getElementById(id).onclick = () => { setChurchStart(start); selectCrew(); showSelectionStep(1); };
}
document.getElementById('churchStartBack').onclick = () => showSelectionStep(isChurchRace() ? 'church' : raceType === 'alternating' ? 'alternating-start' : raceType === 'double' ? 'double-start' : 'single-start');
for (const [id, start] of [['singleThursdayTour', 'thursday'], ['singleSaturday', 'saturday']]) {
  document.getElementById(id).onclick = () => {
    setSingleStart(start);
    const preferredRower = start === 'saturday' ? rowers.findIndex(candidate => candidate.name === DEFAULT_CREW.rower) : undefined;
    selectRowerGender('male', preferredRower);
    selectCrew();
    showSelectionStep(1);
  };
}
for (const [id, start] of [['alternatingThursdayTour', 'thursday'], ['alternatingSaturday', 'saturday']]) {
  document.getElementById(id).onclick = () => { setAlternatingStart(start); selectRowerGender('male'); populatePartnerRowers(); selectCrew(); showSelectionStep(1); };
}
for (const [id, start] of [['doubleThursdayTour', 'thursday'], ['doubleSaturday', 'saturday']]) {
  document.getElementById(id).onclick = () => { setDoubleStart(start); selectRowerGender('male'); populatePartnerRowers(); selectCrew(); showSelectionStep(1); };
}
function syncRowerSelection() {
  const previousPartner = partnerRowerSelect.value === '' ? -1 : Number(partnerRowerSelect.value);
  if (isCrewRace()) populatePartnerRowers(previousPartner);
  selectCrew();
}
rowerSelect.oninput = rowerSelect.onchange = syncRowerSelection;
partnerRowerSelect.onchange = boatSelect.onchange = materialSelect.onchange = provisionPackSelect.onchange = selectCrew;
document.getElementById('rowerNext').onclick = () => {
  if (rowerSelect.value !== '') showSelectionStep(2);
};
document.getElementById('boatNext').onclick = () => {
  if (boatSelect.value !== '') showSelectionStep(3);
};
document.querySelectorAll('.selection-back').forEach(button => {
  button.onclick = () => showSelectionStep(Number(button.dataset.selectionTarget));
});
document.getElementById('power').addEventListener('input', e => {
  strokePower = Number.isFinite(rower.racePower)
    ? rower.racePower
    : clamp(Number(e.target.value), 30, 110);
  updateUI();
});
ui.leaderboardToggle.onclick = () => setLeaderboardExpanded(!leaderboardExpanded);
addEventListener('resize', resize);
resize();
document.querySelectorAll('.provision').forEach(b => b.addEventListener('click', () => consume(b.dataset.item)));
provisionsToggle.onclick = () => setProvisions(provisionsToggle.getAttribute('aria-expanded') !== 'true');
document.getElementById('closeProvisions').onclick = () => {
  setProvisions(false);
  provisionsToggle.focus();
};
addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    setProvisions(false);
    setLeaderboardExpanded(false);
  }
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
const previewButton = document.getElementById('previewButton');
previewButton.hidden = !developerMode;
if (developerMode) previewButton.onclick = startPreview;
document.getElementById('previewTimeline').addEventListener('input', event => {
  seekPreview(Number(event.target.value) / 1000);
});
document.getElementById('previewSpeed').addEventListener('change', event => {
  if (!previewPaused) previewPlaybackRate = Number(event.target.value);
});
document.getElementById('previewPause').onclick = () => setPreviewPaused(!previewPaused);
document.getElementById('startOverlay').addEventListener('pointerdown', () => rowingAudio.startMenuMusic(), {once: true});
addEventListener('keydown', () => rowingAudio.startMenuMusic(), {once: true});
document.getElementById('followRaceButton').onclick = followRace;
document.getElementById('finishDetailsButton').onclick = () => {
  const details = document.getElementById('finishDetails');
  const button = document.getElementById('finishDetailsButton');
  details.hidden = !details.hidden;
  button.setAttribute('aria-expanded', String(!details.hidden));
  button.textContent = details.hidden ? 'Oman suorituksen tiedot' : 'Piilota suorituksen tiedot';
};
document.getElementById('creditsButton').onclick = () => {
  ui.finish.classList.add('hidden');
  document.getElementById('creditsOverlay').classList.remove('hidden');
  document.body.classList.add('credits-mode', 'start-menu');
  rowingAudio.startMenuMusic();
};
document.getElementById('resetButton').onclick = pauseRace;
mapImage.onload = cleanMapImage.onload = prepareMap;
mapImage.src = 'partalansaari-map.png';
cleanMapImage.src = 'map-marker-cleanup.png';
mapToggle.onclick = () => setMapOverview(!mapOverview);
document.getElementById('continueMenuButton').onclick = () => showSaveSlots('continue');
document.getElementById('newGameMenuButton').onclick = () => showSaveSlots('new');
document.getElementById('saveSlotBack').onclick = showSavedRace;
document.getElementById('changeSaveSlot').onclick = () => {
  document.getElementById('selectionPanel').hidden = true;
  document.getElementById('startInstructions').hidden = true;
  document.getElementById('saveStatus').hidden = true;
  document.getElementById('startButton').hidden = true;
  document.getElementById('resumePanel').hidden = false;
  showSaveSlots('new');
};
document.getElementById('saveSlots').onclick = event => {
  const button = event.target.closest('.save-slot');
  if (button && !button.disabled) chooseSaveSlot(button.dataset.mode, Number(button.dataset.slot));
};
document.getElementById('continueButton').onclick = resumePausedRace;
document.getElementById('withdrawButton').onclick = () => {
  if (confirm('Keskeytetäänkö soutu? Valvontavene noutaa sinut, eikä suoritusta voi jatkaa.')) withdrawRace('Keskeytit suorituksen omasta pyynnöstäsi. Valvontavene noutaa sinut turvallisesti.', false);
};
document.getElementById('crewMenuButton').onclick = () => {
  reset();
  selectDefaultCrew();
  showSavedRace();
};
addEventListener('pagehide', pauseRace);
function loop(now) {
  const realDt = Math.max(0, Math.min(.04, (now - last) / 1000));
  last = now;
  if (previewMode && !previewPaused && now - previewLastStroke >= targetStrokeCycle() * 1000) {
    previewLastStroke = now;
    strokeTimes.push(now);
    strokeTimes = strokeTimes.filter(time => now - time < 15000);
    quality = .92;
    strokePulse = .5;
  }
  const dt = realDt * (previewMode ? previewPlaybackRate : raceTimeMultiplier());
  if (document.hidden) pauseRace();
  update(dt, now);
  if (running && !previewMode && now - lastSaveAt >= 5000) saveRace();
  draw(previewMode && previewPaused ? previewPausedAt : now);
}
selectCrew();
requestAnimationFrame(loop);
reset();
showSavedRace();
