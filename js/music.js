import { APPLE_MUSIC_DEVELOPER_TOKEN, MUSIC_APP } from './music-config.js';

const MUSIC_PREFS_KEY = 'c25k-music-prefs';

const defaultPrefs = {
  enabled: false,
  playlistId: '',
  playlistName: '',
  playlistUrl: '',
};

let musicKit = null;
let initPromise = null;

function loadPrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(MUSIC_PREFS_KEY)) };
  } catch {
    return { ...defaultPrefs };
  }
}

function savePrefs(prefs) {
  localStorage.setItem(MUSIC_PREFS_KEY, JSON.stringify(prefs));
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

export function setPlaylist(playlist) {
  const prefs = loadPrefs();
  prefs.playlistId = playlist.id ?? '';
  prefs.playlistName = playlist.name ?? '';
  prefs.playlistUrl = playlist.url ?? '';
  savePrefs(prefs);
  return prefs;
}

export function isMusicKitAvailable() {
  return Boolean(APPLE_MUSIC_DEVELOPER_TOKEN && window.MusicKit);
}

export async function initMusicKit() {
  if (!isMusicKitAvailable()) return null;
  if (musicKit) return musicKit;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    musicKit = await window.MusicKit.configure({
      developerToken: APPLE_MUSIC_DEVELOPER_TOKEN,
      app: MUSIC_APP,
    });
    return musicKit;
  })();

  return initPromise;
}

export async function authorizeAppleMusic() {
  const kit = await initMusicKit();
  if (!kit) return { ok: false, reason: 'no-token' };

  const userToken = await kit.authorize();
  return { ok: Boolean(userToken), authorized: kit.isAuthorized };
}

export function isAppleMusicAuthorized() {
  return Boolean(musicKit?.isAuthorized);
}

export async function fetchLibraryPlaylists() {
  const kit = await initMusicKit();
  if (!kit?.isAuthorized) return [];

  const response = await kit.api.music('v1/me/library/playlists', { limit: 25 });
  return (response.data?.data ?? []).map((playlist) => ({
    id: playlist.id,
    name: playlist.attributes?.name ?? 'Playlist',
    url: playlist.attributes?.url ?? '',
  }));
}

export async function playSavedPlaylist() {
  const prefs = loadPrefs();
  if (!prefs.enabled) return { ok: false, reason: 'disabled' };

  const kit = await initMusicKit();
  if (kit?.isAuthorized && prefs.playlistId) {
    await kit.setQueue({ playlist: prefs.playlistId });
    await kit.play();
    return { ok: true, mode: 'musickit' };
  }

  if (prefs.playlistUrl) {
    window.open(prefs.playlistUrl, '_blank', 'noopener');
    return { ok: true, mode: 'external' };
  }

  window.open('music://', '_blank');
  return { ok: true, mode: 'app' };
}

export async function pauseAppleMusic() {
  if (musicKit?.isAuthorized && musicKit?.player?.isPlaying) {
    await musicKit.pause();
  }
}

export function openAppleMusic() {
  const prefs = loadPrefs();
  const url = prefs.playlistUrl || 'https://music.apple.com/';
  window.open(url, '_blank', 'noopener');
}
