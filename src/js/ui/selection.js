const rowerSelect = document.getElementById('rowerSelect'),
  partnerRowerSelect = document.getElementById('partnerRowerSelect'),
  boatSelect = document.getElementById('boatSelect'),
  materialSelect = document.getElementById('materialSelect'),
  provisionPackSelect = document.getElementById('provisionPackSelect');
let selectedRowerGender = 'male',
  lastSingleRowerIndex = rowers.findIndex(candidate => candidate.name === DEFAULT_CREW.rower);
function selectableRowers() {
  if (raceType !== 'double') return rowers.filter(candidate => !candidate.doubleOnly);
  return doubleCrews
    .filter(crew => doubleCrewCategory(crew) === selectedRowerGender)
    .map(crew => rowers.find(candidate => candidate.name === crew.rowers[0]));
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
  const partnerName = doublePartnerName(rowers[Number(rowerSelect.value)]?.name);
  const partnerIndex = rowers.findIndex(candidate => candidate.name === partnerName);
  if (partnerIndex >= 0) partnerRowerSelect.add(new Option(partnerName, partnerIndex));
  const selectedIndex = preferredIndex === partnerIndex ? preferredIndex : partnerIndex;
  partnerRowerSelect.value = selectedIndex >= 0 ? String(selectedIndex) : '';
}
function setRaceType(type, preferredPartnerIndex) {
  const previousRowerIndex = rowerSelect.value === '' ? -1 : Number(rowerSelect.value);
  if (raceType === 'single' && !rowers[previousRowerIndex]?.doubleOnly) lastSingleRowerIndex = previousRowerIndex;
  raceType = type === 'double' ? 'double' : 'single';
  document.getElementById('partnerRowerField').hidden = true;
  partnerRowerSelect.disabled = raceType !== 'double';
  document.getElementById('rowerSelectLabel').textContent = raceType === 'double' ? 'Parisoutupari' : 'Soutaja';
  document.getElementById('selectionTitle').textContent = raceType === 'double' ? 'Valitse parisoutupari' : 'Valitse soutaja';
  document.getElementById('singleRace').classList.toggle('active', raceType === 'single');
  document.getElementById('doubleRace').classList.toggle('active', raceType === 'double');
  document.getElementById('singleRace').setAttribute('aria-pressed', String(raceType === 'single'));
  document.getElementById('doubleRace').setAttribute('aria-pressed', String(raceType === 'double'));
  document.getElementById('raceTypeHeading').textContent = `SULKAVAN SUURSOUTU / ${raceType === 'double' ? 'PARISOUTU' : 'YKSINSOUTU'}`;
  document.getElementById('raceTypeInfo').textContent = raceType === 'double'
    ? 'Parisoutu lähtee ensin. Yksinsoutajat lähtevät 20 minuuttia myöhemmin.'
    : 'Yksinsoutu lähtee 20 minuuttia parisoudun jälkeen.';
  selectRowerGender(raceType === 'double' ? 'male' : selectedRowerGender, raceType === 'double' ? previousRowerIndex : lastSingleRowerIndex);
  const femaleRowers = document.getElementById('femaleRowers'),
    mixedRowers = document.getElementById('mixedRowers');
  femaleRowers.hidden = raceType === 'double';
  femaleRowers.disabled = raceType === 'double';
  mixedRowers.hidden = raceType !== 'double';
  mixedRowers.disabled = raceType !== 'double';
  if (raceType === 'double') populatePartnerRowers(preferredPartnerIndex);
  else {
    partnerRower = null;
    partnerRowerSelect.value = '';
    const partnerImage = document.getElementById('partnerRowerPortrait');
    partnerImage.hidden = true;
    partnerImage.removeAttribute('src');
    partnerImage.alt = '';
  }
  selectCrew();
}
function selectRowerGender(gender, preferredIndex) {
  selectedRowerGender = raceType === 'double'
    ? gender === 'mixed' ? 'mixed' : 'male'
    : gender === 'female' ? 'female' : 'male';
  rowerSelect.innerHTML = '';
  rowerSelect.add(new Option('Valitse soutaja…', ''));
  selectableRowers().forEach(candidate => {
    const index = rowers.indexOf(candidate);
    if (raceType === 'double' || candidate.voiceGender === selectedRowerGender) {
      const label = raceType === 'double' ? `${candidate.name} & ${doublePartnerName(candidate.name)}` : candidate.name;
      rowerSelect.add(new Option(label, index));
    }
  });
  const fallback = selectableRowers().find(candidate => raceType === 'double' || candidate.voiceGender === selectedRowerGender);
  const fallbackIndex = rowers.indexOf(fallback);
  const selectedIndex = selectableRowers().includes(rowers[preferredIndex]) && (raceType === 'double' || rowers[preferredIndex]?.voiceGender === selectedRowerGender) ? preferredIndex : fallbackIndex;
  rowerSelect.value = selectedIndex >= 0 ? String(selectedIndex) : '';
  for (const [id, value] of [['maleRowers', 'male'], ['femaleRowers', 'female'], ['mixedRowers', 'mixed']]) {
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
  const hasCrew = hasRower && (raceType === 'single' || (partnerRower && isDoubleCrew(rower.name, partnerRower.name)));
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
  document.getElementById('rowerProfile').hidden = !hasRower;
  const labels = [['power', 'Voima'], ['speed', 'Nopeus'], ['endurance', 'Kestävyys'], ['skill', 'Taito'], ['cramp', 'Kramppiherkkyys'], ['hands', 'Käsien kovuus'], ['stomach', 'Vatsan toiminta']];
  const rowerStats = document.getElementById('rowerStats');
  const statMarkup = candidate => labels.map(([key, label]) => `<div class="stat ${key === 'cramp' ? 'bad' : ''}">${label}<b>${candidate[key]} / 99</b>${key === 'hands' && candidate.blisterImmune ? '<small>Ei rakkoja</small>' : ''}</div>`).join('');
  rowerStats.className = raceType === 'double' ? 'crew-stat-grids' : 'stat-grid';
  rowerStats.innerHTML = !hasRower ? '' : raceType === 'double'
    ? [rower, partnerRower].map(candidate => `<section class="crew-rower-stats"><h3>${candidate.name}</h3><div class="stat-grid">${statMarkup(candidate)}</div></section>`).join('')
    : statMarkup(rower);
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
  document.getElementById('selectionTitle').textContent = currentStep === 1 && raceType === 'double' ? 'Valitse parisoutupari' : selectionTitles[currentStep - 1];
  document.getElementById('startButton').hidden = currentStep !== 3;
}
function updatePortrait() {
  const image = document.getElementById('rowerPortrait');
  const hasPortrait = !!portraitFiles[rower.name];
  image.style.clipPath = portraitMask() ? `polygon(${portraitMask().map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` : '';
  image.hidden = !hasPortrait;
  image.alt = hasPortrait ? `${rower.name}, karikatyyri` : '';
  if (hasPortrait) image.src = portraitFiles[rower.name];else image.removeAttribute('src');
  const partnerImage = document.getElementById('partnerRowerPortrait');
  const hasPartnerPortrait = raceType === 'double' && partnerRower && !!portraitFiles[partnerRower.name];
  const partnerMask = hasPartnerPortrait ? botPortraitMask(partnerRower.name) : null;
  partnerImage.style.clipPath = partnerMask ? `polygon(${partnerMask.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` : '';
  partnerImage.hidden = !hasPartnerPortrait;
  partnerImage.alt = hasPartnerPortrait ? `${partnerRower.name}, karikatyyri` : '';
  if (hasPartnerPortrait) partnerImage.src = portraitFiles[partnerRower.name];else partnerImage.removeAttribute('src');
  document.getElementById('portraitName').textContent = crewName();
}

function selectDefaultCrew() {
  const defaultRowerIndex = rowers.findIndex(r => r.name === DEFAULT_CREW.rower);
  selectRowerGender(rowers[defaultRowerIndex]?.voiceGender, defaultRowerIndex);
  boatSelect.value = String(boats.findIndex(b => b.name === DEFAULT_CREW.boat));
  materialSelect.value = DEFAULT_CREW.material;
  setRaceType('single');
  selectCrew();
}
