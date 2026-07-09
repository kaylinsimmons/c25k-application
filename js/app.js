import {
  PROGRAM,
  getWorkoutTotalSeconds,
  formatDuration,
  workoutId,
  getNextWorkout,
} from './program.js';
import { loadProgress, saveProgress, loadHistory, saveRun } from './storage.js';
import { WorkoutTimer } from './timer.js';
import { GpsTracker, formatDistance } from './gps.js';
import * as audio from './audio.js';
import * as music from './music.js';
import * as familySync from './family-sync.js';
import { isFirebaseConfigured } from './firebase-config.js';

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
  workoutSaveHint: document.getElementById('workout-save-hint'),
  btnStart: document.getElementById('btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnSave: document.getElementById('btn-save'),
  btnStop: document.getElementById('btn-stop'),
  btnAudio: document.getElementById('btn-audio'),
  ringProgress: document.getElementById('ring-progress'),
  musicEnabled: document.getElementById('music-enabled'),
  applePlaylistArt: document.getElementById('apple-playlist-art'),
  applePlaylistName: document.getElementById('apple-playlist-name'),
  applePlaylistSub: document.getElementById('apple-playlist-sub'),
  applePlaylistLink: document.getElementById('apple-playlist-link'),
  workoutBanner: document.getElementById('workout-banner'),
  workoutBannerPhase: document.getElementById('workout-banner-phase'),
  workoutBannerTime: document.getElementById('workout-banner-time'),
  familySetup: document.getElementById('family-setup'),
  familyPartner: document.getElementById('family-partner'),
  familyCode: document.getElementById('family-code'),
  familyHint: document.getElementById('family-hint'),
  familyStatus: document.getElementById('family-status'),
  partnerYouLabel: document.getElementById('partner-you-label'),
  partnerThemLabel: document.getElementById('partner-them-label'),
  partnerYouCount: document.getElementById('partner-you-count'),
  partnerThemCount: document.getElementById('partner-them-count'),
  partnerRunsTitle: document.getElementById('partner-runs-title'),
  partnerRuns: document.getElementById('partner-runs'),
};

let progress = loadProgress();
let timer = null;
let gps = new GpsTracker();
let activeWorkout = null;
let runStartTime = null;
let workoutSavedThisSession = false;
let partnerData = familySync.loadPartnerCache();
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch {
    // Wake lock may be unavailable
  }
}

function releaseWakeLock() {
  wakeLock?.release?.();
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timer?.isRunning()) {
    timer.syncFromClock();
    requestWakeLock();
  }
});

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

  updateWorkoutBanner(name);
}

function updateWorkoutBanner(currentView = null) {
  const active = timer?.isActive() && !timer?.isComplete();
  const onWorkoutView = (currentView ?? document.querySelector('.view.active')?.id) === 'view-workout';

  if (!els.workoutBanner) return;

  if (active && !onWorkoutView) {
    const state = timer.getState();
    els.workoutBannerPhase.textContent = state.phaseLabel;
    els.workoutBannerTime.textContent = formatDuration(Math.max(0, state.remainingSeconds));
    els.workoutBanner.hidden = false;
  } else {
    els.workoutBanner.hidden = true;
  }
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

async function syncToFamily() {
  await familySync.pushFamilyData({
    progress,
    history: loadHistory(),
  });
}

// --- Family sync ---
function renderFamilyCard() {
  const profile = familySync.loadProfile();
  const partnerName = familySync.getPartnerName();

  document.querySelectorAll('.family-name-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.name === profile.name);
  });
  els.familyCode.value = profile.familyCode || '';

  if (!isFirebaseConfigured()) {
    els.familyHint.textContent =
      'Add Firebase config in js/firebase-config.js so you and Mom can sync runs across phones.';
  } else if (profile.name && profile.familyCode) {
    els.familyHint.textContent = `Synced as ${familySync.getDisplayName(profile.name)} · code: ${profile.familyCode}`;
  } else {
    els.familyHint.textContent = 'Pick your name and share the same family code with Mom.';
  }

  const showPartner = profile.name && profile.familyCode;
  els.familySetup.hidden = false;
  els.familyPartner.hidden = !showPartner;

  if (showPartner) {
    const youName = familySync.getDisplayName(profile.name);
    const themName = familySync.getDisplayName(partnerName);
    els.familyStatus.textContent = `You & ${themName} — keep each other accountable`;
    els.partnerYouLabel.textContent = youName;
    els.partnerThemLabel.textContent = themName;
    els.partnerYouCount.textContent = progress.completedWorkouts.length;
    els.partnerRunsTitle.textContent = `${themName}'s recent runs`;

    if (partnerData) {
      els.partnerThemCount.textContent = partnerData.progress?.completedWorkouts?.length ?? 0;
      renderPartnerRuns(partnerData.history ?? [], themName);
    } else {
      els.partnerThemCount.textContent = '—';
      els.partnerRuns.innerHTML =
        '<p class="empty-state">Waiting for Mom to sync her runs…</p>';
    }
  } else {
    els.familyStatus.textContent = 'Set up to see each other\'s runs';
  }
}

