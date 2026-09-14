// Occasional fictional rower dialogue, spoken with the device's Finnish voice.
const rowerChatter = (() => {
  const synth = globalThis.speechSynthesis;
  let nextAt = 90,
    smoothedSpeed = 0,
    band = null,
    bandSince = 0,
    lastBand = null,
    windTime = 0,
    lastLine = '',
    armed = false;
  const saidAt = new Map();
  let selectedRower = '',
    firstCurse = true;
  let condition = {
    time: 0,
    speed: 0,
    wind: false,
    freshness: 100,
    energy: 100,
    hydration: 100,
    blisters: 0,
    gutStress: 0,
    gutFluid: 0,
    cramps: 0
  };
  const recentLines = [];
  let autoSpeech = true,
    clock = 0,
    lastManual = -Infinity;
  const toggle = document.getElementById('speechToggle'),
    swear = document.getElementById('swearButton');
  try {
    autoSpeech = localStorage.getItem('rowingSpeech') !== 'off';
  } catch {}
  function label() {
    toggle.textContent = autoSpeech ? 'Puhe: on' : 'Puhe: pois';
    toggle.setAttribute('aria-pressed', String(autoSpeech));
  }
  toggle.onclick = () => {
    autoSpeech = !autoSpeech;
    if (!autoSpeech) cancel();
    label();
    try {
      localStorage.setItem('rowingSpeech', autoSpeech ? 'on' : 'off');
    } catch {}
  };
  swear.onclick = () => {
    const now = performance.now();
    if (now - lastManual < 1200) return;
    if (say('swear', clock, true)) lastManual = now;
  };
  label();
  function contextualCurses() {
    const s = condition,
      pool = [...lines.swear];
    if (s.freshness < 55) pool.push(...complaints.tired);
    if (s.energy < 45) pool.push(...complaints.energy);
    if (s.gutStress > 15 || s.gutFluid > .65) pool.push(...complaints.stomach);
    if (s.blisters >= 5) pool.push(...complaints.blisters);else if (s.time > 1200 && !rowers.find(r => r.name === selectedRower)?.blisterImmune) pool.push(...complaints.blisterWorry);
    if (s.cramps >= 10) pool.push(...complaints.cramps);
    if (s.wind) pool.push(...complaints.wind);
    if (s.time > 60 && s.speed < 8.4) pool.push(...complaints.slow);
    return pool;
  }
  function preferredVoice(gender, voices) {
    const pattern = gender === 'male' ? /\b(male|harri|onni)\b/i : /\b(female|satu|heidi|noora|selma)\b/i;
    return voices.find(v => pattern.test(v.name)) || voices[0];
  }
  function cancel() {
    synth?.cancel();
  }
  function reset() {
    cancel();
    nextAt = 90;
    smoothedSpeed = 0;
    band = null;
    bandSince = 0;
    lastBand = null;
    windTime = 0;
    lastLine = '';
    saidAt.clear();
    armed = false;
    clock = 0;
    lastManual = -Infinity;
    selectedRower = '';
    firstCurse = true;
    recentLines.length = 0;
    condition = {
      time: 0,
      speed: 0,
      wind: false,
      freshness: 100,
      energy: 100,
      hydration: 100,
      blisters: 0,
      gutStress: 0,
      gutFluid: 0,
      cramps: 0
    };
  }
  function arm(name, starting = false) {
    selectedRower = name;
    firstCurse = true;
    armed = true;
    synth?.getVoices();
    nextAt = 0;
    if (starting) announceStart();else say('start', 0);
    nextAt = 30;
  }
  function announceStart() {
    if (!autoSpeech || !rowingAudio.isEnabled() || !synth || !globalThis.SpeechSynthesisUtterance) return;
    cancel();
    const u = new SpeechSynthesisUtterance(START_ANNOUNCEMENT);
    u.lang = 'fi-FI';
    u.rate = .94;
    u.pitch = .95;
    u.volume = .9;
    const voice = preferredVoice('male', synth.getVoices().filter(v => /^fi(?:-|_|$)/i.test(v.lang)));
    if (voice) u.voice = voice;
    try {
      synth.speak(u);
    } catch {}
  }
  function say(key, time, manual = false) {
    if (!armed || !rowingAudio.isEnabled() || !synth || !globalThis.SpeechSynthesisUtterance || document.hidden || !manual && (!autoSpeech || time < nextAt || synth.speaking || synth.pending)) return false;
    if (!manual && time - (saidAt.get(key) ?? -Infinity) < (time < 300 ? 90 : 600)) return false;
    if (manual) cancel();
    const isCurse = ['swear', 'bad', 'wind', 'slow'].includes(key),
      personal = isCurse ? personalCurses[selectedRower] : null;
    const base = key === 'swear' ? contextualCurses() : key === 'wind' ? complaints.wind : lines[key];
    const personalLines = personal ? Array.isArray(personal) ? personal : [personal] : [];
    const pool = [...base, ...personalLines];
    const fresh = pool.filter(line => !recentLines.includes(line));
    const choices = fresh.length ? fresh : pool.filter(line => line !== lastLine);
    const text = personal && firstCurse ? personalLines[0] : choices[Math.floor(Math.random() * choices.length)] || pool[0];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fi-FI';
    const female = rowers.find(r => r.name === selectedRower)?.voiceGender === 'female';
    const voices = synth.getVoices().filter(v => /^fi(?:-|_|$)/i.test(v.lang));
    const voice = preferredVoice(female ? 'female' : 'male', voices);
    if (voice) utterance.voice = voice;
    utterance.rate = .96;
    utterance.pitch = female ? 1.05 : .82;
    utterance.volume = .8;
    try {
      synth.speak(utterance);
    } catch {
      return false;
    }
    if (isCurse) firstCurse = false;
    recentLines.push(text);
    if (recentLines.length > 6) recentLines.shift();
    lastLine = text;
    saidAt.set(key, time);
    nextAt = time + (time < 300 ? 25 + Math.random() * 35 : 180 + Math.random() * 300);
    return true;
  }
  function badStroke(quality, time) {
    if (quality < .22 && time > 20 && Math.random() < (time < 300 ? .25 : .12)) say('bad', time);
  }
  function tick(dt, state) {
    condition = {
      ...condition,
      ...state
    };
    const {
      time,
      speed,
      active,
      wind,
      quality,
      totalKm
    } = state;
    clock = time;
    smoothedSpeed += (speed - smoothedSpeed) * (1 - Math.exp(-dt / 30));
    windTime = wind && active ? windTime + dt : 0;
    if (!active || time < 60 || smoothedSpeed < 2) {
      band = null;
      bandSince = time;
      return;
    }
    const hours = totalKm / smoothedSpeed;
    const candidate = hours < 5 ? 'five' : hours < 6 ? 'six' : hours < 7 ? 'seven' : 'slow';
    if (candidate !== band) {
      band = candidate;
      bandSince = time;
    }
    // Stable pace for 30 seconds, no repeated announcements at every threshold crossing.
    if (time - bandSince > 30 && band !== lastBand && say(band, time)) {
      lastBand = band;
      return;
    }
    if (windTime > 30 && Math.random() < 1 - Math.exp(-dt / 180)) {
      if (say('wind', time)) return;
    }
    if (Math.random() < 1 - Math.exp(-dt / 240) && (condition.freshness < 55 || condition.energy < 45 || condition.blisters >= 5 || condition.gutStress > 15)) if (say('swear', time)) return;
    if (quality > .85 && speed > 9.5 && Math.random() < 1 - Math.exp(-dt / (time < 300 ? 35 : 300))) say('good', time);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
  });
  function snapshot() {
    return {
      firstCurse,
      recentLines: [...recentLines],
      lastBand
    };
  }
  function announceFinish(name, finishTime, place) {
    if (!autoSpeech || !rowingAudio.isEnabled() || !synth || !globalThis.SpeechSynthesisUtterance) return;
    cancel();
    const praise = place === 1 ? FINISH_PRAISE.first : place === 2 ? FINISH_PRAISE.fast : place === 3 ? FINISH_PRAISE.solid : FINISH_PRAISE.finish;
    const text = `Maaliin saapuu ${name}! Loppuaika ${finishTime}. Sijoitus ${place}. ${praise}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fi-FI';
    utterance.rate = .9;
    utterance.pitch = .95;
    utterance.volume = .9;
    const voice = preferredVoice('male', synth.getVoices().filter(v => /^fi(?:-|_|$)/i.test(v.lang)));
    if (voice) utterance.voice = voice;
    try {
      synth.speak(utterance);
    } catch {}
  }
  function restore(saved, name, time) {
    reset();
    selectedRower = name;
    armed = true;
    clock = time;
    nextAt = time + 30;
    firstCurse = saved?.firstCurse === true;
    if (Array.isArray(saved?.recentLines)) recentLines.push(...saved.recentLines.filter(s => typeof s === 'string').slice(-6));
    lastLine = recentLines.at(-1) || '';
    lastBand = ['five', 'six', 'seven', 'slow'].includes(saved?.lastBand) ? saved.lastBand : null;
  }
  return {
    reset,
    arm,
    announceFinish,
    cancel,
    badStroke,
    tick,
    snapshot,
    restore
  };
})();
