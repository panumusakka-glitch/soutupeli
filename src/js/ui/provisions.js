const intakeForms = {
  water: 'vett\u00e4', saltwater: 'suolavett\u00e4', sportsdrink: 'Hart Sportia', gel: 'Dexalia',
  juice: 'mustikkakeittoa', beer: 'Karhu-olutta', cola: 'sokerillista Coca-Colaa',
  candy: 'Fazer-hedelm\u00e4makeista', sausage: 'HK-Sinist\u00e4'
};
const drinkVerbs = ['Kittaa', 'Lipitt\u00e4\u00e4', 'H\u00f6rppii', 'Kaataa', 'Imee', 'Juo'];
const candyVerbs = ['Mutustaa', 'Ahmii', 'Pureskelee', 'Nautiskelee', 'Imeskelee'];
const sausageVerbs = ['M\u00e4ssytt\u00e4\u00e4', 'Ahmii', 'Hotkii', 'Kiskoo kitusiinsa', 'Mutustelee'];
function randomIntakeMessage(key, f) {
  const verbs = f.unit === 'drink' ? drinkVerbs : key === 'candy' ? candyVerbs : key === 'sausage' ? sausageVerbs : ['Mutustaa'];
  return `${verbs[Math.floor(Math.random() * verbs.length)]} ${intakeForms[key] || f.name}`;
}

