let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainVal, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

export function playLetterClick() {
  playTone(800, 0.05, 'sine', 0.08);
  vibrate(10);
}

export function playWordFound() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Rising two-tone chirp C5→E5
  [523, 659].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, t + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.08);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.08);
  });
  vibrate([30, 50, 30]);
}

export function playWordRejected() {
  playTone(150, 0.2, 'sawtooth', 0.1);
  vibrate([50, 30, 50]);
}

export function playPowerupUse() {
  const ac = getCtx();
  const t = ac.currentTime;
  [440, 554, 659, 880].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, t + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.06);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.05);
    osc.stop(t + i * 0.05 + 0.06);
  });
  vibrate([20, 30, 20, 30, 40]);
}

export function playFreeze() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.setValueAtTime(1000, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
  vibrate(200);
}

export function playCountdown(final = false) {
  playTone(final ? 880 : 600, 0.15, 'sine', 0.12);
  vibrate(final ? 80 : 40);
}

export function playGameWin() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Triumphant C-E-G chord
  [523, 659, 784].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, t + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + 0.4);
  });
  vibrate([50, 50, 50, 50, 100]);
}

export function playGameLose() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Descending minor chord
  [494, 392, 330].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, t + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + 0.4);
  });
  vibrate([100, 50, 150]);
}

export function playRoundStart() {
  playTone(660, 0.12, 'sine', 0.12);
  vibrate(30);
}

export function playShieldBlock() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.2);
  vibrate([30, 20, 30]);
}

export function playBlind() {
  playTone(200, 0.3, 'sawtooth', 0.1);
  vibrate(150);
}
