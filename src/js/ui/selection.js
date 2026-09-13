const rowerSelect = document.getElementById('rowerSelect'),
  boatSelect = document.getElementById('boatSelect'),
  materialSelect = document.getElementById('materialSelect');
function selectCrew() {
  if (running) return;
  const hasRower = rowerSelect.value !== '';
  const hasBoat = boatSelect.value !== '';
  if (hasRower) rower = rowers[Number(rowerSelect.value)];
  if (hasRower && Number.isFinite(rower.racePower)) strokePower = rower.racePower;
  ui.power.disabled = hasRower && Number.isFinite(rower.racePower);
  if (hasBoat) selectedBoat = boats[Number(boatSelect.value)];
  materialSelect.querySelector('[value=mahogany]').disabled = hasBoat && !!selectedBoat.spruceOnly;
  if (hasBoat && selectedBoat.spruceOnly && materialSelect.value === 'mahogany') materialSelect.value = '';
  material = materialSelect.value;
  if (hasRower) updatePortrait();
  document.getElementById('rowerPortrait').parentElement.hidden = !hasRower;
  const labels = [['speed', 'Nopeus'], ['endurance', 'Kestävyys'], ['skill', 'Taito'], ['cramp', 'Kramppiherkkyys'], ['hands', 'Käsien kovuus'], ['stomach', 'Vatsan toiminta']];
  if (rower.power !== 99) labels.unshift(['power', 'Voima']);
  document.getElementById('rowerStats').innerHTML = hasRower ? labels.map(([key, label]) => `<div class="stat ${key === 'cramp' ? 'bad' : ''}">${label}<b>${rower[key]} / 99</b>${key === 'hands' && rower.blisterImmune ? '<small>Ei rakkoja</small>' : ''}</div>`).join('') : '';
  document.getElementById('boatStats').innerHTML = hasBoat ? [['Runkonopeus', selectedBoat.hull], ['Vastatuuli', selectedBoat.headwind], ['Vakaus', selectedBoat.stability]].map(([label, value]) => `<div class="stat">${label}<b>${value} / 5</b></div>`).join('') : '';
  document.getElementById('materialStats').textContent = material ? `Paino noin ${boatWeight()} kg. ${selectedBoat.spruceOnly ? 'Saatavana vain kuusivanerisena. ' : ''}${materials[material].name}: ${materials[material].description}${isGoldenBoat() ? ' Kultainen erikoisvene.' : ''}` : '';
  document.getElementById('startButton').disabled = !(hasRower && hasBoat && material);
  document.getElementById('crewLabel').textContent = hasRower && hasBoat && material ? `${rower.name} · ${selectedBoat.name} · ${materials[material].name}` : '';
  if (!running && hasRower && hasBoat && material && typeof resetBotRacers === 'function') resetBotRacers();
}
function updatePortrait() {
  const image = document.getElementById('rowerPortrait');
  const hasPortrait = !!portraitFiles[rower.name];
  image.style.clipPath = portraitMask() ? `polygon(${portraitMask().map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` : '';
  image.hidden = !hasPortrait;
  image.alt = hasPortrait ? `${rower.name}, karikatyyri` : '';
  if (hasPortrait) image.src = portraitFiles[rower.name];else image.removeAttribute('src');
  document.getElementById('portraitName').textContent = rower.name;
}

function selectDefaultCrew() {
  rowerSelect.value = String(rowers.findIndex(r => r.name === DEFAULT_CREW.rower));
  boatSelect.value = String(boats.findIndex(b => b.name === DEFAULT_CREW.boat));
  materialSelect.value = DEFAULT_CREW.material;
  selectCrew();
}
