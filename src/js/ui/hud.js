const ui = {
  speed: document.getElementById('speed'),
  spm: document.getElementById('spm'),
  distance: document.getElementById('distance'),
  quality: document.getElementById('quality'),
  qualityHint: document.getElementById('qualityHint'),
  phase: document.getElementById('phase'),
  phaseHelp: document.getElementById('phaseHelp'),
  bar: document.getElementById('driveBar'),
  cursor: document.getElementById('strokeCursor'),
  feedback: document.getElementById('strokeFeedback'),
  feedbackDetail: document.getElementById('strokeDetail'),
  start: document.getElementById('startOverlay'),
  finish: document.getElementById('finishOverlay'),
  hydrationValue: document.getElementById('hydrationValue'),
  hydrationBar: document.getElementById('hydrationBar'),
  hydrationHint: document.getElementById('hydrationHint'),
  energyValue: document.getElementById('energyValue'),
  energyBar: document.getElementById('energyBar'),
  energyHint: document.getElementById('energyHint'),
  staminaValue: document.getElementById('staminaValue'),
  staminaBar: document.getElementById('staminaBar'),
  staminaHint: document.getElementById('staminaHint'),
  blisterValue: document.getElementById('blisterValue'),
  blisterBar: document.getElementById('blisterBar'),
  blisterHint: document.getElementById('blisterHint'),
  raceTime: document.getElementById('raceTime'),
  pacePrediction: document.getElementById('pacePrediction'),
  power: document.getElementById('power'),
  powerValue: document.getElementById('powerValue'),
  leaderboardTitle: document.getElementById('leaderboardTitle'),
  leaderboardToggle: document.getElementById('leaderboardToggle'),
  leaderboard: document.getElementById('leaderboard'),
  lastIntake: document.getElementById('lastIntake')
};
let leaderboardExpanded = false;
const womensLeaderboard = new Set([
  'Marika Laaksonen',
  'Hanna Tuominen',
  'Sanna Piili'
]);
function setLeaderboardExpanded(value) {
  leaderboardExpanded = value;
  ui.leaderboard.parentElement.classList.toggle('expanded', value);
  ui.leaderboardToggle.setAttribute('aria-expanded', String(value));
  ui.leaderboardToggle.textContent = value ? 'Sulje' : 'Kaikki';
  updateLeaderboard();
}
function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor(sec % 3600 / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}
function setMeter(kind, value, hint) {
  ui[`${kind}Value`].textContent = `${Math.round(value)} %`;
  ui[`${kind}Bar`].style.width = `${value}%`;
  ui[`${kind}Bar`].style.background = value > 65 ? '#66b887' : value > 35 ? '#e3a641' : '#ef5b32';
  ui[`${kind}Hint`].textContent = hint;
}
function updateUI(now = performance.now()) {
  updateInventory();
  updateCrampUI();
  updateLeaderboard();
  ui.speed.textContent = speed.toFixed(1).replace('.', ',');
  if (Number.isFinite(rower.racePower)) strokePower = rower.racePower;
  ui.power.disabled = Number.isFinite(rower.racePower);
  ui.power.value = strokePower;
  ui.powerValue.textContent = `${strokePower} %`;
  ui.distance.textContent = (distance / 1000).toFixed(1).replace('.', ',');
  const recent = strokeTimes.filter(t => now - t < 15000);
  ui.spm.textContent = recent.length < 2 ? '0' : Math.round((recent.length - 1) * 60000 / (recent.at(-1) - recent[0]));
  let label = '—',
    hint = 'aloita soutu';
  if (strokeTimes.length) {
    if (quality > .86) {
      label = 'Erinomainen';
      hint = '21 vetoa/min';
    } else if (quality > .62) {
      label = 'Hyvä';
      hint = 'pidä sama rytmi';
    } else {
      label = 'Rikkonainen';
      hint = 'hae 21 vetoa/min';
    }
  }
  ui.quality.textContent = label;
  ui.qualityHint.textContent = hint;
  const phaseElapsed = (now - phaseStart) / 1000,
    driveProgress = clamp(phaseElapsed / 1.35),
    recoveryProgress = clamp(phaseElapsed / TARGET_RECOVERY);
  if (pressing) {
    ui.bar.style.width = `${driveProgress * 100}%`;
    ui.cursor.style.left = `${driveProgress * 100}%`;
    ui.phase.textContent = driveProgress < .18 ? 'KIINNIOTTO' : driveProgress < .63 ? 'VETO' : 'IRROTUS';
    ui.phaseHelp.textContent = driveProgress < .55 ? 'Pidä paine tasaisena' : driveProgress < .88 ? 'Vapauta vihreällä' : 'Vapauta nyt';
  } else {
    ui.bar.style.width = '0%';
    ui.cursor.style.left = `${(1 - recoveryProgress) * 100}%`;
    ui.phase.textContent = recoveryProgress < 1 ? 'PALAUTUS' : 'VALMIS VETOON';
    ui.phaseHelp.textContent = recoveryProgress < .7 ? 'Anna veneen liukua' : recoveryProgress < 1 ? 'Valmistaudu kiinniottoon' : 'Paina välilyönti pohjaan';
  }
  ui.feedback.parentElement.classList.toggle('flash', feedbackTimer > 0);
  const raceSec = raceElapsed;
  ui.raceTime.textContent = formatTime(raceSec);
  const avg = raceSec > 45 ? distance / (raceSec / 3600) / 1000 : 0;
  ui.pacePrediction.textContent = avg > 1 ? `Ennuste ${formatTime(raceSec + (TOTAL - distance) / (avg * 1000) * 3600)}` : 'Ennuste —';
  const sweatRate = rowerSweatRate() * (raceDay?.heat || 1);
  const sweatHint = sweatRate > 1 ? 'runsas hikoilu' : sweatRate < .85 ? 'kevyt hikoilu' : 'tavanomainen hikoilu';
  setMeter('hydration', hydration, `${fluidBalance < -.1 ? 'Nestevajetta' : fluidBalance > .1 ? 'Nesteylijäämää' : 'Nestemäärä tasapainossa'} ${Math.abs(fluidBalance).toFixed(2)} l · ${sweatHint} · imeytymässä ${(gutFluid * 10).toFixed(1)} dl${sodiumBalance < 0 ? ' · natriumvajetta' : ''}`);
  setMeter('energy', energy, energy > 75 ? 'Energiaa riittää' : energy > 45 ? 'Syö pian' : 'Energia loppuu');
  setMeter('stamina', freshness, freshness > 75 ? `Tuoreus hyvä · W′ ${Math.round(wPrime)} %` : freshness > 35 ? `Pitkä kuormitus tuntuu · W′ ${Math.round(wPrime)} %` : `Väsymys painaa · W′ ${Math.round(wPrime)} %`);
  ui.blisterValue.textContent = `${Math.round(blisters)} %`;
  ui.blisterBar.style.width = `${blisters}%`;
  ui.blisterHint.textContent = blisters < 5 ? 'Kädet kunnossa' : blisters < 20 ? 'Pieniä rakon alkuja' : blisters < 55 ? 'Rakot tuntuvat vedossa' : 'Kädet ovat pahasti rakoilla';
}
function updateLeaderboard() {
  const racers = [{name: rower.name, distance, finishedAt: distance >= TOTAL ? raceElapsed : null, player: true}, ...botRacers.map(bot => ({...bot, name: bot.rower.name}))];
  racers.sort((a, b) => {
    if (a.finishedAt !== null || b.finishedAt !== null) {
      if (a.finishedAt === null) return 1;
      if (b.finishedAt === null) return -1;
      return a.finishedAt - b.finishedAt;
    }
    return b.distance - a.distance;
  });
  const womenOnly = womensLeaderboard.has(rower.name) && !leaderboardExpanded;
  const leaderboardRacers = womenOnly
    ? racers.filter(racer => womensLeaderboard.has(racer.name))
    : racers;
  const playerRank = leaderboardRacers.findIndex(racer => racer.player) + 1;
  ui.leaderboardTitle.textContent = `TILANNE · ${playerRank}/${leaderboardRacers.length}`;
  const ranked = leaderboardRacers.map((racer, index) => ({...racer, rank: index + 1}));
  const visible = leaderboardExpanded || womenOnly ? ranked : ranked.filter(racer => racer.rank <= 5 || racer.player);
  ui.leaderboard.innerHTML = visible.map(racer => `<li${racer.player ? ' class="player"' : ''}><b>${racer.rank}.</b><span>${racer.name}</span><small>${racer.finishedAt !== null ? formatTime(racer.finishedAt) : `${(racer.distance / 1000).toFixed(1).replace('.', ',')} km`}</small></li>`).join('');
}
function updateCrampUI() {
  document.getElementById('crampValue').textContent = `${Math.round(cramps)} %`;
  document.getElementById('crampBar').style.width = `${cramps}%`;
  document.getElementById('crampBar').style.background = '#ef5b32';
  document.getElementById('crampHint').textContent = cramps < 10 ? 'Ei merkittävää haittaa' : cramps < 40 ? 'Lihakset kiristelevät' : cramps < 70 ? 'Kevennä ja korjaa tankkaus' : 'Vakava kramppi: lepää ja tankkaa';
}