function consume(key) {
  if (!running || !inventory[key]) return;
  const f = foods[key];
  if (raceElapsed < intakeUntil) {
    ui.lastIntake.textContent = `Niele ensin edellinen annos (${Math.ceil(intakeUntil - raceElapsed)} s).`;
    return;
  }
  const units = Math.min(f.servingUnits || 1, inventory[key]);
  const servingFluid = f.fluid * units;
  if (f.unit === 'drink' && gutFluid + servingFluid > 1.2) {
    ui.lastIntake.textContent = 'Vatsa on liian täynnä – odota nesteen imeytymistä.';
    return;
  }
  inventory[key] -= units;
  intakeStartedAt = raceElapsed;
  intakeUntil = raceElapsed + (f.duration || (f.unit === 'drink' ? 5 : 4));
  intakePowerFactor = f.rowingFactor || (f.unit === 'drink' ? .9 : .95);
  intakeKey = key;
  intakeMessage = randomIntakeMessage(key, f);
  const fastCarbs = Math.min((f.fastCarbs || 0) * units, Math.max(0, 45 - bloodCarbs));
  bloodCarbs += fastCarbs;
  gutCarbs += f.carbs * units - fastCarbs;
  gutFluid += servingFluid;
  gutSodium += f.sodium * units;
  gutFood += (f.mass || 0) * units;
  gutStress = clamp(gutStress + f.stress * units * (f.stackingStress ? 1 + gutStress / 55 : 1), 0, 100);
  if (f.digestion) digestionLoad = clamp(digestionLoad + f.digestion * units * (1 + digestionLoad / 70), 0, 100);
  if (f.alcohol) alcoholLoad = clamp(alcoholLoad + f.alcohol * units * (1 + alcoholLoad * .18), 0, 20);
  if (f.nicotine) nicotineLoad = clamp(nicotineLoad + f.nicotine * units * (1 + nicotineLoad * .22), 0, 20);
  const parts = [];
  if (f.carbs) parts.push(`${Math.round(f.carbs * units)} g hiilihydraattia`);
  if (f.fluid) parts.push(`${Math.round(servingFluid * 1000)} ml nestettä`);
  if (f.sodium) parts.push(`${f.sodium * units} mg natriumia`);
  if (f.stress) parts.push(`vatsarasitus +${f.stress * units}`);
  if (f.alcohol) parts.push('alkoholikuorma kasvaa');
  if (f.nicotine) parts.push('tupakkakuorma kasvaa');
  if (f.digestion) parts.push('hidas ruoansulatus');
  if (!parts.length) parts.push('ei ravintoarvoa');
  ui.lastIntake.textContent = `Nautitaan: ${f.name} · ${parts.join(' · ')} · ${Math.ceil(intakeUntil - raceElapsed)} s`;
  rowerChatter.intake(key, raceElapsed);
  updateInventory();
  saveRace();
}
function updateInventory() {
  updateIntakeProgress();
  document.querySelectorAll('.provision').forEach(b => {
    const key = b.dataset.item;
    const f = foods[key];
    b.hidden = !Object.hasOwn(provisionPacks[selectedProvisionPack]?.inventory || {}, key);
    b.disabled = !running || inventory[key] === 0 || raceElapsed < intakeUntil;
    const count = document.getElementById(`count-${key}`);
    if (f.inventoryUnit === 'dl') count.textContent = `${(inventory[key] / 10).toFixed(1).replace('.', ',')} l jäljellä`;
    else if (key === 'chips') count.textContent = `${inventory[key]} kourallista jäljellä`;
    else if (key === 'sausage') count.textContent = `${inventory[key]} palaa jäljellä`;
    else count.textContent = f.unit === 'drink' ? `${(inventory[key] * f.fluid).toFixed(2).replace('.', ',')} l jäljellä` : `${inventory[key]} kpl jäljellä`;
  });
  document.querySelectorAll('.quick-provision').forEach(b => {
    const key = b.dataset.item;
    b.hidden = !Object.hasOwn(provisionPacks[selectedProvisionPack]?.inventory || {}, key);
    b.disabled = !running || inventory[key] === 0 || raceElapsed < intakeUntil;
    const count = document.getElementById(`quick-count-${key}`);
    count.textContent = foods[key].inventoryUnit === 'dl'
      ? `${(inventory[key] / 10).toFixed(1).replace('.', ',')} l`
      : String(inventory[key]);
  });
}
function updateIntakeProgress() {
  const progress = document.getElementById('intakeProgress');
  const bar = document.getElementById('intakeProgressBar');
  if (!progress || !bar) return;
  if (!intakeKey || raceElapsed >= intakeUntil) {
    if (intakeKey) ui.lastIntake.textContent = `Nautittu: ${foods[intakeKey].name} · Imeytyy vähitellen.`;
    intakeKey = null;
    progress.hidden = true;
    progress.setAttribute('aria-valuenow', '0');
    bar.style.width = '0%';
    return;
  }
  const duration = Math.max(.001, intakeUntil - intakeStartedAt);
  const percent = Math.round(clamp((raceElapsed - intakeStartedAt) / duration) * 100);
  const name = intakeKey === 'sausage' ? 'HK Sinistä' : foods[intakeKey].name;
  ui.lastIntake.textContent = `Mutustaa ${name}, nom nom nom · ${Math.ceil(intakeUntil - raceElapsed)} s`;
  ui.lastIntake.textContent = `${intakeMessage} Â· ${Math.ceil(intakeUntil - raceElapsed)} s`;
  ui.lastIntake.textContent = `${intakeMessage} - ${Math.ceil(intakeUntil - raceElapsed)} s`;
  progress.hidden = false;
  progress.setAttribute('aria-valuenow', String(percent));
  bar.style.width = `${percent}%`;
}
const provisionsToggle = document.getElementById('provisionsToggle');
function setProvisions(open) {
  document.body.classList.toggle('provisions-open', open);
  provisionsToggle.setAttribute('aria-expanded', String(open));
  provisionsToggle.textContent = open ? 'Sulje eväät' : 'Eväät';
}
function renderProvisions() {
  document.querySelector('.provision-grid').innerHTML = Object.entries(foods).map(([key, f]) => `<button class="provision" data-item="${key}"><b>${f.name}</b><span>${foodPortion(f)}</span><small id="count-${key}"></small></button>`).join('');
  const shortNames = {
    gel: 'Geeli', pickle: 'Suolakurkku', juice: 'Mustikka', saltwater: 'Suolavesi', sportsdrink: 'HartSport',
    candy: 'Karkki', water: 'Vesi', beer: 'Karhu', cigarette: 'Nortti', sausage: 'HK',
    chips: 'Sipsi', donut: 'Donitsi', cola: 'Cola'
  };
  document.getElementById('quickProvisions').innerHTML = Object.entries(foods).map(([key, f]) => `<button class="quick-provision" data-item="${key}" aria-label="Nauti ${f.name}" title="${f.name}"><span>${shortNames[key] || f.name}</span><b id="quick-count-${key}"></b></button>`).join('');
}
function foodPortion(f) {
  const units = f.servingUnits || 1;
  const parts = [f.unit === 'drink' ? `${(f.fluid * units * 10).toLocaleString('fi-FI')} dl` : f.mass ? `${f.mass} g` : '1 kpl'];
  if (f.carbs) parts.push(`${Math.round(f.carbs * units)} g hiilihydraattia`);
  if (f.sodium) parts.push(`${f.sodium * units} mg natriumia`);
  if (f.stress) parts.push(`vatsarasitus +${f.stress * units}`);
  return parts.join(' · ');
}
