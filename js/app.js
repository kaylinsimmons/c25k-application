import {
  PROGRAM,
  getWorkoutTotalSeconds,
  formatDuration,
  workoutId,
  getNextWorkout,
} from './program.js';
import { loadProgress, saveProgress, loadHistory, saveRun, loadHomeBackground, saveHomeBackground } from './storage.js';
import { WorkoutTimer } from './timer.js';
import { GpsTracker, formatDistance } from './gps.js';
import * as audio from './audio.js';
import * as music from './music.js';

// --- DOM refs ---
const views = {
  home: document.getElementById('view-home'),
  workout: document.getElementById('view-workout'),
  history: document.getElementById('view-history'),
  program: document.getElementById('view-program'),
};

const els = {
  nextWorkoutCard: document.getElementById('next-workout-card'),
  nextWorkoutLabel: document.getElementById('next-workout-label'),
  nextWorkoutDesc: document.getElementById('next-workout-desc'),
  nextWorkoutDuration: document.getElementById('next-workout-duration'),
  progressSummary: document.getElementById('progress-summary'),
  workoutList: document.getElementById('workout-list'),
  historyList: document.getElementById('history-list'),
  programGrid: document.getElementById('program-grid'),
  phaseLabel: document.getElementById('phase-label'),
  timerDisplay: document.getElementById('timer-display'),
  elapsedDisplay: document.getElementById('elapsed-display'),
  intervalProgress: document.getElementById('interval-progress'),
  intervalText: document.getElementById('interval-text'),
  distanceDisplay: document.getElementById('distance-display'),
  workoutTitle: document.getElementById('workout-title'),
  btnStart: document.getElementById('btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnStop: document.getElementById('btn-stop'),
  btnAudio: document.getElementById('btn-audio'),
  ringProgress: document.getElementById('ring-progress'),
  homeBackground: document.getElementById('home-background'),
  btnChangePhoto: document.getElementById('btn-change-photo'),
  homePhotoInput: document.getElementById('home-photo-input'),
  musicEnabled: document.getElementById('music-enabled'),
  musicStatus: document.getElementById('music-status'),
  btnMusicConnect: document.getElementById('btn-music-connect'),
  btnMusicOpen: document.getElementById('btn-music-open'),
  musicPlaylist: document.getElementById('music-playlist'),
  musicPlaylistUrl: document.getElementById('music-playlist-url'),
};

let progress = loadProgress();
let timer = null;
let gps = new GpsTracker();
let activeWorkout = null;
let runStartTime = null;

// --- Navigation ---
document.querySelectorAll('[data-nav]').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.nav));
});

function showView(name) {
  Object.values(views).forEach((v) => v.classList.remove('active'));
  views[name]?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.nav === name);
  });

  if (name === 'history') renderHistory();
  if (name === 'program') renderProgram();
  if (name === 'home') renderHome();
  if (name === 'workout') ensureWorkoutReady();
}

function getDefaultWorkout() {
  return getNextWorkout(progress.completedWorkouts) ?? PROGRAM[0];
}

function ensureWorkoutReady() {
  if (!timer || timer.isComplete()) {
    const next = getDefaultWorkout();
    startWorkout(next.week, next.day, { navigate: false });
  } else {
    onTimerStateChange(timer.getState());
  }
}

// --- Home ---
function applyHomeBackground() {
  const src = loadHomeBackground();
  if (els.homeBackground && src) {
    els.homeBackground.style.backgroundImage = `url("${src}")`;
  }
}

