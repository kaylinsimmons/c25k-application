import { FIREBASE_CONFIG, isFirebaseConfigured } from './firebase-config.js';

const PROFILE_KEY = 'c25k-family-profile';
const PARTNER_KEY = 'c25k-partner-cache';

let db = null;
let initPromise = null;
let partnerListener = null;
let onPartnerUpdate = null;

const defaultProfile = {
  name: '',
  familyCode: '',
};

export function loadProfile() {
  try {
    return { ...defaultProfile, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) };
  } catch {
    return { ...defaultProfile };
  }
}

export function saveProfile(profile) {
  const next = { ...loadProfile(), ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function getPartnerName() {
  const profile = loadProfile();
  if (profile.name === 'kaylin') return 'mom';
  if (profile.name === 'mom') return 'kaylin';
  return '';
}

export function getDisplayName(name) {
  if (name === 'kaylin') return 'Kaylin';
  if (name === 'mom') return 'Mom';
  return name;
}

export function loadPartnerCache() {
  try {
    return JSON.parse(localStorage.getItem(PARTNER_KEY)) ?? null;
  } catch {
    return null;
  }
}

function savePartnerCache(data) {
  localStorage.setItem(PARTNER_KEY, JSON.stringify(data));
}

export function isSyncReady() {
  const profile = loadProfile();
  return isFirebaseConfigured() && profile.name && profile.familyCode;
}

async function initFirestore() {
  if (!isFirebaseConfigured()) return null;
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { initializeApp } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
    );
    const { getFirestore } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    return db;
  })();

  return initPromise;
}

export async function pushFamilyData({ progress, history }) {
  if (!isSyncReady()) return { ok: false, reason: 'not-configured' };

  try {
    const firestore = await initFirestore();
    const { doc, setDoc, serverTimestamp } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );
    window.__firestoreHelpers = { doc };

    const profile = loadProfile();
    const ref = doc(firestore, 'families', profile.familyCode, 'members', profile.name);
    await setDoc(
      ref,
      {
        displayName: getDisplayName(profile.name),
        progress,
        history: history.slice(0, 20),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (err) {
    console.warn('Family sync push failed', err);
    return { ok: false, reason: 'error' };
  }
}

export async function subscribeToPartner(callback) {
  onPartnerUpdate = callback;
  partnerListener?.();

  if (!isSyncReady()) {
    const cached = loadPartnerCache();
    if (cached) callback(cached);
    return;
  }

  try {
    const firestore = await initFirestore();
    const { doc, onSnapshot } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );

    const profile = loadProfile();
    const partner = getPartnerName();
    if (!partner) return;

    const ref = doc(firestore, 'families', profile.familyCode, 'members', partner);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        const data = snap.data();
        const payload = {
          displayName: data.displayName ?? getDisplayName(partner),
          progress: data.progress ?? { completedWorkouts: [] },
          history: data.history ?? [],
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
        };
        savePartnerCache(payload);
        callback(payload);
      },
      () => callback(loadPartnerCache())
    );
    partnerListener = unsubscribe;
  } catch (err) {
    console.warn('Family sync subscribe failed', err);
    callback(loadPartnerCache());
  }
}

export function stopPartnerListener() {
  if (typeof partnerListener === 'function') {
    partnerListener();
  }
  partnerListener = null;
}
