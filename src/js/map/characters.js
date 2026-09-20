const portraits = Object.fromEntries(Object.entries(portraitFiles).map(([name, src]) => {
  const image = new Image();
  image.src = src;
  return [name, image];
}));
function portraitMask() {
  return rower.name === 'Seppo Räty' ? seppoPortraitMask : rower.name === 'Ari Kankkunen' ? ariPortraitMask : rower.name === 'Toni Sirviö' ? toniPortraitMask : null;
}
function botPortraitMask(name) {
  return name === 'Seppo Räty' ? seppoPortraitMask : name === 'Ari Kankkunen' ? ariPortraitMask : name === 'Toni Sirviö' ? toniPortraitMask : null;
}
function drawPortraitImage(c, portrait, name, x, y, size) {
  const crop = portraitCrops[name];
  if (!crop) {
    c.drawImage(portrait, x, y, size, size);
    return;
  }
  c.drawImage(
    portrait,
    crop[0] * portrait.naturalWidth,
    crop[1] * portrait.naturalHeight,
    crop[2] * portrait.naturalWidth,
    crop[3] * portrait.naturalHeight,
    x,
    y,
    size,
    size
  );
}
const churchBoatAbbreviations = {
  'Hämeenlinnan Latu': 'HML Latu',
  'Keravan Urheilijat': 'Keravan Urh.',
  'Hullun Hirven Soutajat': 'Hullut Hirvet',
  'Kivennavan Soutajat': 'Kivennapa',
  'Kinkun Kiertäjät': 'Kinkun Kiert.',
  'Pääkaupunkiseudun Taksit': 'PKS Taksit',
  'Joutsan Soututeam': 'Joutsa',
  'Tuohikotin Rannanpojat': 'Tuohikotti',
  'Nesteen Soutajat Porvoo': 'Neste Porvoo',
  'UPM-Kymmene / UPM-Metsä Savonlinna': 'UPM Savonlinna',
  'Metso Paper Suvituuli': 'Metso Suvituuli',
  'Mikkelin Soutajat': 'Mikkelin Sout.',
  'Nesteen Soutajat': 'Nesteen Sout.',
  'Suvituulitiimi Turku': 'Suvituuli Turku',
  'Ikaalisten Soutajat': 'Ikaalisten',
  'Kaukaan Lylyn Soutajat': 'Kaukaan Lyly',
  'Vihtavuoren Pamaus': 'Vihtavuori',
  'Luumäen Kirkkosoutujoukkue': 'Luumäki',
  'AKT:läiset Vesillä': 'AKT Vesillä',
  'Lännentien Soutajat': 'Lännentie',
  'Soutavat Automiehet': 'Automiehet'
};
function churchBoatLabel(name) {
  if (churchBoatAbbreviations[name]) return churchBoatAbbreviations[name];
  if (name.length <= 16) return name;
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? words.map(word => word[0]).join('').toLocaleUpperCase('fi-FI') : name.slice(0, 15);
}
function drawChurchBoatLabel(c, name, length = 46) {
  c.save();
  c.rotate(-Math.PI / 2);
  c.font = '700 5px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = 2.2;
  c.strokeStyle = 'rgba(8,15,28,.95)';
  c.fillStyle = '#fff7bd';
  const label = churchBoatLabel(name);
  c.strokeText(label, 0, .3, length);
  c.fillText(label, 0, .3, length);
  c.restore();
}
function boat(x, y, angle, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  if (strokePulse > 0) {
    ctx.strokeStyle = `rgba(220,246,238,${strokePulse * .65})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 12, 8 + 10 * (1 - strokePulse), 3 + 5 * (1 - strokePulse), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const gold = isGoldenBoat();
  if (gold) {
    const paint = ctx.createLinearGradient(-5, -14, 5, 14);
    paint.addColorStop(0, '#8e5a08');
    paint.addColorStop(.3, '#eebd36');
    paint.addColorStop(.5 + .15 * Math.sin(now / 700), '#fff5ad');
    paint.addColorStop(1, '#b67b13');
    ctx.fillStyle = paint;
    ctx.strokeStyle = '#fff1a0';
  } else {
    ctx.fillStyle = material === 'mahogany' ? '#753f29' : '#bb8950';
    ctx.strokeStyle = material === 'mahogany' ? '#d89862' : '#edc990';
  }
  ;
  ctx.lineWidth = 1.5;
  const church = raceType === 'church', canoe = usesKayak();
  ctx.beginPath();
  ctx.moveTo(0, church ? -28 : canoe ? -18 : -14);
  ctx.quadraticCurveTo(church ? 7 : canoe ? 3 : 6, -4, church ? 5 : canoe ? 2.5 : 4, church ? 26 : canoe ? 17 : 13);
  ctx.quadraticCurveTo(0, church ? 31 : canoe ? 20 : 17, church ? -5 : canoe ? -2.5 : -4, church ? 26 : canoe ? 17 : 13);
  ctx.quadraticCurveTo(church ? -7 : canoe ? -3 : -6, -4, 0, church ? -28 : canoe ? -18 : -14);
  ctx.fill();
  ctx.stroke();
  const t = pressing ? clamp((now - phaseStart) / 1000) : clamp(1 - (now - phaseStart) / 1000 / targetStrokeRecovery());
  ctx.fillStyle = '#161d19';
  ctx.beginPath();
  ctx.arc(0, 3 - 7 * t, 3, 0, Math.PI * 2);
  ctx.fill();
  if (rower.name === 'Einari "Leppäsuaren Einar" Luukkonen') {
    const mouthY = 3 - 7 * t;
    ctx.strokeStyle = '#492819';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, mouthY);
    ctx.lineTo(7, mouthY + 1);
    ctx.lineTo(8, mouthY - 2);
    ctx.stroke();
    ctx.fillStyle = '#693b20';
    ctx.fillRect(6, mouthY - 4, 4, 4);
    ctx.strokeStyle = '#e2b77d';
    ctx.lineWidth = .8;
    ctx.strokeRect(6, mouthY - 4, 4, 4);
    ctx.fillStyle = '#c77236';
    ctx.fillRect(7, mouthY - 4, 2, 1);
    if (running && strokeTimes.length && now - strokeTimes.at(-1) < 4500) {
      for (let i = 0; i < 5; i++) {
        const age = (now / 1600 + i / 5) % 1;
        ctx.fillStyle = `rgba(235,238,236,${.65 * (1 - age)})`;
        ctx.beginPath();
        ctx.arc(8 + Math.sin(age * 5 + i) * 3, mouthY - 6 - age * 22, 1.3 + age * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(54,70,67,${.38 * (1 - age)})`;
        ctx.lineWidth = .8;
        ctx.stroke();
      }
    }
  }
  const bladeY = 11 - 22 * t,
    bladeX = 12 - 7 * t,
    alternating = raceType === 'alternating' && partnerRower,
    oarSeatOffsets = church ? [-20, -14, -8, -2, 4, 10, 16] : canoe ? [] : raceType === 'double' && partnerRower ? [-5, 7] : alternating ? [6] : [0];
  ctx.strokeStyle = '#f1dfbd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  oarSeatOffsets.forEach(offset => {
    ctx.moveTo(-2, 1 + offset);
    ctx.lineTo(-bladeX, bladeY + offset);
    ctx.moveTo(2, 1 + offset);
    ctx.lineTo(bladeX, bladeY + offset);
  });
  if (alternating) {
    ctx.moveTo(1, -5);
    ctx.lineTo(10, -10 + 12 * t);
  }
  if (canoe) { ctx.moveTo(-9, -5 + 10 * t); ctx.lineTo(9, 5 - 10 * t); }
  ctx.stroke();
  ctx.strokeStyle = pressing ? 'rgba(220,246,238,.85)' : 'rgba(220,246,238,.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  oarSeatOffsets.forEach(offset => {
    ctx.moveTo(-bladeX - 3, bladeY + offset);
    ctx.lineTo(-bladeX + 2, bladeY + offset);
    ctx.moveTo(bladeX - 2, bladeY + offset);
    ctx.lineTo(bladeX + 3, bladeY + offset);
  });
  if (alternating) {
    ctx.moveTo(8, -10 + 12 * t);
    ctx.lineTo(13, -10 + 12 * t);
  }
  ctx.stroke();
  if (church) drawChurchBoatLabel(ctx, crewName(), 50);
  ctx.restore();
}
function botStrokePosition(bot, now) {
  if (bot.finishedAt !== null || bot.speed < .2 || raceElapsed < bot.startAt) return 0;
  const strokesPerMinute = clamp(18 + bot.speed * .9, 19, 31);
  const cycle = 60 / strokesPerMinute;
  const phase = ((now / 1000 + bot.lane * .37) % cycle + cycle) % cycle / cycle;
  const driveFraction = .38;
  if (phase < driveFraction) return .5 - .5 * Math.cos(Math.PI * phase / driveFraction);
  return .5 + .5 * Math.cos(Math.PI * (phase - driveFraction) / (1 - driveFraction));
}
function botBoat(x, y, angle, bot, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  const church = bot.raceType === 'church', canoe = bot.raceType === 'canoe', double = ['double', 'alternating', 'church'].includes(bot.raceType);
  const bow = church ? -28 : canoe ? -18 : -14, stern = church ? 26 : canoe ? 17 : 13, halfWidth = church ? 7 : canoe ? 3 : 6;
  const t = botStrokePosition(bot, now), bladeY = 11 - 22 * t, bladeX = 12 - 7 * t;
  const moving = bot.finishedAt === null && bot.speed >= .2 && raceElapsed >= bot.startAt;
  ctx.fillStyle = bot.finishedAt === null ? '#b98247' : '#777b78';
  ctx.strokeStyle = bot.finishedAt === null ? '#efd095' : '#b6b6a2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, bow);
  ctx.quadraticCurveTo(halfWidth, -4, halfWidth - 1, stern);
  ctx.quadraticCurveTo(0, stern + (church ? 5 : 4), -halfWidth + 1, stern);
  ctx.quadraticCurveTo(-halfWidth, -4, 0, bow);
  ctx.fill();
  ctx.stroke();

  const seats = church ? [-18, -12, -6, 0, 6, 12, 18] : bot.raceType === 'double' ? [-4, 5] : bot.raceType === 'alternating' ? [5] : canoe ? [] : [0];
  ctx.fillStyle = '#202820';
  for (const seat of seats) {
    ctx.beginPath();
    ctx.arc(0, seat - 7 * t, church ? 1.8 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#f1dfbd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const seat of seats) {
      ctx.moveTo(-2, seat);
      ctx.lineTo(-bladeX, bladeY + seat);
      ctx.moveTo(2, seat);
      ctx.lineTo(bladeX, bladeY + seat);
  }
  if (bot.raceType === 'alternating') { ctx.moveTo(1, -5); ctx.lineTo(10, -10 + 12 * t); }
  if (canoe) { ctx.moveTo(-9, -5 + 10 * t); ctx.lineTo(9, 5 - 10 * t); }
  ctx.stroke();
  ctx.strokeStyle = moving ? 'rgba(220,246,238,.82)' : 'rgba(220,246,238,.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const seat of seats) {
    ctx.moveTo(-bladeX - 3, bladeY + seat); ctx.lineTo(-bladeX + 2, bladeY + seat);
    ctx.moveTo(bladeX - 2, bladeY + seat); ctx.lineTo(bladeX + 3, bladeY + seat);
  }
  if (bot.raceType === 'alternating') { ctx.moveTo(8, -10 + 12 * t); ctx.lineTo(13, -10 + 12 * t); }
  if (canoe) { ctx.moveTo(-11, -7 + 10 * t); ctx.lineTo(-7, -3 + 10 * t); ctx.moveTo(7, 3 - 10 * t); ctx.lineTo(11, 7 - 10 * t); }
  ctx.stroke();
  if (church) drawChurchBoatLabel(ctx, bot.rower.name, 44);
  ctx.restore();
}
function drawBotPortrait(p, bot) {
  (bot.crew || [bot.rower.name]).forEach((name, index, crew) => {
    const portrait = portraits[name];
    if (!portrait?.complete || !portrait.naturalWidth) return;
    const size = crew.length === 2 ? 19 : 24;
    displayCtx.save();
    displayCtx.imageSmoothingEnabled = true;
    displayCtx.imageSmoothingQuality = 'high';
    displayCtx.translate(p.x, p.y);
    displayCtx.rotate(p.angle + Math.PI / 2);
    displayCtx.translate(0, crew.length === 2 ? -(size + 2) / 2 + index * (size + 2) : 0);
    displayCtx.rotate(-p.angle - Math.PI / 2);
    const x = -size / 2, y = -size * .68;
    const mask = botPortraitMask(name);
    if (mask) {
      displayCtx.beginPath();
      mask.forEach(([mx, my], i) => displayCtx[i ? 'lineTo' : 'moveTo'](x + mx * size, y + my * size));
      displayCtx.closePath();
      displayCtx.clip();
    }
    drawPortraitImage(displayCtx, portrait, name, x, y, size);
    displayCtx.restore();
  });
}
function drawRowerPortrait(p, now) {
  const crew = raceType !== 'single' && partnerRower ? [rower, partnerRower] : [rower];
  crew.forEach((crewRower, index) => {
    const portrait = portraits[crewRower.name];
    if (!portrait?.complete || !portrait.naturalWidth) return;
    const c = displayCtx, size = crew.length === 2 ? 22 : 28;
    c.save();
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.translate(p.x, p.y);
    c.rotate(p.angle + Math.PI / 2);
    c.translate(0, crew.length === 2 ? -12 + index * 24 : -1);
    c.rotate(-p.angle - Math.PI / 2);
    const mask = crewRower === rower ? portraitMask() : botPortraitMask(crewRower.name);
    if (mask) {
      c.beginPath();
      mask.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](-size / 2 + x * size, -size * .68 + y * size));
      c.closePath();
      c.clip();
    }
    drawPortraitImage(c, portrait, crewRower.name, -size / 2, -size * .68, size);
    c.restore();
  });
}
