/**
 * Firebase config for family workout sync.
 * Create a free project at https://console.firebase.google.com
 * Enable Firestore, then paste your web app config here.
 * Both Kaylin and Mom use the same family code in the app.
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}
