let audioEnabled = true;

export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}

function speak(text) {
  if (!audioEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function beep(frequency = 880, duration = 0.15) {
  if (!audioEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be blocked until user gesture
  }
}

export function announceWarmup() {
  speak('Warm up. Start walking.');
  beep(440);
}

export function announceRun() {
  speak('Start running.');
  beep(880, 0.2);
}

export function announceWalk() {
  speak('Walk now.');
  beep(550, 0.2);
}

export function announceCooldown() {
  speak('Cool down. Nice work!');
  beep(660);
}

export function announceComplete() {
  speak('Workout complete! Great job.');
  beep(880, 0.3);
  setTimeout(() => beep(1100, 0.3), 200);
}

export function announceHalfway() {
  speak('Halfway there. Keep going!');
}

export function announceCountdown() {
  beep(1000, 0.1);
}

export function resumeAudioContext() {
  // Unlock speech synthesis on iOS after user tap
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}
