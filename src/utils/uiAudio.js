// ============================================================
// 🔊 BungOiAnGi – Web Audio API Sound System
// ============================================================

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, type = 'sine', duration = 0.15, volume = 0.3, delay = 0) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration);
  } catch (_) {}
}

export function playClick() {
  playTone(800, 'sine', 0.08, 0.2);
}

export function playSpinTick() {
  playTone(600 + Math.random() * 300, 'square', 0.04, 0.1);
}

export function playWin() {
  // Fanfare – ascending joyful chime
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => playTone(f, 'sine', 0.25, 0.35, i * 0.12));
}

export function playBup() {
  // Bụp – fun popping sound
  try {
    const c = getCtx();
    // Impact noise
    const bufSize = c.sampleRate * 0.08;
    const buffer = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.5;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.8, c.currentTime);
    src.start();
  } catch (_) {}
  // Follow-up chime
  setTimeout(() => playTone(880, 'sine', 0.3, 0.4), 80);
  setTimeout(() => playTone(1046, 'sine', 0.2, 0.3), 200);
}

export function playSelect() {
  playTone(440, 'sine', 0.1, 0.15);
  playTone(550, 'sine', 0.1, 0.15, 0.08);
}

export function playBattle() {
  playTone(300, 'sawtooth', 0.05, 0.2);
  playTone(400, 'sawtooth', 0.05, 0.2, 0.06);
  playTone(500, 'square', 0.08, 0.2, 0.12);
}
