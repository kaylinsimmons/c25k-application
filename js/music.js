import { RUNNING_PLAYLIST } from './music-config.js';

const MUSIC_PREFS_KEY = 'c25k-music-prefs';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(MUSIC_PREFS_KEY)) ?? { enabled: true };
  } catch {
    return { enabled: true };
  }
}

function savePrefs(prefs) {
  localStorage.setItem(MUSIC_PREFS_KEY, JSON.stringify(prefs));
}

export function getPlaylist() {
  return RUNNING_PLAYLIST;
}

export function getMusicPrefs() {
  return loadPrefs();
}

export function setMusicEnabled(enabled) {
  const prefs = loadPrefs();
  prefs.enabled = enabled;
  savePrefs(prefs);
  return prefs;
}

export function openRunningPlaylist() {
  window.open(RUNNING_PLAYLIST.url, '_blank', 'noopener');
}

export async function playRunningPlaylist() {
  const prefs = loadPrefs();
  if (!prefs.enabled) return { ok: false, reason: 'disabled' };
  openRunningPlaylist();
  return { ok: true };
}
