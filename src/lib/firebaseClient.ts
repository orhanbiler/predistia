// Client-side Firebase initialization with Analytics
// Provided config per user request
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAc_EFjZakcW9SxpmNN8nNd8R01it2F08U",
  authDomain: "predistia.firebaseapp.com",
  projectId: "predistia",
  storageBucket: "predistia.firebasestorage.app",
  messagingSenderId: "911903237943",
  appId: "1:911903237943:web:044bd49216425953895cb2",
  measurementId: "G-CPLR9JQ4J6"
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let firestore: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (!app) getFirebaseApp();
  if (!app) return null;
  if (!analytics && (await isSupported().catch(() => false))) {
    analytics = getAnalytics(app);
  }
  return analytics;
}

export const db: Firestore = (() => {
  if (typeof window === 'undefined') {
    // Return a placeholder for SSR
    return {} as Firestore;
  }
  if (!app) {
    app = getFirebaseApp();
  }
  if (!firestore && app) {
    firestore = getFirestore(app);
  }
  return firestore!;
})();

