function consume(key) {
  if (!running || !inventory[key]) return;
  const f = foods[key];
  inventory[key]--;
  const fastCarbs = Math.min(f.fastCarbs || 0, Math.max(0, 45 - bloodCarbs));
  bloodCarbs += fastCarbs;
  gutCarbs += f.carbs - fastCarbs;
  gutFluid += f.fluid;
  gutSodium += f.sodium;
  gutStress = clamp(gutStress + f.stress * (f.stackingStress ? 1 + gutStress / 55 : 1), 0, 100);
  if (f.digestion) digestionLoad = clamp(digestionLoad + f.digestion * (1 + digestionLoad / 70), 0, 100);
  if (f.alcohol) alcoholLoad = clamp(alcoholLoad + f.alcohol * (1 + alcoholLoad * .18), 0, 20);
  if (f.nicotine) nicotineLoad = clamp(nicotineLoad + f.nicotine * (1 + nicotineLoad * .22), 0, 20);
  const parts = [];
  if (f.carbs) parts.push(`${f.carbs} g hiilihydraattia`);
  if (f.fluid) parts.push(`${Math.round(f.fluid * 1000)} ml nestettä`);
  if (f.sodium) parts.push(`${f.sodium} mg natriumia`);
  if (f.stress) parts.push(`vatsarasitus +${f.stress}`);
  if (f.alcohol) parts.push('alkoholikuorma kasvaa');
  if (f.nicotine) parts.push('tupakkakuorma kasvaa');
  if (f.digestion) parts.push('hidas ruoansulatus');
  if (!parts.length) parts.push('ei ravintoarvoa');
  ui.lastIntake.textContent = `Nautittu: ${f.name} · ${parts.join(' · ')} · Imeytyy vähitellen`;
  rowerChatter.intake(key, raceElapsed);
  updateInventory();
  saveRace();
}
function updateInventory() {
  document.querySelectorAll('.provision').forEach(b => {
    const key = b.dataset.item;
    b.hidden = !Object.hasOwn(provisionPacks[selectedProvisionPack]?.inventory || {}, key);
    b.disabled = !running || inventory[key] === 0;
    document.getElementById(`count-${key}`).textContent = foods[key].unit === 'drink' ? `${(inventory[key] * foods[key].fluid).toFixed(2).replace('.', ',')} l jäljellä` : `${inventory[key]} kpl jäljellä`;
  });
}
const provisionsToggle = document.getElementById('provisionsToggle');
function setProvisions(open) {
  document.body.classList.toggle('provisions-open', open);
  provisionsToggle.setAttribute('aria-expanded', String(open));
  provisionsToggle.textContent = open ? 'Sulje eväät' : 'Eväät';
}
function renderProvisions() {
  document.querySelector('.provision-grid').innerHTML = Object.entries(foods).map(([key, f]) => `<button class="provision" data-item="${key}"><b>${f.name}</b><span>${foodPortion(f)}</span><small id="count-${key}"></small></button>`).join('');
}
function foodPortion(f) {
  const parts = [f.unit === 'drink' ? `${(f.fluid * 10).toLocaleString('fi-FI')} dl` : '1 kpl'];
  if (f.carbs) parts.push(`${f.carbs} g hiilihydraattia`);
  if (f.sodium) parts.push(`${f.sodium} mg natriumia`);
  if (f.stress) parts.push(`vatsarasitus +${f.stress}`);
  return parts.join(' · ');
}
