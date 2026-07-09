const PROGRESS_KEY = 'c25k-progress';
const HISTORY_KEY = 'c25k-history';
const HOME_BG_KEY = 'c25k-home-background';
const DEFAULT_HOME_BG = './images/kaylin-and-mom.png';

export function loadHomeBackground() {
  return localStorage.getItem(HOME_BG_KEY) || DEFAULT_HOME_BG;
}

export function saveHomeBackground(dataUrl) {
  localStorage.setItem(HOME_BG_KEY, dataUrl);
}

export function clearHomeBackground() {
  localStorage.removeItem(HOME_BG_KEY);
}

export function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    return data ?? { completedWorkouts: [], currentWeek: 1, currentDay: 1 };
  } catch {
    return { completedWorkouts: [], currentWeek: 1, currentDay: 1 };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveRun(run) {
  const history = loadHistory();
  history.unshift(run);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