function renderPartnerRuns(runs, partnerName) {
  els.partnerRuns.innerHTML = '';
  const recent = runs.slice(0, 3);
  if (recent.length === 0) {
    els.partnerRuns.innerHTML = `<p class="empty-state">${partnerName} hasn't logged a run yet.</p>`;
    return;
  }
  recent.forEach((run) => {
    els.partnerRuns.appendChild(createHistoryCard(run, true, partnerName));
  });
}

document.querySelectorAll('.family-name-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    familySync.saveProfile({ name: btn.dataset.name });
    renderFamilyCard();
  });
});

document.getElementById('btn-family-save')?.addEventListener('click', async () => {
  const code = els.familyCode.value.trim().toLowerCase().replace(/\s+/g, '-');
  const profile = familySync.loadProfile();

  if (!profile.name) {
    alert('Pick whether you are Kaylin or Mom first.');
    return;
  }
  if (!code) {
    alert('Enter a family code you both agree on (e.g. kaylin-mom-run).');
    return;
  }

  familySync.saveProfile({ familyCode: code });
  await syncToFamily();
  familySync.subscribeToPartner((data) => {
    partnerData = data;
    renderFamilyCard();
  });
  renderFamilyCard();
});

// --- Home ---
function renderMusicCard() {
  const playlist = music.getPlaylist();
  const prefs = music.getMusicPrefs();

  els.musicEnabled.checked = prefs.enabled;
  els.applePlaylistArt.src = playlist.artwork;
  els.applePlaylistArt.alt = `${playlist.name} playlist artwork`;
  els.applePlaylistName.textContent = playlist.name;
  els.applePlaylistSub.textContent = playlist.subtitle;
  els.applePlaylistLink.href = playlist.url;
}

function renderHome() {
  renderFamilyCard();
  renderMusicCard();

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
  const profile = familySync.loadProfile();
  const youName = profile.name ? familySync.getDisplayName(profile.name) : null;
  const recent = loadHistory().slice(0, 3);
  if (recent.length === 0) {
    els.workoutList.innerHTML = '<p class="empty-state">No runs yet. Start your first workout!</p>';
  } else {
    recent.forEach((run) => {
      els.workoutList.appendChild(createHistoryCard(run, true, youName));
    });
  }
}

els.nextWorkoutCard?.addEventListener('click', () => {
  const week = parseInt(els.nextWorkoutCard.dataset.week, 10);
  const day = parseInt(els.nextWorkoutCard.dataset.day, 10);
  if (week && day) startWorkout(week, day);
});

els.musicEnabled?.addEventListener('change', () => {
  music.setMusicEnabled(els.musicEnabled.checked);
});

els.workoutBanner?.addEventListener('click', () => {
  showView('workout');
});

