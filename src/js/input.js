function releaseInput() {
  const pointer = activeInput,
    surface = activeSurface;
  activeInput = null;
  activeSurface = null;
  if (typeof pointer === 'number' && surface?.hasPointerCapture(pointer)) surface.releasePointerCapture(pointer);
}
function cancelStroke(e) {
  if (e && e.pointerId !== undefined && e.pointerId !== activeInput) return;
  rowingAudio.stop();
  if (pressing) {
    pressing = false;
    phaseStart = performance.now();
    strokeTimes.pop();
  }
  releaseInput();
}
function down(e) {
  const pointer = e.type === 'pointerdown';
  if (!running || !pointer && e.code !== 'Space') return;
  if (!pointer && e.target?.closest?.('button,select,input,textarea,[contenteditable]')) return;
  if (pointer && (e.button !== 0 || e.isPrimary === false)) return;
  e.preventDefault();
  if (pressing || !pointer && e.repeat) return;
  activeInput = pointer ? e.pointerId : 'keyboard';
  if (pointer) {
    activeSurface = e.currentTarget || canvas;
    activeSurface.setPointerCapture(e.pointerId);
  }
  pressing = true;
  rowingAudio.catchOar();
  lastRecovery = (performance.now() - phaseStart) / 1000;
  phaseStart = performance.now();
  strokeTimes.push(phaseStart);
  strokeTimes = strokeTimes.filter(t => phaseStart - t < 15000);
}
function up(e) {
  if ((e.type === 'pointerup' ? e.pointerId === activeInput : e.code === 'Space' && activeInput === 'keyboard') && running && pressing) {
    e.preventDefault();
    pressing = false;
    rowingAudio.release();
    releaseInput();
    lastDrive = (performance.now() - phaseStart) / 1000;
    phaseStart = performance.now();
    const tolerance = (.65 + rower.skill / 99 * .7) * (.72 + .28 * techniqueControl);
    const drive = Math.exp(-Math.pow((lastDrive - TARGET_DRIVE) / (.38 * tolerance), 2)),
      recovery = Math.exp(-Math.pow((lastRecovery - TARGET_RECOVERY) / (.65 * tolerance), 2)),
      cycle = Math.exp(-Math.pow((lastDrive + lastRecovery - TARGET_CYCLE) / (.45 * tolerance), 2));
    quality = .45 * drive + .30 * recovery + .25 * cycle;
    rowerChatter.badStroke(quality, raceElapsed);
    strokePulse = 1;
    feedbackTimer = 1.4;
    speed = clamp(speed + (.10 + .26 * quality) * (rower.power / 99) * (strokePower / 70) * crampFactor() * (.7 + .3 * rower.speed / 99), 0, maxRowerSpeed());
    if (quality > .88) {
      ui.feedback.textContent = 'PUHDAS VETO';
      ui.feedbackDetail.textContent = 'Irrotus osui ja vene jatkaa liukua.';
      navigator.vibrate?.(18);
    } else if (lastDrive < .72) {
      ui.feedback.textContent = 'LIIAN LYHYT';
      ui.feedbackDetail.textContent = 'Pidennä veto vihreälle irrotusalueelle.';
    } else if (lastDrive > 1.28) {
      ui.feedback.textContent = 'JÄI ROIKKUMAAN';
      ui.feedbackDetail.textContent = 'Irrota aikaisemmin, kun kahva tulee vihreälle.';
    } else if (lastRecovery < TARGET_RECOVERY - .45) {
      ui.feedback.textContent = 'KIIRE PALAUTUKSESSA';
      ui.feedbackDetail.textContent = 'Anna veneen liukua ennen uutta kiinniottoa.';
    } else {
      ui.feedback.textContent = 'HYVÄ VETO';
      ui.feedbackDetail.textContent = 'Hae vielä tasaisempi 21 vedon rytmi.';
    }
  }
}
const rowButton = document.getElementById('rowButton');