function renderMusicCard() {
  const prefs = music.getMusicPrefs();
  els.musicEnabled.checked = prefs.enabled;
  els.musicPlaylistUrl.value = prefs.playlistUrl || '';

  if (music.isMusicKitAvailable()) {
    els.musicStatus.textContent = music.isAppleMusicAuthorized()
      ? prefs.playlistName
        ? `Ready: ${prefs.playlistName}`
        : 'Connected — choose a playlist'
      : 'Connect to play your library in-app';
    els.btnMusicConnect.textContent = music.isAppleMusicAuthorized()
      ? 'Refresh Playlists'
      : 'Connect Apple Music';
  } else {
    els.musicStatus.textContent = prefs.playlistUrl
      ? 'Opens your playlist when a run starts'
      : 'Paste a playlist link or open Apple Music';
    els.btnMusicConnect.textContent = 'Save Playlist Link';
  }
}

async function loadMusicPlaylists() {
  if (!music.isMusicKitAvailable() || !music.isAppleMusicAuthorized()) return;

  const playlists = await music.fetchLibraryPlaylists();
  els.musicPlaylist.hidden = playlists.length === 0;
  els.musicPlaylist.innerHTML = '<option value="">Choose a playlist…</option>';
  const prefs = music.getMusicPrefs();

  playlists.forEach((playlist) => {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = playlist.name;
    option.dataset.url = playlist.url;
    if (playlist.id === prefs.playlistId) option.selected = true;
    els.musicPlaylist.appendChild(option);
  });
}

function renderHome() {
  applyHomeBackground();
  renderMusicCard();
  loadMusicPlaylists();
  const next = getNextWorkout(progress.completedWorkouts);
  const completed = progress.completedWorkouts.length;
  const total = PROGRAM.length;

  els.progressSummary.textContent = `${completed} of ${total} workouts complete`;

  if (next) {
    els.nextWorkoutLabel.textContent = next.label;
    els.nextWorkoutDesc.textContent = next.description;
    els.nextWorkoutDuration.textContent = `~${formatDuration(getWorkoutTotalSeconds(next))}`;
    els.nextWorkoutCard.dataset.week = next.week;
    els.nextWorkoutCard.dataset.day = next.day;
    els.nextWorkoutCard.style.display = '';
  } else {
    els.nextWorkoutLabel.textContent = 'Program Complete!';
    els.nextWorkoutDesc.textContent = 'You finished Couch to 5K. Keep running!';
    els.nextWorkoutDuration.textContent = '';
    els.nextWorkoutCard.style.display = '';
  }

  els.workoutList.innerHTML = '';
  const recent = loadHistory().slice(0, 3);
  if (recent.length === 0) {
    els.workoutList.innerHTML = '<p class="empty-state">No runs yet. Start your first workout!</p>';
  } else {
    recent.forEach((run) => {
      els.workoutList.appendChild(createHistoryCard(run, true));
    });
  }
}

els.nextWorkoutCard?.addEventListener('click', () => {
  const week = parseInt(els.nextWorkoutCard.dataset.week, 10);
  const day = parseInt(els.nextWorkoutCard.dataset.day, 10);
  if (week && day) startWorkout(week, day);
});

els.btnChangePhoto?.addEventListener('click', () => {
  els.homePhotoInput?.click();
});

els.homePhotoInput?.addEventListener('change', () => {
  const file = els.homePhotoInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    saveHomeBackground(reader.result);
    applyHomeBackground();
    els.homePhotoInput.value = '';
  };
  reader.readAsDataURL(file);
});

els.musicEnabled?.addEventListener('change', () => {
  music.setMusicEnabled(els.musicEnabled.checked);
  renderMusicCard();
});

els.musicPlaylistUrl?.addEventListener('change', () => {
  const url = els.musicPlaylistUrl.value.trim();
  music.setPlaylist({ id: '', name: 'Custom playlist', url });
  renderMusicCard();
});

els.btnMusicConnect?.addEventListener('click', async () => {
  if (!music.isMusicKitAvailable()) {
    const url = els.musicPlaylistUrl.value.trim();
    if (url) {
      music.setPlaylist({ id: '', name: 'Custom playlist', url });
      renderMusicCard();
    } else {
      alert('Paste an Apple Music playlist link, or tap Open Apple Music.');
    }
    return;
  }

  const result = await music.authorizeAppleMusic();
  if (!result.ok) {
    alert('Could not connect to Apple Music. Check your developer token in js/music-config.js.');
    return;
  }

  await loadMusicPlaylists();
  renderMusicCard();
});