els.applePlaylistLink?.addEventListener('click', (e) => {
  e.preventDefault();
  music.openRunningPlaylist();
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
  const profile = familySync.loadProfile();
  const youName = profile.name ? familySync.getDisplayName(profile.name) : null;
  els.historyList.innerHTML = '';
  if (history.length === 0) {
    els.historyList.innerHTML = '<p class="empty-state">Your completed runs will appear here.</p>';
    return;
  }
  history.forEach((run) => {
    els.historyList.appendChild(createHistoryCard(run, false, youName));
  });
}

function createHistoryCard(run, compact = false, runnerName = null) {
  const card = document.createElement('div');
  card.className = `history-card${compact ? ' compact' : ''}`;
  const date = new Date(run.completedAt).toLocaleDateString(undefined, {
    weekday: compact ? undefined : 'short',
    month: 'short',
    day: 'numeric',
    hour: compact ? undefined : 'numeric',
    minute: compact ? undefined : '2-digit',
  });
  const partialBadge = run.completedFully === false
    ? '<span class="history-badge">Partial</span>'
    : '';
  const runnerBadge = runnerName
    ? `<div class="runner-badge">${runnerName}</div>`
    : '';
  card.innerHTML = `
    ${runnerBadge}
    <div class="history-card-header">
      <strong>${run.label}</strong>
      <span class="history-date">${date}</span>
    </div>
    <div class="history-stats">
      <span>${formatDuration(run.durationSeconds)}</span>
      ${run.distanceMeters > 0 ? `<span>${formatDistance(run.distanceMeters)}</span>` : ''}
    </div>
    ${partialBadge}
  `;
  return card;
}

document.getElementById('btn-clear-history')?.addEventListener('click', () => {
  if (confirm('Clear all run history? This cannot be undone.')) {
    localStorage.removeItem('c25k-history');
    renderHistory();
    renderHome();
    syncToFamily();
  }
});

// --- Workout ---
function startWorkout(week, day, { navigate = true } = {}) {
  activeWorkout = PROGRAM.find((w) => w.week === week && w.day === day);
  if (!activeWorkout) return;

  timer?.stop();
  gps.stop();
  workoutSavedThisSession = false;

  els.workoutTitle.textContent = activeWorkout.label;
  els.phaseLabel.textContent = 'Ready';
  els.phaseLabel.className = 'phase-label ready';
  els.timerDisplay.textContent = formatDuration(getWorkoutTotalSeconds(activeWorkout));
  els.elapsedDisplay.textContent = '0:00';
  els.intervalText.textContent = activeWorkout.description;
  els.distanceDisplay.textContent = '0.00 mi';
  els.workoutSaveHint.textContent = '';
  els.workoutSaveHint.className = 'workout-save-hint';
  updateRing(0);
  updateIntervalBar(0);

  els.btnStart.disabled = false;
  els.btnStart.textContent = 'Start';
  els.btnPause.disabled = true;
  els.btnSave.disabled = true;
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
  const inProgress = state.phase !== 'idle' && state.phase !== 'complete';
  const canSave = inProgress && state.elapsedSeconds > 0 && !workoutSavedThisSession;

  els.btnStart.disabled = running;
  els.btnPause.disabled = !running;
  els.btnStop.disabled = state.phase === 'idle';
  els.btnPause.textContent = state.phase === 'paused' ? 'Resume' : 'Pause';
  els.btnSave.disabled = !canSave && !(state.phase === 'complete' && !workoutSavedThisSession);

  if (state.phase === 'complete' && !workoutSavedThisSession) {
    els.workoutSaveHint.textContent = 'Workout finished! Tap Save to log it.';
    els.workoutSaveHint.className = 'workout-save-hint ready';
  } else if (canSave) {
    els.workoutSaveHint.textContent = 'Tap Save anytime to log your progress.';
    els.workoutSaveHint.className = 'workout-save-hint';
  }

  updateWorkoutBanner();
}

function onWorkoutComplete() {
  gps.stop();
  els.btnStart.disabled = false;
  els.btnStart.textContent = 'Start Next';
  els.btnPause.disabled = true;
  els.btnStop.disabled = false;
  els.btnSave.disabled = workoutSavedThisSession;
  onTimerStateChange(timer.getState());
}

function saveCurrentWorkout() {
  if (!activeWorkout || !timer) return false;

  const state = timer.getState();
  if (state.phase === 'idle') return false;

  const isComplete = timer.isComplete();
  const gpsState = gps.getState();
  const id = workoutId(activeWorkout);
  const profile = familySync.loadProfile();

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
    completedFully: isComplete,
    runner: profile.name || 'you',
    runnerName: profile.name ? familySync.getDisplayName(profile.name) : 'You',
  });

  if (isComplete && !progress.completedWorkouts.includes(id)) {
    progress.completedWorkouts.push(id);
    saveProgress(progress);
  }

  workoutSavedThisSession = true;
  els.btnSave.disabled = true;
  els.workoutSaveHint.textContent = isComplete
    ? 'Workout saved! Great job.'
    : 'Progress saved. Keep going or tap End when done.';
  els.workoutSaveHint.className = 'workout-save-hint ready';

  syncToFamily();
  return true;
}

function updateRing(ringProgress) {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - ringProgress);
  els.ringProgress.style.strokeDashoffset = offset;
}

function updateIntervalBar(barProgress) {
  els.intervalProgress.style.width = `${Math.min(100, barProgress * 100)}%`;
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
    requestWakeLock();
    music.playRunningPlaylist().catch(() => {});
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

els.btnSave?.addEventListener('click', () => {
  if (saveCurrentWorkout()) {
    renderHome();
  }
});

els.btnStop?.addEventListener('click', () => {
  if (!timer) return;
  const state = timer.getState();

  if (timer.isRunning() || state.phase === 'paused') {
    if (!workoutSavedThisSession) {
      const shouldSave = confirm('Save this workout before ending?');
      if (shouldSave) {
        saveCurrentWorkout();
      } else if (!confirm('Discard this workout?')) {
        return;
      }
    }
  }

  timer.stop();
  gps.stop();
  releaseWakeLock();
  updateWorkoutBanner();
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
renderMusicCard();
renderHome();
showView('home');

familySync.subscribeToPartner((data) => {
  partnerData = data;
  renderFamilyCard();
});

syncToFamily();
