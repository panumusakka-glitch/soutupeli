function consume(key) {
  if (!running || !inventory[key]) return;
  const f = foods[key];
  inventory[key]--;
  gutCarbs += f.carbs;
  gutFluid += f.fluid;
  gutSodium += f.sodium;
  gutStress += f.stress;
  const parts = [];
  if (f.carbs) parts.push(`${f.carbs} g hiilihydraattia`);
  if (f.fluid) parts.push(`${Math.round(f.fluid * 1000)} ml nestettä`);
  if (f.sodium) parts.push(`${f.sodium} mg natriumia`);
  ui.lastIntake.textContent = `Nautittu: ${f.name} · ${parts.join(' · ')} · Imeytyy vähitellen`;
  updateInventory();
  saveRace();
}
function updateInventory() {
  document.querySelectorAll('.provision').forEach(b => {
    const key = b.dataset.item;
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
  return parts.join(' · ');
}
