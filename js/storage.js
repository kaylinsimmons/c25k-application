const PROGRESS_KEY = 'c25k-progress';
const HISTORY_KEY = 'c25k-history';

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