els.musicPlaylist?.addEventListener('change', () => {
  const option = els.musicPlaylist.selectedOptions[0];
  if (!option?.value) return;
  music.setPlaylist({
    id: option.value,
    name: option.textContent,
    url: option.dataset.url || '',
  });
  renderMusicCard();
});

els.btnMusicOpen?.addEventListener('click', () => {
  music.openAppleMusic();
});

// --- Program grid ---
function renderProgram() {
  els.programGrid.innerHTML = '';
  PROGRAM.forEach((w) => {
    const id = workoutId(w);
    const done = progress.completedWorkouts.includes(id);
    const card = document.createElement('button');
    card.className = `program-card${done ? ' completed' : ''}`;
    card.innerHTML = `
      <span class="program-card-week">${w.label}</span>
      <span class="program-card-desc">${w.description}</span>
      ${done ? '<span class="check">✓</span>' : ''}
    `;
    card.addEventListener('click', () => startWorkout(w.week, w.day));
    els.programGrid.appendChild(card);
  });
}

// --- History ---
function renderHistory() {
  const history = loadHistory();
  els.historyList.innerHTML = '';
  if (history.length === 0) {
    els.historyList.innerHTML = '<p class="empty-state">Your completed runs will appear here.</p>';
    return;
  }
  history.forEach((run) => {
    els.historyList.appendChild(createHistoryCard(run));
  });
}

function createHistoryCard(run, compact = false) {
  const card = document.createElement('div');
  card.className = `history-card${compact ? ' compact' : ''}`;
  const date = new Date(run.completedAt).toLocaleDateString(undefined, {
    weekday: compact ? undefined : 'short',
    month: 'short',
    day: 'numeric',
    hour: compact ? undefined : 'numeric',
    minute: compact ? undefined : '2-digit',
  });
  card.innerHTML = `
    <div class="history-card-header">
      <strong>${run.label}</strong>
      <span class="history-date">${date}</span>
    </div>
    <div class="history-stats">
      <span>${formatDuration(run.durationSeconds)}</span>
      ${run.distanceMeters > 0 ? `<span>${formatDistance(run.distanceMeters)}</span>` : ''}
    </div>
  `;
  return card;
}

document.getElementById('btn-clear-history')?.addEventListener('click', () => {
  if (confirm('Clear all run history? This cannot be undone.')) {
    localStorage.removeItem('c25k-history');
    renderHistory();
    renderHome();
  }
});

// --- Workout ---
function startWorkout(week, day, { navigate = true } = {}) {
  activeWorkout = PROGRAM.find((w) => w.week === week && w.day === day);
  if (!activeWorkout) return;

  timer?.stop();
  gps.stop();

  els.workoutTitle.textContent = activeWorkout.label;
  els.phaseLabel.textContent = 'Ready';
  els.phaseLabel.className = 'phase-label ready';
  els.timerDisplay.textContent = formatDuration(getWorkoutTotalSeconds(activeWorkout));
  els.elapsedDisplay.textContent = '0:00';
  els.intervalText.textContent = activeWorkout.description;
  els.distanceDisplay.textContent = '0.00 mi';
  updateRing(0);
  updateIntervalBar(0);

  els.btnStart.disabled = false;
  els.btnStart.textContent = 'Start';
  els.btnPause.disabled = true;
  els.btnStop.disabled = true;

  timer = new WorkoutTimer(activeWorkout, {
    onStateChange: onTimerStateChange,
    onComplete: onWorkoutComplete,
  });

  if (navigate) showView('workout');
}

