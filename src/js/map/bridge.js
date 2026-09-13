const raceStarterImage = new Image();
let raceStarterImageReady = false;
raceStarterImage.onload = () => raceStarterImageReady = true;
raceStarterImage.src = 'race-starter.png';

function drawStartBridge(m, w, h, now) {
  const scale = m.w / 805,
    // The start line is already clear of the bridge: racers never need to
    // visually reverse back through it after the starting signal.
    p = pointOnRoute(-70 / TOTAL, m.w, m.h),
    x = m.x + p.x,
    y = m.y + p.y;
  const halfSpan = 22 * scale,
    deck = 2.8 * scale;
  if (x + halfSpan < 0 || x - halfSpan > w || y + halfSpan < 0 || y - halfSpan > h) return;
  const c = displayCtx;
  c.save();
  c.translate(x, y);
  c.rotate(p.angle);
  c.imageSmoothingEnabled = true;
  // Continue the access road well beyond the visible start area so it never
  // appears to end abruptly in the forest behind the bridge.
  const roadLength = 420 * scale;
  c.fillStyle = 'rgba(8,15,32,.3)';
  c.fillRect(-deck / 2 + 3, halfSpan + 3, deck, roadLength);
  c.fillStyle = '#708090';
  c.fillRect(-deck / 2, halfSpan, deck, roadLength);
  c.fillStyle = '#e8dfba';
  c.fillRect(-deck / 2, halfSpan, Math.max(1, scale * .4), roadLength);
  c.fillRect(deck / 2 - scale * .4, halfSpan, Math.max(1, scale * .4), roadLength);
  c.fillStyle = '#bcc7cd';
  for (let i = 10 * scale; i < roadLength; i += 8 * scale) {
    c.fillRect(-scale * .2, halfSpan + i, scale * .4, scale * 4);
  }
  c.fillStyle = 'rgba(8,15,32,.3)';
  c.fillRect(-deck / 2 + 3, -halfSpan + 3, deck, halfSpan * 2);
  c.fillStyle = '#708090';
  c.fillRect(-deck / 2, -halfSpan, deck, halfSpan * 2);
  c.fillStyle = '#e8dfba';
  c.fillRect(-deck / 2, -halfSpan, Math.max(1, scale * .4), halfSpan * 2);
  c.fillRect(deck / 2 - scale * .4, -halfSpan, Math.max(1, scale * .4), halfSpan * 2);
  c.fillStyle = '#bcc7cd';
  for (let i = -20; i < 22; i += 4) c.fillRect(-scale * .2, i * scale, scale * .4, scale * 2);
  for (const end of [-1, 1]) {
    const barrierY = end * 17.5 * scale;
    c.fillStyle = '#202838';
    c.fillRect(-deck * .48, barrierY - scale * .25, deck * .18, scale * 1.5);
    c.fillRect(deck * .30, barrierY - scale * .25, deck * .18, scale * 1.5);
    for (let segment = 0; segment < 4; segment++) {
      c.fillStyle = segment % 2 ? '#f8f0c0' : '#d83838';
      c.fillRect(-deck * .42 + segment * deck * .21, barrierY, deck * .21, Math.max(1, scale * .7));
    }
    const signX = -deck * .32,
      signY = end * 20 * scale,
      signRadius = Math.max(1.5, scale * 1.15);
    c.strokeStyle = '#d8d0b0';
    c.lineWidth = Math.max(1, scale * .35);
    c.beginPath();
    c.moveTo(signX, signY);
    c.lineTo(signX, barrierY);
    c.stroke();
    c.fillStyle = '#d83838';
    c.beginPath();
    c.arc(signX, signY, signRadius, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f8f0c0';
    c.beginPath();
    c.arc(signX, signY, signRadius * .58, 0, Math.PI * 2);
    c.fill();
  }
  // The deck is drawn over the boat: at distance zero the rower is underneath it.
  const size = Math.max(1, scale * .38),
    colors = ['#d84838', '#f8d848', '#3888d8', '#f0e8d0', '#c068a0'],
    spectatorCount = 14;
  const racerCount = botRacers.length + 1;
  const crossingProgress = (
    clamp(distance / 50) +
    botRacers.reduce((sum, bot) => sum + clamp(bot.distance / 50), 0)
  ) / racerCount;
  for (let i = 0; i < spectatorCount; i++) {
    const walkDelay = Math.floor(i / 2) * .08,
      walkProgress = i % 2
        ? clamp((crossingProgress - walkDelay) / (1 - walkDelay))
        : 1,
      smoothWalk = walkProgress * walkProgress * (3 - 2 * walkProgress);
    const cy = (-12 + i * 1.8) * scale,
      side = i % 2 ? -1 + 2 * smoothWalk : 1,
      cx = side * deck * .26,
      bounce = running && distance < 450 ? Math.sin(now * .011 + i) * size * .35 : 0;
    c.save();
    c.translate(cx, cy + bounce);
    c.rotate(side < 0 ? -Math.PI / 2 : Math.PI / 2);
    const bodyWidth = size * 1.7,
      bodyHeight = size * 2.15,
      clap = running && distance < 450 ? Math.sin(now * .016 + i) > .2 ? .25 : 1.55 : .9;
    c.fillStyle = 'rgba(7,14,28,.32)';
    c.beginPath();
    c.ellipse(size * .18, size * 1.7, bodyWidth * .8, size * .42, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = colors[i % colors.length];
    c.beginPath();
    c.roundRect(-bodyWidth / 2, -size * .1, bodyWidth, bodyHeight, size * .45);
    c.fill();
    c.fillStyle = '#e8b080';
    c.beginPath();
    c.arc(0, -size * 1.05, size * .72, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#e8b080';
    c.lineWidth = Math.max(1, size * .38);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-bodyWidth * .42, size * .4);
    c.lineTo(-size * 1.55, -size * clap);
    c.moveTo(bodyWidth * .42, size * .4);
    c.lineTo(size * 1.55, -size * clap);
    c.moveTo(-size * .34, bodyHeight);
    c.lineTo(-size * .58, bodyHeight + size * .75);
    c.moveTo(size * .34, bodyHeight);
    c.lineTo(size * .58, bodyHeight + size * .75);
    c.stroke();
    c.restore();
  }
  if (raceStarterImageReady) {
    const sneakProgress = clamp((raceElapsed - 7) / 5),
      smoothSneak = sneakProgress * sneakProgress * (3 - 2 * sneakProgress),
      starterWidth = 3 * scale,
      starterHeight = starterWidth * 1.5,
      starterX = deck * (.98 - .83 * smoothSneak),
      starterY = (12.2 + Math.sin(sneakProgress * Math.PI * 10) * .25) * scale;
    c.save();
    c.beginPath();
    c.rect(deck / 2, -halfSpan, halfSpan, halfSpan * 2);
    c.clip();
    c.translate(starterX, starterY);
    c.rotate(-p.angle);
    c.drawImage(
      raceStarterImage,
      -starterWidth / 2,
      -starterHeight / 2,
      starterWidth,
      starterHeight
    );
    if (running && now - startTime < 180) {
      const muzzleX = -starterWidth * .33,
        muzzleY = -starterHeight * .43,
        flash = starterWidth * (1.15 - (now - startTime) / 240);
      c.fillStyle = '#fff4a0';
      c.beginPath();
      c.moveTo(muzzleX, muzzleY);
      c.lineTo(muzzleX - flash, muzzleY - flash * .25);
      c.lineTo(muzzleX - flash * .35, muzzleY + flash * .15);
      c.lineTo(muzzleX - flash * .75, muzzleY + flash * .55);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  c.restore();
}
