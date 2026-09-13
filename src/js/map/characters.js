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
  function botBoat(x, y, angle, bot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = bot.finishedAt === null ? '#f3d36b' : '#b6b6a2';
    ctx.strokeStyle = '#332b20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(4, -2, 3, 8);
    ctx.quadraticCurveTo(0, 11, -3, 8);
    ctx.quadraticCurveTo(-4, -2, 0, -8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(6, -4, 4, 13);
  ctx.quadraticCurveTo(0, 17, -4, 13);
  ctx.quadraticCurveTo(-6, -4, 0, -14);
  ctx.fill();
  ctx.stroke();
  const t = pressing ? clamp((now - phaseStart) / 1000) : clamp(1 - (now - phaseStart) / 1000 / TARGET_RECOVERY);
  ctx.fillStyle = '#161d19';
  ctx.beginPath();
  ctx.arc(0, 3 - 7 * t, 3, 0, Math.PI * 2);
  ctx.fill();
  if (rower.name === 'Einari Luukkonen') {
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
    bladeX = 12 - 7 * t;
  ctx.strokeStyle = '#f1dfbd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 1);
  ctx.lineTo(-bladeX, bladeY);
  ctx.moveTo(2, 1);
  ctx.lineTo(bladeX, bladeY);
  ctx.stroke();
  ctx.strokeStyle = pressing ? 'rgba(220,246,238,.85)' : 'rgba(220,246,238,.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-bladeX - 3, bladeY);
  ctx.lineTo(-bladeX + 2, bladeY);
  ctx.moveTo(bladeX - 2, bladeY);
  ctx.lineTo(bladeX + 3, bladeY);
  ctx.stroke();
  ctx.restore();
}
function botBoat(x, y, angle, bot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = bot.finishedAt === null ? '#f3d36b' : '#b6b6a2';
  ctx.strokeStyle = '#332b20';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(4, -2, 3, 8);
  ctx.quadraticCurveTo(0, 11, -3, 8);
  ctx.quadraticCurveTo(-4, -2, 0, -8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawBotPortrait(p, bot) {
  const portrait = portraits[bot.rower.name];
  if (!portrait?.complete || !portrait.naturalWidth) return;
  displayCtx.save();
  displayCtx.imageSmoothingEnabled = true;
  displayCtx.imageSmoothingQuality = 'high';
  const mask = botPortraitMask(bot.rower.name);
  if (mask) {
    displayCtx.beginPath();
    mask.forEach(([x, y], i) => displayCtx[i ? 'lineTo' : 'moveTo'](p.x - 12 + x * 24, p.y - 17 + y * 24));
    displayCtx.closePath();
    displayCtx.clip();
  }
  drawPortraitImage(displayCtx, portrait, bot.rower.name, p.x - 12, p.y - 17, 24);
  displayCtx.restore();
}
function drawRowerPortrait(p, now) {
  const portrait = portraits[rower.name];
  if (!portrait?.complete || !portrait.naturalWidth) return;
  const c = displayCtx,
    t = pressing ? clamp((now - phaseStart) / 1000) : clamp(1 - (now - phaseStart) / 1000 / TARGET_RECOVERY);
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.translate(p.x, p.y);
  c.rotate(p.angle + Math.PI / 2);
  c.translate(0, 3 - 7 * t);
  c.rotate(-p.angle - Math.PI / 2);
  if (portraitMask()) {
    c.beginPath();
    portraitMask().forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](-14 + x * 28, -19 + y * 28));
    c.closePath();
    c.clip();
  }
  drawPortraitImage(c, portrait, rower.name, -14, -19, 28);
  c.restore();
}
