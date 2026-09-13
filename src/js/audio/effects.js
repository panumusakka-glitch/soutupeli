// Gesture-driven synthesized oar sounds; no downloads or microphone access.
const rowingAudio = (() => {
  let context,
    master,
    noise,
    drive = null,
    enabled = true;
  const crowdNodes = new Set();
  const button = document.getElementById('soundToggle');
  try {
    enabled = localStorage.getItem('rowingSound') !== 'off';
  } catch {}
  function label() {
    document.getElementById('swearButton').disabled = !enabled;
    button.textContent = enabled ? 'Ääni: on' : 'Ääni: ei';
    button.setAttribute('aria-pressed', String(enabled));
  }
  function unlock() {
    if (!enabled) return;
    try {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) {
          enabled = false;
          label();
          return;
        }
        context = new Audio();
        master = context.createGain();
        master.gain.value = .32;
        master.connect(context.destination);
        noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const data = noise.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < data.length; i++) {
          brown = (brown + .025 * (Math.random() * 2 - 1)) / 1.025;
          data[i] = brown * 3 + (Math.random() * 2 - 1) * .16;
        }
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch {
      enabled = false;
      label();
    }
  }
  function wash(duration, volume, frequency, loop = false) {
    if (!enabled || !context || context.state !== 'running') return null;
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain(),
      now = context.currentTime;
    source.buffer = noise;
    source.loop = loop;
    source.playbackRate.value = .88 + Math.random() * .24;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.frequency.exponentialRampToValueAtTime(frequency * .45, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + .035);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    source.start();
    source.stop(now + duration + .05);
    return {
      source,
      gain
    };
  }
  function stop() {
    if (!drive) return;
    const previous = drive;
    drive = null;
    const now = context.currentTime;
    previous.gain.gain.cancelScheduledValues(now);
    previous.gain.gain.setTargetAtTime(0, now, .025);
    try {
      previous.source.stop(now + .1);
    } catch {}
  }
  function stopCrowd() {
    for (const source of crowdNodes) {
      try {
        source.stop();
      } catch {}
    }
    crowdNodes.clear();
  }
  function cheerStart() {
    stopCrowd();
    unlock();
    if (!enabled || !context || !noise) return;
    const now = context.currentTime;
    function track(source, filter, gain, end) {
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      crowdNodes.add(source);
      source.onended = () => {
        crowdNodes.delete(source);
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      source.stop(end);
    }
    // Overlapping, uneven handclaps with a short reverberant tail.
    for (let i = 0; i < 95; i++) {
      const t = now + i * .095 + Math.random() * .09,
        volume = (.18 + Math.random() * .24) * (1 - i / 110);
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        gain = context.createGain();
      source.buffer = noise;
      source.playbackRate.value = 1.4 + Math.random();
      filter.type = 'highpass';
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + .003);
      gain.gain.exponentialRampToValueAtTime(.001, t + .13);
      source.start(t, Math.random());
      track(source, filter, gain, t + .16);
    }
    // Quiet arcade-style crowd whoops beneath the announcer.
    for (let i = 0; i < 12; i++) {
      const t = now + .2 + i * .65 + Math.random() * .3,
        source = context.createOscillator(),
        filter = context.createBiquadFilter(),
        gain = context.createGain();
      source.type = 'sawtooth';
      source.frequency.setValueAtTime(160 + Math.random() * 100, t);
      source.frequency.exponentialRampToValueAtTime(330 + Math.random() * 140, t + .3);
      source.frequency.exponentialRampToValueAtTime(190, t + .7);
      filter.type = 'bandpass';
      filter.frequency.value = 800 + Math.random() * 400;
      filter.Q.value = 1.2;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(.045 * (1 - i / 15), t + .1);
      gain.gain.linearRampToValueAtTime(0, t + .8);
      source.start(t);
      track(source, filter, gain, t + .85);
    }
  }
  function starterShot() {
    unlock();
    if (!enabled || !context || !noise || context.state !== 'running') return;
    const now = context.currentTime;
    // A sharp crack followed by a low, short-lived boom.
    wash(.8, 1.45, 4200);
    const boom = context.createOscillator(),
      gain = context.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(105, now);
    boom.frequency.exponentialRampToValueAtTime(42, now + .48);
    gain.gain.setValueAtTime(.9, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .65);
    boom.connect(gain);
    gain.connect(master);
    boom.onended = () => {
      boom.disconnect();
      gain.disconnect();
    };
    boom.start(now);
    boom.stop(now + .7);
  }
  function catchOar() {
    unlock();
    stop();
    wash(.24, .8, 1700);
    drive = wash(4, .55, 900, true);
  }
  function release() {
    stop();
    wash(.38, .5, 2400);
  }
  button.onclick = () => {
    enabled = !enabled;
    if (!enabled) {
      globalThis.speechSynthesis?.cancel();
      stop();
      stopCrowd();
      if (master) master.gain.value = 0;
    } else {
      unlock();
      if (master) master.gain.value = .32;
    }
    label();
    try {
      localStorage.setItem('rowingSound', enabled ? 'on' : 'off');
    } catch {}
  };
  label();
  return {
    unlock,
    catchOar,
    release,
    stop,
    starterShot,
    cheerStart,
    stopCrowd,
    isEnabled: () => enabled
  };
})();