function onTimerStateChange(state) {
  els.phaseLabel.textContent = state.phaseLabel;
  els.phaseLabel.className = `phase-label ${state.currentType ?? state.phase}`;
  els.timerDisplay.textContent = formatDuration(Math.max(0, state.remainingSeconds));
  els.elapsedDisplay.textContent = formatDuration(state.elapsedSeconds);
  updateRing(state.progress);

  if (state.phase === 'interval') {
    const interval = activeWorkout.intervals[state.intervalIndex];
    const intervalProgress = 1 - state.remainingSeconds / interval.seconds;
    updateIntervalBar(intervalProgress);
    els.intervalText.textContent = `Interval ${state.intervalIndex + 1} of ${state.totalIntervals} · ${interval.type === 'run' ? 'Run' : 'Walk'}`;
  } else if (state.phase === 'warmup') {
    updateIntervalBar(1 - state.remainingSeconds / (5 * 60));
    els.intervalText.textContent = 'Warm up — walk at an easy pace';
  } else if (state.phase === 'cooldown') {
    updateIntervalBar(1 - state.remainingSeconds / (5 * 60));
    els.intervalText.textContent = 'Cool down — slow walk';
  }

  const running = timer.isRunning();
  els.btnStart.disabled = running;
  els.btnPause.disabled = !running;
  els.btnStop.disabled = state.phase === 'idle';
  els.btnPause.textContent = state.phase === 'paused' ? 'Resume' : 'Pause';
}

function onWorkoutComplete(state) {
  gps.stop();
  const id = workoutId(activeWorkout);
  if (!progress.completedWorkouts.includes(id)) {
    progress.completedWorkouts.push(id);
    saveProgress(progress);
  }

  const gpsState = gps.getState();
  saveRun({
    id: crypto.randomUUID(),
    workoutId: id,
    label: activeWorkout.label,
    week: activeWorkout.week,
    day: activeWorkout.day,
    durationSeconds: state.elapsedSeconds,
    distanceMeters: gpsState.totalMeters,
    track: gps.getTrack(),
    completedAt: new Date().toISOString(),
  });

  els.btnStart.disabled = false;
  els.btnStart.textContent = 'Start Next';
  els.btnPause.disabled = true;
  els.btnStop.disabled = false;
}

function updateRing(progress) {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - progress);
  els.ringProgress.style.strokeDashoffset = offset;
}

function updateIntervalBar(progress) {
  els.intervalProgress.style.width = `${Math.min(100, progress * 100)}%`;
}

els.btnStart?.addEventListener('click', async () => {
  if (!timer || timer.isComplete()) {
    ensureWorkoutReady();
  }
  if (!timer) return;
  if (timer.getState().phase === 'idle') {
    runStartTime = Date.now();
    gps.start((state) => {
      els.distanceDisplay.textContent = formatDistance(state.totalMeters);
    });
    music.playSavedPlaylist().catch(() => {});
  }
  timer.start();
  onTimerStateChange(timer.getState());
});

els.btnPause?.addEventListener('click', () => {
  if (!timer) return;
  if (timer.getState().phase === 'paused') {
    timer.start();
  } else {
    timer.pause();
  }
  onTimerStateChange(timer.getState());
});

els.btnStop?.addEventListener('click', () => {
  if (!timer) return;
  if (timer.isRunning() || timer.getState().phase === 'paused') {
    if (!confirm('End this workout early? Progress won\'t be saved.')) return;
  }
  timer.stop();
  gps.stop();
  showView('home');
});

els.btnAudio?.addEventListener('click', () => {
  const enabled = !audio.isAudioEnabled();
  audio.setAudioEnabled(enabled);
  els.btnAudio.textContent = enabled ? '🔊' : '🔇';
  els.btnAudio.classList.toggle('muted', !enabled);
});

// --- PWA service worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// --- Init ---
applyHomeBackground();
renderHome();
showView('home');
music.initMusicKit().catch(() => {});
