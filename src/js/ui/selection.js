const rowerSelect = document.getElementById('rowerSelect'),
  partnerRowerSelect = document.getElementById('partnerRowerSelect'),
  boatSelect = document.getElementById('boatSelect'),
  materialSelect = document.getElementById('materialSelect'),
  provisionPackSelect = document.getElementById('provisionPackSelect');
let selectedRowerGender = 'male',
  lastSingleRowerIndex = rowers.findIndex(candidate => candidate.name === DEFAULT_CREW.rower);
function selectableRowers() {
  return raceType === 'double'
    ? rowers.filter(candidate => doubleRowerNames.includes(candidate.name))
    : rowers.filter(candidate => !candidate.doubleOnly);
}
function crewName() {
  return raceType === 'double' && partnerRower ? `${rower.name} & ${partnerRower.name}` : rower.name;
}
function crewCategory() {
  if (raceType !== 'double' || !partnerRower) return rower.voiceGender;
  return rower.voiceGender === partnerRower.voiceGender ? rower.voiceGender : 'mixed';
}
function crewStat(key, fallbackRower = rower) {
  if (raceType !== 'double' || !partnerRower || fallbackRower !== rower) return fallbackRower[key];
  return (rower[key] + partnerRower[key]) / 2;
}
function populatePartnerRowers(preferredIndex) {
  partnerRowerSelect.innerHTML = '';
  partnerRowerSelect.add(new Option('Valitse pari…', ''));
  selectableRowers().forEach(candidate => {
    const index = rowers.indexOf(candidate);
    if (String(index) !== rowerSelect.value) partnerRowerSelect.add(new Option(candidate.name, index));
  });
  const fallback = selectableRowers().find(candidate => String(rowers.indexOf(candidate)) !== rowerSelect.value);
  const fallbackIndex = rowers.indexOf(fallback);
  const selectedIndex = doubleRowerNames.includes(rowers[preferredIndex]?.name) && String(preferredIndex) !== rowerSelect.value ? preferredIndex : fallbackIndex;
  partnerRowerSelect.value = selectedIndex >= 0 ? String(selectedIndex) : '';
}
function setRaceType(type, preferredPartnerIndex) {
  const previousRowerIndex = rowerSelect.value === '' ? -1 : Number(rowerSelect.value);
  if (raceType === 'single' && !rowers[previousRowerIndex]?.doubleOnly) lastSingleRowerIndex = previousRowerIndex;
  raceType = type === 'double' ? 'double' : 'single';
  document.getElementById('partnerRowerField').hidden = raceType !== 'double';
  document.getElementById('singleRace').classList.toggle('active', raceType === 'single');
  document.getElementById('doubleRace').classList.toggle('active', raceType === 'double');
  document.getElementById('singleRace').setAttribute('aria-pressed', String(raceType === 'single'));
  document.getElementById('doubleRace').setAttribute('aria-pressed', String(raceType === 'double'));
  document.getElementById('raceTypeHeading').textContent = `SULKAVAN SUURSOUTU / ${raceType === 'double' ? 'PARISOUTU' : 'YKSINSOUTU'}`;
  document.getElementById('raceTypeInfo').textContent = raceType === 'double'
    ? 'Parisoutu lähtee ensin. Yksinsoutajat lähtevät 20 minuuttia myöhemmin.'
    : 'Yksinsoutu lähtee 20 minuuttia parisoudun jälkeen.';
  selectRowerGender(raceType === 'double' ? 'male' : selectedRowerGender, raceType === 'double' ? previousRowerIndex : lastSingleRowerIndex);
  document.getElementById('femaleRowers').disabled = raceType === 'double';
  if (raceType === 'double') populatePartnerRowers(preferredPartnerIndex);
  else partnerRower = null;
  selectCrew();
}
function selectRowerGender(gender, preferredIndex) {
  selectedRowerGender = raceType !== 'double' && gender === 'female' ? 'female' : 'male';
  rowerSelect.innerHTML = '';
  rowerSelect.add(new Option('Valitse soutaja…', ''));
  selectableRowers().forEach(candidate => {
    const index = rowers.indexOf(candidate);
    if (candidate.voiceGender === selectedRowerGender) rowerSelect.add(new Option(candidate.name, index));
  });
  const fallback = selectableRowers().find(candidate => candidate.voiceGender === selectedRowerGender);
  const fallbackIndex = rowers.indexOf(fallback);
  const selectedIndex = selectableRowers().includes(rowers[preferredIndex]) && rowers[preferredIndex]?.voiceGender === selectedRowerGender ? preferredIndex : fallbackIndex;
  rowerSelect.value = selectedIndex >= 0 ? String(selectedIndex) : '';
  for (const [id, value] of [['maleRowers', 'male'], ['femaleRowers', 'female']]) {
    const button = document.getElementById(id), active = value === selectedRowerGender;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}
function selectCrew() {
  if (running) return;
  const hasRower = rowerSelect.value !== '';
  const hasBoat = boatSelect.value !== '';
  if (hasRower) rower = rowers[Number(rowerSelect.value)];
  if (hasRower && raceType === 'single') lastSingleRowerIndex = Number(rowerSelect.value);
  if (raceType === 'double') {
    const previousPartner = partnerRowerSelect.value === '' ? -1 : Number(partnerRowerSelect.value);
    if (String(previousPartner) === rowerSelect.value || !rowers[previousPartner]) populatePartnerRowers();
    partnerRower = rowers[Number(partnerRowerSelect.value)] || null;
  } else partnerRower = null;
  const hasCrew = hasRower && (raceType === 'single' || (partnerRower && partnerRower !== rower));
  const seppoPackageOnly = hasCrew && [rower, partnerRower].some(candidate => candidate?.name === 'Seppo Räty');
  if (seppoPackageOnly) provisionPackSelect.value = 'fun';
  provisionPackSelect.disabled = seppoPackageOnly;
  if (hasRower && Number.isFinite(rower.racePower)) strokePower = rower.racePower;
  ui.power.disabled = hasRower && Number.isFinite(rower.racePower);
  if (hasBoat) selectedBoat = boats[Number(boatSelect.value)];
  if (hasBoat) materialSelect.value = selectedBoat.material;
  material = materialSelect.value;
  selectedProvisionPack = provisionPackSelect.value;
  if (hasRower) updatePortrait();
  if (hasRower) document.getElementById('routeRecord').textContent = routeRecordLabel(crewCategory(), raceType);
  document.getElementById('rowerPortrait').parentElement.hidden = !hasRower;
  const labels = [['power', 'Voima'], ['speed', 'Nopeus'], ['endurance', 'Kestävyys'], ['skill', 'Taito'], ['cramp', 'Kramppiherkkyys'], ['hands', 'Käsien kovuus'], ['stomach', 'Vatsan toiminta']];
  document.getElementById('rowerStats').innerHTML = hasRower ? labels.map(([key, label]) => `<div class="stat ${key === 'cramp' ? 'bad' : ''}">${raceType === 'double' ? `Miehistön ${label.toLowerCase()}` : label}<b>${Math.round(crewStat(key))} / 99</b>${key === 'hands' && rower.blisterImmune && (raceType !== 'double' || partnerRower?.blisterImmune) ? '<small>Ei rakkoja</small>' : ''}</div>`).join('') : '';
  document.getElementById('boatStats').innerHTML = hasBoat ? [['Runkonopeus', selectedBoat.hull], ['Vastatuuli', selectedBoat.headwind], ['Vakaus', selectedBoat.stability]].map(([label, value]) => `<div class="stat">${label}<b>${value} / 5</b></div>`).join('') : '';
  document.getElementById('materialStats').textContent = material ? `Paino noin ${boatWeight()} kg. ${selectedBoat.spruceOnly ? 'Saatavana vain kuusivanerisena. ' : ''}${materials[material].name}: ${materials[material].description}${isGoldenBoat() ? ' Kultainen erikoisvene.' : ''}` : '';
  document.getElementById('provisionPackStats').textContent = selectedProvisionPack
    ? provisionPacks[selectedProvisionPack].description
    : 'Valitse soutuun mukaan otettavat eväät.';
  document.getElementById('rowerNext').textContent = raceType === 'double' && hasCrew ? `Valitse miehistö: ${crewName()}` : hasRower ? `Valitse soutajaksi ${rower.name}` : 'Valitse soutaja';
  document.getElementById('boatNext').textContent = hasBoat ? `Valitse veneeksi ${selectedBoat.name} · ${materials[selectedBoat.material].name}` : 'Valitse vene';
  document.getElementById('startButton').disabled = !(hasCrew && hasBoat && material && selectedProvisionPack);
  document.getElementById('crewLabel').textContent = hasCrew && hasBoat && material && selectedProvisionPack ? `${crewName()} · ${selectedBoat.name} · ${materials[material].name} · ${provisionPacks[selectedProvisionPack].name}` : '';
  if (!running && hasRower && hasBoat && material && typeof resetBotRacers === 'function') resetBotRacers();
}
const selectionTitles = ['Valitse soutaja', 'Valitse vene', 'Valitse eväspaketti'];
function showSelectionStep(step) {
  const currentStep = Math.max(1, Math.min(3, step));
  document.querySelectorAll('.selection-step').forEach(section => {
    section.hidden = Number(section.dataset.selectionStep) !== currentStep;
  });
  document.getElementById('selectionProgress').textContent = `VAIHE ${currentStep} / 3`;
  document.getElementById('selectionTitle').textContent = selectionTitles[currentStep - 1];
  document.getElementById('startButton').hidden = currentStep !== 3;
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
  const defaultRowerIndex = rowers.findIndex(r => r.name === DEFAULT_CREW.rower);
  selectRowerGender(rowers[defaultRowerIndex]?.voiceGender, defaultRowerIndex);
  boatSelect.value = String(boats.findIndex(b => b.name === DEFAULT_CREW.boat));
  materialSelect.value = DEFAULT_CREW.material;
  setRaceType('single');
  selectCrew();
}
