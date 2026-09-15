const raceStarterImage = new Image();
let raceStarterImageReady = false;
raceStarterImage.onload = () => raceStarterImageReady = true;
raceStarterImage.src = 'race-starter.png';

const VEKARA_BRIDGE_PATH = [
  [.7290, .2761],
  [.7321, .2767],
  [.7366, .2778],
  [.7414, .2789],
  [.7461, .2799],
  [.7509, .2813],
  [.7526, .2824]
];

function drawVekaraBridge(m, w, h) {
  const scale = m.w / 805;
  const points = VEKARA_BRIDGE_PATH.map(([mapX, mapY]) => ({
    x: m.x + mapX * m.w,
    y: m.y + mapY * m.h
  }));
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const margin = 12 * scale;
  if (Math.max(...xs) + margin < 0 || Math.min(...xs) - margin > w ||
      Math.max(...ys) + margin < 0 || Math.min(...ys) - margin > h) return;

  const c = displayCtx;
  const traceDeck = (offsetX = 0, offsetY = 0) => {
    c.beginPath();
    c.moveTo(points[0].x + offsetX, points[0].y + offsetY);
    // Catmull-Rom control points turn the surveyed bridge positions into one
    // continuous curve while keeping the deck anchored to every given point.
    for (let index = 0; index < points.length - 1; index++) {
      const previous = points[Math.max(0, index - 1)],
        start = points[index],
        end = points[index + 1],
        next = points[Math.min(points.length - 1, index + 2)];
      c.bezierCurveTo(
        start.x + (end.x - previous.x) / 6 + offsetX,
        start.y + (end.y - previous.y) / 6 + offsetY,
        end.x - (next.x - start.x) / 6 + offsetX,
        end.y - (next.y - start.y) / 6 + offsetY,
        end.x + offsetX,
        end.y + offsetY
      );
    }
  };

  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Deep water shadows and concrete piers make the long elevated structure
  // readable even against the detailed map bitmap.
  for (let index = 1; index < points.length - 1; index++) {
    const before = points[index - 1], after = points[index + 1], point = points[index];
    const dx = after.x - before.x, dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length, ny = dx / length;
    const deckEdge = 2.1 * scale,
      pierReach = 5.8 * scale;
    c.strokeStyle = 'rgba(8,20,38,.34)';
    c.lineWidth = Math.max(2, 2.4 * scale);
    c.beginPath();
    c.moveTo(point.x + nx * deckEdge + 2 * scale, point.y + ny * deckEdge + 3 * scale);
    c.lineTo(point.x + nx * pierReach + 2 * scale, point.y + ny * pierReach + 3 * scale);
    c.stroke();
    c.strokeStyle = '#a9b2b5';
    c.lineWidth = Math.max(1.5, 1.8 * scale);
    c.beginPath();
    c.moveTo(point.x + nx * deckEdge, point.y + ny * deckEdge);
    c.lineTo(point.x + nx * pierReach, point.y + ny * pierReach);
    c.stroke();
  }

  traceDeck(2.4 * scale, 3.2 * scale);
  c.strokeStyle = 'rgba(7,16,31,.42)';
  c.lineWidth = Math.max(3, 4.25 * scale);
  c.stroke();
  traceDeck();
  c.strokeStyle = '#dce2df';
  c.lineWidth = Math.max(2.5, 3.6 * scale);
  c.stroke();
  traceDeck();
  c.strokeStyle = '#59636a';
  c.lineWidth = Math.max(1.5, 2.65 * scale);
  c.stroke();
  traceDeck();
  c.strokeStyle = '#747e84';
  c.lineWidth = Math.max(1, 2.05 * scale);
  c.stroke();

  // Pale edge rails and a broken centre line echo the real two-lane bridge.
  for (const railOffset of [-1.35, 1.35]) {
    c.save();
    c.translate(0, railOffset * scale);
    traceDeck();
    c.strokeStyle = '#edf0e8';
    c.lineWidth = Math.max(.7, .65 * scale);
    c.stroke();
    c.restore();
  }
  traceDeck();
  c.setLineDash([3.4 * scale, 2.7 * scale]);
  c.strokeStyle = '#f6e8a8';
  c.lineWidth = Math.max(.65, .7 * scale);
  c.stroke();
  c.setLineDash([]);

  // Broad abutments visually anchor both ends to the shores.
  for (const index of [0, points.length - 1]) {
    const point = points[index];
    c.fillStyle = '#aeb7b7';
    c.beginPath();
    c.arc(point.x, point.y, Math.max(1.25, 1.6 * scale), 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawStartBridge(m, w, h, now) {
  const scale = m.w / 805,
    // The start line is already clear of the bridge: racers never need to
    // visually reverse back through it after the starting signal.
    p = pointOnRoute(-70 / TOTAL, m.w, m.h),
    x = m.x + p.x,
    y = m.y + p.y;
  const halfSpan = 44 * scale,
    deck = 2.8 * scale;
  if (x + halfSpan < 0 || x - halfSpan > w || y + halfSpan < 0 || y - halfSpan > h) return;
  const c = displayCtx;
  c.save();
  c.translate(x, y);
  c.rotate(p.angle);
  c.imageSmoothingEnabled = true;
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
    const barrierY = end * 39.5 * scale;
    c.fillStyle = '#202838';
    c.fillRect(-deck * .48, barrierY - scale * .25, deck * .18, scale * 1.5);
    c.fillRect(deck * .30, barrierY - scale * .25, deck * .18, scale * 1.5);
    for (let segment = 0; segment < 4; segment++) {
      c.fillStyle = segment % 2 ? '#f8f0c0' : '#d83838';
      c.fillRect(-deck * .42 + segment * deck * .21, barrierY, deck * .21, Math.max(1, scale * .7));
    }
    const signX = -deck * .32,
      signY = end * 42 * scale,
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
  const fleetDistance = (
    distance +
    botRacers.reduce((sum, bot) => sum + bot.distance, 0)
  ) / racerCount;
  // Departures happen in four distinct groups.  One supporter stays all day.
  // The visible headcount becomes 14 → 7 → 5 → 3 → 1 as the fleet recedes.
  const departureAt = index => index < 1 ? Infinity : index < 3 ? 1100 : index < 5 ? 750 : index < 7 ? 450 : 150;
  // Keep every spectator inside the bridge deck.  They walk along the road
  // toward its far end and disappear beyond the camera, never sideways into
  // Hakovirta.
  c.save();
  c.beginPath();
  c.rect(-deck / 2, -halfSpan, deck, halfSpan * 2);
  c.clip();
  for (let i = 0; i < spectatorCount; i++) {
    const walkProgress = clamp((fleetDistance - departureAt(i)) / 150),
      smoothWalk = walkProgress * walkProgress * (3 - 2 * walkProgress);
    const startY = (-12 + i * 1.8) * scale,
      cy = startY + smoothWalk * (halfSpan * 1.7 - startY),
      cx = (i % 2 ? -.22 : .22) * deck,
      cheer = 1 - smoothWalk * .9,
      bounce = running && cheer > .15 ? Math.sin(now * .011 + i) * size * .35 * cheer : 0;
    c.save();
    c.translate(cx, cy + bounce);
    const bodyWidth = size * 1.7,
      bodyHeight = size * 2.15,
      clap = running && cheer > .15 ? (Math.sin(now * .016 + i) > .2 ? .25 : 1.55) * cheer : .35;
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
  c.restore();
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
