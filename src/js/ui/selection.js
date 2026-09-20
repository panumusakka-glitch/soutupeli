const rowerSelect = document.getElementById('rowerSelect'),
  partnerRowerSelect = document.getElementById('partnerRowerSelect'),
  boatSelect = document.getElementById('boatSelect'),
  materialSelect = document.getElementById('materialSelect'),
  provisionPackSelect = document.getElementById('provisionPackSelect');
let selectedRowerGender = 'male',
  lastSingleRowerIndex = rowers.findIndex(candidate => candidate.name === DEFAULT_CREW.rower);
function isCrewRace() {
  return raceType === 'double' || raceType === 'alternating';
}
function isChurchRace() {
  return raceType === 'church';
}
function usesKayak(candidate = rower) {
  return raceType === 'canoe' || raceType === 'single' && singleStart === 'thursday' && !!candidate?.canoeOnly;
}
function boatDisplayName(boat) {
  return boat.label || boat.name;
}
function isTourRace() {
  return raceType === 'canoe' ||
    raceType === 'single' && singleStart === 'thursday' ||
    raceType === 'alternating' && alternatingStart === 'thursday' ||
    raceType === 'double' && doubleStart === 'thursday' ||
    raceType === 'church' && churchStart === 'thursday';
}
function raceUsesReverseRoute() {
  return isTourRace() || raceType === 'church' && churchStart === 'night';
}
function setRaceLength(value) {
  raceLength = ['five', 'twenty'].includes(value) ? value : 'full';
  for (const [id, mode] of [['fiveMinuteRace', 'five'], ['twentyMinuteRace', 'twenty'], ['fullRace', 'full']]) {
    const button = document.getElementById(id), active = raceLength === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (!running) resetBotRacers();
  selectCrew();
}
function updateRouteDirectionCopy() {
  const reverse = raceUsesReverseRoute();
  document.getElementById('startLocation').textContent = reverse
    ? 'Lähtö Soutustadionilta.'
    : 'Lähtö Hakovirran sillalta.';
  document.getElementById('startButton').textContent = reverse ? 'Lähde Soutustadionilta' : 'Lähde Hakovirralta';
}
function churchStartDescription() {
  if (churchStart === 'thursday') return 'Torstain retkisoutu on kiireetön yhteislähtö Partalansaaren ympäri.';
  if (churchStart === 'night') return 'Perjantain yösoutu alkaa klo 21. Illan hämärä syvenee soudun aikana.';
  return 'Lauantain SM-lähdössä koko miehistö soutaa samaan tahtiin perämiehen ohjauksessa.';
}
function setChurchStart(value) {
  churchStart = ['thursday', 'night'].includes(value) ? value : 'saturday';
  for (const [id, start] of [['churchThursdayTour', 'thursday'], ['churchFridayNight', 'night'], ['churchSaturday', 'saturday']]) {
    const button = document.getElementById(id), active = churchStart === start;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (isChurchRace()) document.getElementById('raceTypeInfo').textContent = churchStartDescription();
  if (isChurchRace()) selectRowerGender('mixed', rowers.indexOf(rower));
  updateRouteDirectionCopy();
}
function setSingleStart(value) {
  singleStart = value === 'thursday' ? 'thursday' : 'saturday';
  for (const [id, start] of [['singleThursdayTour', 'thursday'], ['singleSaturday', 'saturday']]) {
    const button = document.getElementById(id), active = singleStart === start;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (raceType === 'single') document.getElementById('raceTypeInfo').textContent = singleStart === 'thursday'
    ? 'Torstain yksinsoudun retkisoutu kiertää Partalansaaren ilman kilpailulähtöä.'
    : 'Yksinsoutu lähtee 20 minuuttia parisoudun ja 10 minuuttia vuorosoudun jälkeen.';
  updateRouteDirectionCopy();
}
function setAlternatingStart(value) {
  alternatingStart = value === 'thursday' ? 'thursday' : 'saturday';
  for (const [id, start] of [['alternatingThursdayTour', 'thursday'], ['alternatingSaturday', 'saturday']]) {
    const button = document.getElementById(id), active = alternatingStart === start;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (raceType === 'alternating') document.getElementById('raceTypeInfo').textContent = alternatingStart === 'thursday'
    ? 'Torstain vuorosoudun retkisoudussa toinen soutaa ja perällä oleva meloo.'
    : 'Vuorosoudussa toinen soutaa ja perällä oleva meloo. Yksinsoutajat lähtevät 10 minuuttia myöhemmin.';
  updateRouteDirectionCopy();
}
function setDoubleStart(value) {
  doubleStart = value === 'thursday' ? 'thursday' : 'saturday';
  for (const [id, start] of [['doubleThursdayTour', 'thursday'], ['doubleSaturday', 'saturday']]) {
    const button = document.getElementById(id), active = doubleStart === start;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (raceType === 'double') document.getElementById('raceTypeInfo').textContent = doubleStart === 'thursday'
    ? 'Torstain parisoudun retkisoutu kiertää Partalansaaren ilman kilpailulähtöä.'
    : 'Parisoutu lähtee ensin. Yksinsoutajat lähtevät 20 minuuttia myöhemmin.';
  updateRouteDirectionCopy();
}
function singleRowersForStart(start = singleStart) {
  if (start === 'thursday') return [...['Ari Kankkunen', 'Tuomo Korkolainen', 'Risto Jussila', 'Ari Luoto', 'Juha Hanni']
    .map(name => rowers.find(candidate => candidate.name === name)), ...canoeRowers];
  return rowers.filter(candidate => !candidate.doubleOnly && !candidate.churchOnly && !candidate.singleTourOnly && !candidate.hidden);
}
function selectableRowers() {
  if (isChurchRace()) return churchCrewsForStart();
  if (raceType === 'canoe') return canoeRowers;
  if (raceType === 'single') return singleRowersForStart();
  if (raceType === 'alternating' && alternatingStart === 'thursday') return alternatingTourCrews
    .map(crew => rowers.find(candidate => candidate.name === crew.rowers[0]));
  if (raceType === 'double' && doubleStart === 'thursday') return doubleTourCrews
    .map(crew => rowers.find(candidate => candidate.name === crew.rowers[0]));
  return crewsForRaceType(raceType)
    .filter(crew => doubleCrewCategory(crew) === selectedRowerGender)
    .map(crew => rowers.find(candidate => candidate.name === crew.rowers[0]));
}
function crewName() {
  if (isChurchRace()) return rower.name;
  return isCrewRace() && partnerRower ? `${rower.name} & ${partnerRower.name}` : rower.name;
}
function crewCategory() {
  if (!isCrewRace() || !partnerRower) return rower.voiceGender;
  return rower.voiceGender === partnerRower.voiceGender ? rower.voiceGender : 'mixed';
}
function crewStat(key, fallbackRower = rower) {
  if (!isCrewRace() || !partnerRower || fallbackRower !== rower) return fallbackRower[key];
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
  raceType = ['double', 'alternating', 'church', 'canoe'].includes(type) ? type : 'single';
  const crewRace = isCrewRace(), alternating = raceType === 'alternating';
  if (typeof populateBoats === 'function') populateBoats(selectedBoat?.name);
  document.getElementById('partnerRowerField').hidden = true;
  partnerRowerSelect.disabled = !crewRace;
  document.getElementById('rowerSelectLabel').textContent = isChurchRace() ? 'Miehistö' : raceType === 'canoe' ? 'Meloja' : crewRace ? `${alternating ? 'Vuoro' : 'Pari'}soutupari` : 'Soutaja';
  document.getElementById('selectionTitle').textContent = isChurchRace() ? 'Valitse kirkkovenemiehistö' : raceType === 'canoe' ? 'Valitse kanoottimeloja' : crewRace ? `Valitse ${alternating ? 'vuoro' : 'pari'}soutupari` : 'Valitse soutaja';
  document.getElementById('singleRace').classList.toggle('active', raceType === 'single');
  document.getElementById('doubleRace').classList.toggle('active', raceType === 'double');
  document.getElementById('alternatingRace').classList.toggle('active', alternating);
  document.getElementById('churchRace').classList.toggle('active', isChurchRace());
  document.getElementById('canoeRace').classList.toggle('active', raceType === 'canoe');
  document.getElementById('singleRace').setAttribute('aria-pressed', String(raceType === 'single'));
  document.getElementById('doubleRace').setAttribute('aria-pressed', String(raceType === 'double'));
  document.getElementById('alternatingRace').setAttribute('aria-pressed', String(alternating));
  document.getElementById('churchRace').setAttribute('aria-pressed', String(isChurchRace()));
  document.getElementById('canoeRace').setAttribute('aria-pressed', String(raceType === 'canoe'));
  document.getElementById('raceTypeHeading').textContent = `SULKAVAN SUURSOUTU / ${raceType === 'canoe' ? 'KANOOTTI' : isChurchRace() ? 'KIRKKOVENE' : alternating ? 'VUOROSOUTU' : raceType === 'double' ? 'PARISOUTU' : 'YKSINSOUTU'}`;
  document.getElementById('raceTypeInfo').textContent = raceType === 'canoe'
    ? 'Kanoottien retkisoudussa jokainen meloja kulkee omalla kanootillaan.'
    : isChurchRace()
    ? churchStartDescription()
    : alternating
    ? 'Vuorosoudussa toinen soutaa ja perällä oleva meloo. Yksinsoutajat lähtevät 10 minuuttia myöhemmin.'
    : raceType === 'double' ? 'Parisoutu lähtee ensin. Yksinsoutajat lähtevät 20 minuuttia myöhemmin.'
    : 'Yksinsoutu lähtee 20 minuuttia parisoudun ja 10 minuuttia vuorosoudun jälkeen.';
  selectRowerGender(crewRace ? 'male' : isChurchRace() ? 'mixed' : selectedRowerGender, crewRace ? previousRowerIndex : isChurchRace() ? -1 : lastSingleRowerIndex);
  const femaleRowers = document.getElementById('femaleRowers'),
    mixedRowers = document.getElementById('mixedRowers');
  document.querySelector('.rower-gender').hidden = isChurchRace();
  document.getElementById('churchStartBack').hidden = !(isChurchRace() || raceType === 'single' || isCrewRace());
  setChurchStart(churchStart);
  setSingleStart(singleStart);
  setAlternatingStart(alternatingStart);
  setDoubleStart(doubleStart);
  femaleRowers.hidden = crewRace;
  femaleRowers.disabled = crewRace || isChurchRace();
  mixedRowers.hidden = !crewRace || alternating;
  mixedRowers.disabled = !crewRace || alternating || isChurchRace();
  if (crewRace) populatePartnerRowers(preferredPartnerIndex);
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
  selectedRowerGender = isCrewRace()
    ? gender === 'mixed' ? 'mixed' : 'male'
    : isChurchRace() ? 'mixed' : gender === 'female' ? 'female' : 'male';
  rowerSelect.innerHTML = '';
  rowerSelect.add(new Option('Valitse soutaja…', ''));
  selectableRowers().forEach(candidate => {
    const index = rowers.indexOf(candidate);
    if (isCrewRace() || isChurchRace() || candidate.voiceGender === selectedRowerGender) {
      const label = isCrewRace() ? `${candidate.name} & ${doublePartnerName(candidate.name)}` : candidate.name;
      rowerSelect.add(new Option(label, index));
    }
  });
  const fallback = selectableRowers().find(candidate => isCrewRace() || candidate.voiceGender === selectedRowerGender);
  const fallbackIndex = rowers.indexOf(fallback);
  const selectedIndex = selectableRowers().includes(rowers[preferredIndex]) && (isCrewRace() || isChurchRace() || rowers[preferredIndex]?.voiceGender === selectedRowerGender) ? preferredIndex : fallbackIndex;
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
  const previouslyUsedKayak = usesKayak();
  if (hasRower) rower = rowers[Number(rowerSelect.value)];
  if (hasRower && previouslyUsedKayak !== usesKayak() && typeof populateBoats === 'function') populateBoats(selectedBoat?.name);
  const hasBoat = boatSelect.value !== '';
  if (hasRower && raceType === 'single') lastSingleRowerIndex = Number(rowerSelect.value);
  if (isCrewRace()) {
    const previousPartner = partnerRowerSelect.value === '' ? -1 : Number(partnerRowerSelect.value);
    if (String(previousPartner) === rowerSelect.value || !rowers[previousPartner]) populatePartnerRowers();
    partnerRower = rowers[Number(partnerRowerSelect.value)] || null;
  } else partnerRower = null;
  const hasCrew = hasRower && (['single', 'canoe'].includes(raceType) || isChurchRace() || (partnerRower && isCrewForRaceType(rower.name, partnerRower.name, raceType)));
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
  if (hasRower) document.getElementById('routeRecord').textContent = raceType === 'canoe' ? 'Kanoottien retkisoutu · Partalansaari' : routeRecordLabel(crewCategory(), raceType);
  document.getElementById('rowerProfile').hidden = !hasRower;
  const labels = [['power', 'Voima'], ['speed', 'Nopeus'], ['endurance', 'Kestävyys'], ['skill', 'Taito'], ['cramp', 'Kramppiherkkyys'], ['hands', 'Käsien kovuus'], ['stomach', 'Vatsan toiminta']];
  const rowerStats = document.getElementById('rowerStats');
  const statMarkup = candidate => labels.map(([key, label]) => `<div class="stat ${key === 'cramp' ? 'bad' : ''}">${label}<b>${candidate[key]} / 99</b>${key === 'hands' && candidate.blisterImmune ? '<small>Ei rakkoja</small>' : ''}</div>`).join('');
  rowerStats.className = isCrewRace() ? 'crew-stat-grids' : 'stat-grid';
  rowerStats.innerHTML = !hasRower ? '' : isCrewRace()
    ? [rower, partnerRower].map(candidate => `<section class="crew-rower-stats"><h3>${candidate.name}</h3><div class="stat-grid">${statMarkup(candidate)}</div></section>`).join('')
    : statMarkup(rower);
  document.getElementById('boatStats').innerHTML = hasBoat ? [['Runkonopeus', selectedBoat.hull], ['Vastatuuli', selectedBoat.headwind], ['Vakaus', selectedBoat.stability]].map(([label, value]) => `<div class="stat">${label}<b>${value} / 5</b></div>`).join('') : '';
  document.getElementById('materialStats').textContent = material ? `Paino noin ${boatWeight()} kg. ${selectedBoat.spruceOnly ? 'Saatavana vain kuusivanerisena. ' : ''}${materials[material].name}: ${materials[material].description}${isGoldenBoat() ? ' Kultainen erikoisvene.' : ''}` : '';
  document.getElementById('provisionPackStats').textContent = selectedProvisionPack
    ? provisionPacks[selectedProvisionPack].description
    : 'Valitse soutuun mukaan otettavat eväät.';
  document.getElementById('rowerNext').textContent = (isCrewRace() || isChurchRace()) && hasCrew ? `Valitse miehistö: ${crewName()}` : hasRower ? `Valitse soutajaksi ${rower.name}` : 'Valitse soutaja';
  document.getElementById('boatNext').textContent = hasBoat ? `Valitse veneeksi ${boatDisplayName(selectedBoat)} · ${materials[selectedBoat.material].name}` : 'Valitse vene';
  document.getElementById('startButton').disabled = !(hasCrew && hasBoat && material && selectedProvisionPack);
  document.getElementById('crewLabel').textContent = hasCrew && hasBoat && material && selectedProvisionPack ? `${crewName()} · ${boatDisplayName(selectedBoat)} · ${materials[material].name} · ${provisionPacks[selectedProvisionPack].name}` : '';
  if (!running && hasRower && hasBoat && material && typeof resetBotRacers === 'function') resetBotRacers();
}
const selectionTitles = ['Valitse soutaja', 'Valitse vene', 'Valitse eväspaketti'];
function showSelectionStep(step) {
  const churchStartStep = step === 'church';
  const singleStartStep = step === 'single-start';
  const alternatingStartStep = step === 'alternating-start';
  const doubleStartStep = step === 'double-start';
  const currentStep = churchStartStep ? 'church' : singleStartStep ? 'single-start' : alternatingStartStep ? 'alternating-start' : doubleStartStep ? 'double-start' : Math.max(1, Math.min(3, Number(step)));
  document.querySelectorAll('.selection-step').forEach(section => {
    section.hidden = section.dataset.selectionStep !== String(currentStep);
  });
  document.getElementById('churchStartField').hidden = !churchStartStep;
  document.getElementById('singleStartField').hidden = !singleStartStep;
  document.getElementById('alternatingStartField').hidden = !alternatingStartStep;
  document.getElementById('doubleStartField').hidden = !doubleStartStep;
  document.getElementById('selectionProgress').textContent = raceType === 'double'
    ? `VAIHE ${doubleStartStep ? 1 : currentStep + 1} / 4`
    : raceType === 'alternating'
    ? `VAIHE ${alternatingStartStep ? 1 : currentStep + 1} / 4`
    : raceType === 'single'
    ? `VAIHE ${singleStartStep ? 1 : currentStep + 1} / 4`
    : isChurchRace()
    ? `VAIHE ${churchStartStep ? 1 : currentStep + 1} / 4`
    : `VAIHE ${currentStep} / 3`;
  document.getElementById('selectionTitle').textContent = churchStartStep
    ? 'Valitse kirkkovenelähtö'
    : singleStartStep ? 'Valitse yksinsoudun lähtö'
    : alternatingStartStep ? 'Valitse vuorosoudun lähtö'
    : doubleStartStep ? 'Valitse parisoudun lähtö'
    : currentStep === 1 && isChurchRace() ? 'Valitse kirkkovenemiehistö'
    : currentStep === 1 && isCrewRace() ? `Valitse ${raceType === 'alternating' ? 'vuoro' : 'pari'}soutupari`
    : selectionTitles[currentStep - 1];
  document.getElementById('startButton').hidden = currentStep !== 3;
}
function updatePortrait() {
  const image = document.getElementById('rowerPortrait');
  const hasPortrait = !!portraitFiles[rower.name];
  image.style.clipPath = portraitMask() ? `polygon(${portraitMask().map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` : '';
  image.style.objectFit = '';
  image.style.objectPosition = '';
  image.hidden = !hasPortrait;
  image.alt = hasPortrait ? `${rower.name}, karikatyyri` : '';
  if (hasPortrait) image.src = portraitFiles[rower.name];else image.removeAttribute('src');
  const partnerImage = document.getElementById('partnerRowerPortrait');
  const hasPartnerPortrait = isCrewRace() && partnerRower && !!portraitFiles[partnerRower.name];
  const partnerMask = hasPartnerPortrait ? botPortraitMask(partnerRower.name) : null;
  partnerImage.style.clipPath = partnerMask ? `polygon(${partnerMask.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` : '';
  partnerImage.style.objectFit = '';
  partnerImage.style.objectPosition = '';
  partnerImage.hidden = !hasPartnerPortrait;
  partnerImage.alt = hasPartnerPortrait ? `${partnerRower.name}, karikatyyri` : '';
  if (hasPartnerPortrait) partnerImage.src = portraitFiles[partnerRower.name];else partnerImage.removeAttribute('src');
  document.getElementById('portraitName').textContent = crewName();
}

function selectDefaultCrew() {
  const defaultRowerIndex = rowers.findIndex(r => r.name === DEFAULT_CREW.rower);
  setRaceType('single');
  selectRowerGender(rowers[defaultRowerIndex]?.voiceGender, defaultRowerIndex);
  boatSelect.value = String(boats.findIndex(b => b.name === DEFAULT_CREW.boat));
  materialSelect.value = DEFAULT_CREW.material;
  selectCrew();
}
