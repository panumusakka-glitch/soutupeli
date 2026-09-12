function drawStartBridge(m, w, h, now) {
  const scale = m.w / 805,
    p = pointOnRoute(0, m.w, m.h),
    x = m.x + p.x,
    y = m.y + p.y;
  const halfSpan = 22 * scale,
    deck = 5 * scale;
  if (x + halfSpan < 0 || x - halfSpan > w || y + halfSpan < 0 || y - halfSpan > h) return;
  const c = displayCtx;
  c.save();
  c.translate(x, y);
  c.rotate(p.angle);
  c.imageSmoothingEnabled = false;
  c.fillStyle = 'rgba(8,15,32,.3)';
  c.fillRect(-deck / 2 + 3, -halfSpan + 3, deck, halfSpan * 2);
  c.fillStyle = '#708090';
  c.fillRect(-deck / 2, -halfSpan, deck, halfSpan * 2);
  c.fillStyle = '#e8dfba';
  c.fillRect(-deck / 2, -halfSpan, Math.max(1, scale * .4), halfSpan * 2);
  c.fillRect(deck / 2 - scale * .4, -halfSpan, Math.max(1, scale * .4), halfSpan * 2);
  c.fillStyle = '#bcc7cd';
  for (let i = -20; i < 22; i += 4) c.fillRect(-scale * .2, i * scale, scale * .4, scale * 2);
  // The deck is drawn over the boat: at distance zero the rower is underneath it.
  const size = Math.max(1, scale * .65),
    colors = ['#d84838', '#f8d848', '#3888d8', '#f0e8d0', '#c068a0'];
  for (let i = 0; i < 14; i++) {
    const cy = (-18 + i * 2.7) * scale,
      cx = -deck * .26,
      bounce = running && distance < 450 ? Math.sin(now * .011 + i) * size * .35 : 0;
    c.fillStyle = colors[i % colors.length];
    c.fillRect(cx - size, cy - size + bounce, size * 2, size * 2);
    c.fillStyle = '#e8b080';
    c.fillRect(cx - size * .65, cy - size * 1.8 + bounce, size * 1.3, size * 1.3);
    c.strokeStyle = '#e8b080';
    c.lineWidth = Math.max(1, size * .55);
    c.beginPath();
    const clap = running && distance < 450 ? Math.sin(now * .016 + i) > .2 ? .3 : 1.5 : 1;
    c.moveTo(cx - size, cy);
    c.lineTo(cx - size * 2, cy - size * clap);
    c.moveTo(cx + size, cy);
    c.lineTo(cx + size * 2, cy - size * clap);
    c.stroke();
  }
  c.restore();
}
